import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  addRiderProfile,
  fetchMyProfile,
  toggleRiderAvailability,
} from "../controllers/rider.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, uploadFile, addRiderProfile);
router.get("/myProfile", isAuth, fetchMyProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);

export default router;
