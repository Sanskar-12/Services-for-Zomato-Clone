import mongoose, { Schema } from "mongoose";
const schema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    restaurantId: {
        type: mongoose.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true,
    },
    itemId: {
        type: mongoose.Types.ObjectId,
        ref: "MenuItem",
        required: true,
        index: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
}, {
    timestamps: true,
});
schema.index({
    userId: 1,
    restaurantId: 1,
    itemId: 1,
}, {
    unique: true,
});
export const Cart = mongoose.model("Cart", schema);
