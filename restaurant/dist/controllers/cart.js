import mongoose from "mongoose";
import TryCatch from "../middlewares/trycatch.js";
import { Cart } from "../models/Cart.js";
export const addToCart = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const { restaurantId, itemId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(restaurantId) ||
        !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid restaurant and item Id",
        });
    }
    const cartFromDifferentRestaurant = await Cart.findOne({
        userId: userId,
        restaurantId: {
            $ne: new mongoose.Types.ObjectId(restaurantId),
        },
    });
    if (cartFromDifferentRestaurant) {
        return res.status(400).json({
            success: false,
            message: "You can order from only one restaurant at a time. Please clear your cart first to add items from this restaurant.",
        });
    }
    const cartItem = await Cart.findOneAndUpdate({ userId, restaurantId, itemId }, {
        $inc: {
            quantity: 1,
        },
        $setOnInsert: {
            userId,
            restaurantId,
            itemId,
        },
    }, {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
    });
    return res.status(200).json({
        success: true,
        message: "Added to Cart Successfully",
        cart: cartItem,
    });
});
export const fetchMyCart = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const cartItems = await Cart.find({ userId })
        .populate("itemId")
        .populate("restaurantId");
    let subtotal = 0;
    let cartLength = 0;
    for (const cartItem of cartItems) {
        const item = cartItem.itemId;
        subtotal = subtotal + item.price * cartItem.quantity;
        cartLength = cartLength + cartItem.quantity;
    }
    return res.status(200).json({
        success: true,
        cartLength,
        subtotal,
        cart: cartItems,
    });
});
export const incrementCartItem = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const { itemId } = req.body;
    if (!userId || !itemId) {
        return res.status(400).json({
            success: false,
            message: "Invalid request",
        });
    }
    const cartItem = await Cart.findOneAndUpdate({
        userId,
        itemId,
    }, {
        $inc: {
            quantity: 1,
        },
    }, {
        returnDocument: "after",
    });
    if (!cartItem) {
        return res.status(404).json({
            success: false,
            message: "Item not found",
        });
    }
    return res.status(200).json({
        success: true,
        message: "Quantity increased",
        cartItem,
    });
});
export const decrementCartItem = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const { itemId } = req.body;
    if (!userId || !itemId) {
        return res.status(400).json({
            success: false,
            message: "Invalid request",
        });
    }
    const cartItem = await Cart.findOne({
        userId,
        itemId,
    });
    if (!cartItem) {
        return res.status(404).json({
            success: false,
            message: "Item not found",
        });
    }
    if (cartItem?.quantity === 1) {
        await cartItem.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Item Removed from Cart",
        });
    }
    cartItem.quantity = cartItem.quantity - 1;
    await cartItem.save();
    return res.status(200).json({
        success: true,
        message: "Quantity decreased",
        cartItem,
    });
});
export const clearCart = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    await Cart.deleteMany({ userId });
    return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
    });
});
