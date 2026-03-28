import axios from "axios";
import getBuffer from "../config/datauri.js";
import TryCatch from "../middlewares/trycatch.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
export const addMenuItem = TryCatch(async (req, res) => {
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
        return res.status(404).json({
            success: false,
            message: "No Restaurant found",
        });
    }
    const { name, description, price } = req.body;
    if (!name || !price) {
        return res.status(404).json({
            success: false,
            message: "Name and Price are required",
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
    const item = await MenuItem.create({
        name,
        description,
        price,
        restaurantId: restaurant?._id,
        image: uploadResult.url,
    });
    res.status(200).json({
        success: true,
        message: "Item Added Successfully",
        item,
    });
});
export const getAllItems = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Id is required",
        });
    }
    const items = await MenuItem.find({ restaurantId: id });
    res.status(200).json({
        success: true,
        items,
    });
});
export const deleteMenuItem = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const { itemId } = req.params;
    if (!itemId) {
        return res.status(400).json({
            success: false,
            message: "Item Id is required",
        });
    }
    const item = await MenuItem.findById(itemId);
    if (!item) {
        return res.status(404).json({
            success: false,
            message: "No Item found",
        });
    }
    const restaurant = await Restaurant.findOne({
        ownerId: user?._id,
        _id: item.restaurantId,
    });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "No Restaurant found",
        });
    }
    await item.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Menu Item deleted successfully",
    });
});
export const toggleMenuItemAvailability = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorised",
        });
    }
    const { itemId } = req.params;
    if (!itemId) {
        return res.status(400).json({
            success: false,
            message: "Item Id is required",
        });
    }
    const item = await MenuItem.findById(itemId);
    if (!item) {
        return res.status(404).json({
            success: false,
            message: "No Item found",
        });
    }
    const restaurant = await Restaurant.findOne({
        ownerId: user?._id,
        _id: item.restaurantId,
    });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: "No Restaurant found",
        });
    }
    item.isAvailable = !item.isAvailable;
    await item.save();
    return res.status(200).json({
        success: true,
        message: `Item marked as ${item.isAvailable ? "available" : "unavailable"}`,
    });
});
