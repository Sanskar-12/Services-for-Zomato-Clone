import TryCatch from "../middlewares/trycatch.js";
import { Address } from "../models/Address.js";
export const addAddress = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const { mobile, formattedAddress, latitude, longitude } = req.body;
    if (!mobile || !formattedAddress || !latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: "Please give all fields",
        });
    }
    const newAddress = await Address.create({
        userId,
        mobile,
        formattedAddress,
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
        },
    });
    return res.status(200).json({
        success: true,
        message: "Address Added Successfully",
        address: newAddress,
    });
});
export const deleteAddress = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Id is Required",
        });
    }
    const address = await Address.findOne({
        _id: id,
        userId,
    });
    if (!address) {
        return res.status(404).json({
            success: false,
            message: "Address not found",
        });
    }
    await address.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Address deleted successfully",
    });
});
export const getMyAddresses = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Please Login",
        });
    }
    const userId = user?._id;
    const addresses = await Address.find({
        userId,
    }).sort({
        createdAt: -1,
    });
    return res.status(200).json({
        success: true,
        addresses,
    });
});
