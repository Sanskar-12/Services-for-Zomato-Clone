import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { Address } from "../models/Address.js";
import { Cart } from "../models/Cart.js";
import { IMenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { IRestaurant, Restaurant } from "../models/Restaurant.js";
import { publishEvent } from "../config/order.producer.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Please Login",
    });
  }

  const userId = user?._id;

  const { paymentMethod, addressId, distance } = req.body;

  if (!addressId) {
    return res.status(400).json({
      success: false,
      message: "Address is required",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) {
    return res.status(404).json({
      success: false,
      message: "Address not found",
    });
  }

  const cartItems = await Cart.find({
    userId,
  })
    .populate<{
      itemId: IMenuItem;
    }>("itemId")
    .populate<{
      restaurantId: IRestaurant;
    }>("restaurantId");

  if (cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty",
    });
  }

  const firstCartItem = cartItems[0];

  if (!firstCartItem || !firstCartItem.restaurantId) {
    return res.status(400).json({
      success: false,
      message: "Invalid Cart Data",
    });
  }

  const restaurantId = firstCartItem?.restaurantId?._id;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "No Restaurant with this id",
    });
  }

  if (!restaurant.isOpen) {
    return res.status(404).json({
      success: false,
      message: "Sorry this restaurant is closed for now",
    });
  }

  let subtotal = 0;

  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId;

    if (!item) {
      throw new Error("Invalid cart item");
    }

    const itemTotal = item.price * cart.quantity;
    subtotal = subtotal + itemTotal;

    return {
      itemId: item?._id?.toString(),
      name: item?.name,
      price: item?.price,
      quantity: cart?.quantity,
    };
  });

  const deliveryFee = subtotal < 250 ? 49 : 0;
  const platformFee = 7;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [longitude, latitude] = address.location.coordinates;

  const riderAmount = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId,
    restaurantId: restaurant?._id?.toString(),
    restaurantName: restaurant?.name,
    riderId: null,
    distance,
    riderAmount,
    items: orderItems,
    subtotal,
    deliveryFee,
    platformFee,
    totalAmount,
    addressId: address?._id?.toString(),
    deliveryAddress: {
      formattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },
    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expiresAt,
  });

  await Cart.deleteMany({ userId });

  return res.status(200).json({
    success: true,
    message: "Order Created Successfully",
    orderId: order?._id?.toString(),
    amount: totalAmount,
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Order already paid",
    });
  }

  return res.status(200).json({
    success: true,
    orderId: order?._id,
    amount: order.totalAmount,
    currency: "INR",
  });
});

export const fetchUserForOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const userId = order?.userId;

  const { data } = await axios.get(
    `${process.env.AUTH_SERVICE}/api/auth/get/user/${userId}`,
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );

  return res.status(200).json({
    success: true,
    user: data.user,
  });
});

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please Login",
      });
    }

    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant Id is required",
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;

    const orders = await Order.find({
      restaurantId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  },
);

const ALLOWED_STATUS = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please Login",
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order not completed",
      });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.ownerId !== user?._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are not allowed to update this order",
      });
    }

    order.status = status;

    await order.save();

    // send message to user about the order status
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
          orderId: order?._id,
          status: order.status,
        },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    // assign order to riders
    if (status === "ready_for_rider") {
      console.log(
        "Publising Order Ready for rider event for order ",
        order?._id,
      );

      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order?._id,
        restaurantId: restaurant?._id,
        location: restaurant.autoLocation,
      });

      console.log("Event published successfully");
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  },
);

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Please Login",
    });
  }

  const orders = await Order.find({
    userId: user?._id?.toString(),
    paymentStatus: "paid",
  }).sort({
    createdAt: -1,
  });

  return res.status(200).json({ success: true, orders });
});

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please Login",
      });
    }

    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order?.userId !== user?._id?.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not allowed to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  },
);

export const assignRiderToOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const { orderId, riderId, riderName, riderPhone } = req.body;

  const order = await Order.findById(orderId);

  if (order?.riderId !== null) {
    return res.status(400).json({
      succes: false,
      message: "Order already taken",
    });
  }

  const orderUpdated = await Order.findByIdAndUpdate(
    {
      _id: orderId,
      riderId: null,
    },
    {
      riderId,
      riderName,
      riderPhone,
      status: "rider_assigned",
    },
    {
      new: true,
    },
  );

  // send notification to user
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );

  // send notification to restaurant
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${order.restaurantId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );

  return res.status(200).json({
    success: true,
    message: "Rider assigned Successfully",
    order: orderUpdated,
  });
});

export const getCurrentOrderForRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const { riderId } = req.body;

  if (!riderId) {
    return res.status(400).json({
      success: false,
      message: "Rider id is required",
    });
  }

  const order = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  }).populate("restaurantId");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (order.status === "rider_assigned") {
    order.status = "picked_up";

    await order.save();

    // send notification to restaurant
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    // send notification to user
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
    });
  }

  if (order.status === "picked_up") {
    order.status = "delivered";

    await order.save();

    // send notification to restaurant
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    // send notification to user
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
    });
  }
});
