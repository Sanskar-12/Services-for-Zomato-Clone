import axios from "axios";
import TryCatch from "../middlewares/trycatch.js";
import { Address } from "../models/Address.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Restaurant } from "../models/Restaurant.js";
export const createOrder = TryCatch(async (req, res) => {
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
        .populate("itemId")
        .populate("restaurantId");
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
    const { data } = await axios.get(`${process.env.AUTH_SERVICE}/api/auth/get/user/${userId}`, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
    });
    return res.status(200).json({
        success: true,
        user: data.user,
    });
});
