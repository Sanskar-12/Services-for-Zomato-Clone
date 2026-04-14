import { ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import { getRestaurantCollection, getRiderCollection, } from "../utils/collection.js";
export const getPendingRestaurants = TryCatch(async (req, res) => {
    const restaurants = await (await getRestaurantCollection())
        .find({ isVerified: false })
        .toArray();
    return res.status(200).json({
        success: true,
        count: restaurants.length,
        restaurants,
    });
});
export const getPendingRiders = TryCatch(async (req, res) => {
    const riders = await (await getRiderCollection())
        .find({ isVerified: false })
        .toArray();
    return res.status(200).json({
        success: true,
        count: riders.length,
        riders,
    });
});
export const verifyRestaurant = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
        return res.status(400).json({
            success: false,
            message: "Invalid resturant id",
        });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid object id",
        });
    }
    const result = await (await getRestaurantCollection()).updateOne({ _id: new ObjectId(id) }, {
        $set: {
            isVerified: true,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        return res.status(404).json({
            success: false,
            message: "Restaurant not found",
        });
    }
    return res.status(200).json({
        success: true,
        message: "Restaurant verified successfully",
    });
});
export const verifyRider = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
        return res.status(400).json({
            success: false,
            message: "Invalid rider id",
        });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid object id",
        });
    }
    const result = await (await getRiderCollection()).updateOne({ _id: new ObjectId(id) }, {
        $set: {
            isVerified: true,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        return res.status(404).json({
            success: false,
            message: "Rider not found",
        });
    }
    return res.status(200).json({
        success: true,
        message: "Rider verified successfully",
    });
});
