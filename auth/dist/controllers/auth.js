import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
import { oauth2client } from "../config/googleConfig.js";
import axios from "axios";
export const loginUser = TryCatch(async (req, res) => {
    // we will get code from frontend
    const { code } = req.body;
    // if not code provided then error
    if (!code) {
        return res.status(404).json({
            message: "Authorization code is required",
        });
    }
    // oauth2client will verify the code and give the res
    const googleRes = await oauth2client.getToken(code);
    // setting the tokens into oauth2client
    oauth2client.setCredentials(googleRes.tokens);
    // getting the user info with the help of access_tokens
    const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
    // getting the name, email, picture from the google response json
    const { name, email, picture } = userRes.data;
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name,
            email,
            image: picture,
        });
    }
    const token = jwt.sign({
        user,
    }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });
    return res.status(200).json({
        message: "Logged In Success",
        token,
        user,
    });
});
const allowedRoles = ["customer", "rider", "seller"];
export const addUserRole = TryCatch(async (req, res) => {
    if (!req?.user?._id) {
        return res.status(401).json({
            message: "Unauthorised",
        });
    }
    const { role } = req.body;
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid role",
        });
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    user.role = role;
    const token = jwt.sign({
        user,
    }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    });
    await user.save();
    return res.status(200).json({
        message: "Added User Role",
        token,
        user,
    });
});
export const myProfile = TryCatch(async (req, res) => {
    const user = req.user;
    return res.status(200).json({
        user,
    });
});
