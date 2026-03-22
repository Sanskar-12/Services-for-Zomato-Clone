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
export const updateStatusRestaurant = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const { status } = req.body;
    if (typeof status !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "Status must be boolean",
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
    restaurant.isOpen = status;
    await restaurant.save();
    return res.status(200).json({
        success: true,
        message: "Restaurant Status Updated",
        restaurant,
    });
});
export const updateRestaurant = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const { name, description } = req.body;
    const restaurant = await Restaurant.findOne({
        ownerId: user?._id,
    });
    if (!restaurant) {
        return res.status(400).json({
            success: false,
            message: "No Restaurant Found",
        });
    }
    if (name) {
        restaurant.name = name;
    }
    if (description) {
        restaurant.description = description;
    }
    await restaurant.save();
    return res.status(200).json({
        success: true,
        message: "Restaurant Details Updated",
        restaurant,
    });
});
export const getNearByRestaurant = TryCatch(async (req, res) => {
    const { latitude, longitude, radius = 5000, search = "" } = req.query;
    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: "Latitude and Longitude are required",
        });
    }
    const query = {
        isVerified: true,
    };
    if (search && typeof search === "string") {
        query.name = {
            $regex: search,
            $options: "i",
        };
    }
    const restaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [Number(longitude), Number(latitude)],
                },
                distanceField: "distance",
                maxDistance: 5000, // 5km
                spherical: true,
                query,
            },
        },
        {
            $sort: {
                isOpen: -1,
                distance: 1,
            },
        },
        {
            $addFields: {
                distanceKm: {
                    $round: [{ $divide: ["$distance", 1000] }, 2],
                },
            },
        },
    ]);
    return res.status(200).json({
        success: true,
        count: restaurants.length,
        restaurants,
    });
});
export const fetchSingleRestaurant = TryCatch(async (req, res) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "No Restaurant found",
        });
    }
    return res.status(200).json({
        success: true,
        restaurant,
    });
});
