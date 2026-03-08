import express from "express";
import { uploadOnCloudinary } from "../controllers/cloudinary.js";

const router = express.Router();

router.post("/upload", uploadOnCloudinary);

export default router;
