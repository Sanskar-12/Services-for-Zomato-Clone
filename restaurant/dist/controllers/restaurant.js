import axios from "axios";
import getBuffer from "../config/datauri.js";
import TryCatch from "../middlewares/trycatch.js";
import { Restaurant } from "../models/Restaurant.js";
import jwt from "jsonwebtoken";
export const addRestaurant = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const existingRestaurant = await Restaurant.findOne({
        ownerId: user?._id,
    });
    if (existingRestaurant) {
        return res.status(400).json({
            success: false,
            message: "You already have a Restaurant",
        });
    }
    const { name, description, latitude, longitude, formattedAddress, phone } = req.body;
    if (!name || !latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the details",
        });
    }
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Please provide the image of the restaurant",
        });
    }
    const fileBuffer = getBuffer(file);
    if (!fileBuffer?.content) {
        return res.status(400).json({
            success: false,
            message: "Failed to create the file buffer",
        });
    }
    const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVICE}/api/utils/upload`, {
        buffer: fileBuffer?.content,
    });
    const restaurant = await Restaurant.create({
        name,
        description,
        phone,
        image: uploadResult?.url,
        ownerId: user?._id,
        autoLocation: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
            formattedAddress,
        },
        isVerified: false,
    });
    return res.status(201).json({
        success: true,
        message: "Restaurant Created Successfully",
        restaurant,
    });
});
export const fetchMyRestaurant = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const restaurant = await Restaurant.findOne({
        ownerId: user?._id,
    });
    if (!restaurant) {
        return res.status(400).json({
            success: false,
            message: "No Restaurant Found",
        });
    }
    if (!user?.restaurantId) {
        const token = jwt.sign({
            user: {
                ...req.user,
                restaurantId: restaurant?._id,
            },
        }, process.env.JWT_SECRET, {
            expiresIn: "15d",
        });
        return res.status(200).json({
            success: true,
            token,
            restaurant,
        });
    }
    return res.status(200).json({
        success: true,
        restaurant,
    });
});
