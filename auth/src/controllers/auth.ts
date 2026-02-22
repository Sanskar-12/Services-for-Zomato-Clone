import { Request, Response } from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { name, email, picture } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        image: picture,
      });
    }

    const token = jwt.sign(
      {
        _id: user?._id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "15d",
      },
    );

    return res.status(200).json({
      message: "Logged In Success",
      token,
      user,
    });
  } catch (error) {
    console.log("Error in loginUser Controller: ", error);
    return res.status(500).json({
      success: false,
      message: `SignUp loginUser error: ${error}`,
    });
  }
};
