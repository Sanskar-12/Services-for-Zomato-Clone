import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
export const loginUser = TryCatch(async (req, res) => {
    const { name, email, picture } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name,
            email,
            image: picture,
        });
    }
    const token = jwt.sign({
        _id: user?._id,
    }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });
    return res.status(200).json({
        message: "Logged In Success",
        token,
        user,
    });
});
