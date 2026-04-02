import mongoose from "mongoose";
const schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        required: true,
    },
    formattedAddress: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
}, {
    timestamps: true,
});
schema.index({
    location: "2dsphere",
});
export const Address = mongoose.model("Address", schema);
