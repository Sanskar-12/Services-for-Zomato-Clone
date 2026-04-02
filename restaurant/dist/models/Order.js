import mongoose from "mongoose";
const schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    restaurantId: {
        type: String,
        required: true,
    },
    restaurantName: {
        type: String,
        required: true,
    },
    riderId: {
        type: String,
        default: null,
    },
    riderPhone: {
        type: Number,
        default: null,
    },
    riderName: {
        type: String,
        default: null,
    },
    distance: {
        type: Number,
        default: null,
    },
    riderAmount: {
        type: Number,
        default: null,
    },
    items: [
        {
            itemId: String,
            name: String,
            price: Number,
            quantity: Number,
        },
    ],
    subtotal: Number,
    deliveryFee: Number,
    platformFee: Number,
    totalAmount: Number,
    addressId: {
        type: String,
        required: true,
    },
    deliveryAddress: {
        formattedAddress: {
            type: String,
            required: true,
        },
        mobile: {
            type: Number,
            required: true,
        },
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        },
    },
    status: {
        type: String,
        enum: [
            "placed",
            "accepted",
            "preparing",
            "ready_for_rider",
            "rider_assigned",
            "picked_up",
            "delivered",
            "cancelled",
        ],
        default: "placed",
    },
    paymentMethod: {
        type: String,
        enum: ["razorpay", "stripe"],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    expiresAt: {
        type: Date,
        index: {
            expireAfterSeconds: 0,
        },
    },
}, {
    timestamps: true,
});
export const Order = mongoose.model("Order", schema);
