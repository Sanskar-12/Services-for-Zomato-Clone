import axios from "axios";
import getBuffer from "../config/datauri.js";
import TryCatch from "../middlewares/trycatch.js";
import { Rider } from "../models/Rider.js";
export const addRiderProfile = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    if (user.role !== "rider") {
        return res.status(403).json({
            success: false,
            message: "Only riders can create rider profile",
        });
    }
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Rider image is required",
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
    const { phoneNumber, aadharNumber, drivingLicenseNumber, latitude, longitude, } = req.body;
    if (!phoneNumber ||
        !aadharNumber ||
        !drivingLicenseNumber ||
        latitude === undefined ||
        longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the fields",
        });
    }
    const existingProfile = await Rider.findOne({ userId: user?._id });
    if (existingProfile) {
        return res.status(400).json({
            success: false,
            message: "Rider profile already exist",
        });
    }
    const riderProfile = await Rider.create({
        userId: user?._id,
        picture: uploadResult?.url,
        phoneNumber,
        aadharNumber,
        drivingLicenseNumber,
        isVerified: false,
        location: {
            type: "Point",
            coordinates: [longitude, latitude],
        },
        isAvailable: false,
    });
    return res.status(200).json({
        success: true,
        message: "Rider Profile Created Successfully",
        riderProfile,
    });
});
export const fetchMyProfile = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const riderAccount = await Rider.findOne({
        userId: user?._id,
    });
    return res.status(200).json({
        success: true,
        riderAccount,
    });
});
export const toggleRiderAvailability = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    if (user.role !== "rider") {
        return res.status(403).json({
            success: false,
            message: "Only riders can create rider profile",
        });
    }
    const { isAvailable, latitude, longitude } = req.body;
    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "isAvailable must be a boolean",
        });
    }
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: "Location is required",
        });
    }
    const rider = await Rider.findOne({
        userId: user?._id,
    });
    if (!rider) {
        return res.status(404).json({
            success: false,
            message: "Rider Profile not found",
        });
    }
    if (isAvailable && !rider.isVerified) {
        return res.status(403).json({
            success: false,
            message: "Rider is not verified",
        });
    }
    rider.isAvailable = isAvailable;
    rider.location = {
        type: "Point",
        coordinates: [longitude, latitude],
    };
    rider.lastActiveAt = new Date();
    await rider.save();
    return res.status(200).json({
        success: true,
        message: isAvailable ? "Rider is now online" : "Rider is now offline",
        rider,
    });
});
