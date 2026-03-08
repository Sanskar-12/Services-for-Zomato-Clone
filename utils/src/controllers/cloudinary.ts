import cloudinary from "cloudinary";
import { Request, Response } from "express";

export const uploadOnCloudinary = async (req: Request, res: Response) => {
  try {
    const { buffer } = req.body;

    const cloud = await cloudinary.v2.uploader.upload(buffer);

    return res.status(200).json({
      success: true,
      url: cloud.secure_url,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
