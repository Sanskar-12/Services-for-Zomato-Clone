import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  fetchMyProfile,
  toggleRiderAvailability,
} from "../controllers/rider.js";

const router = express.Router();

router.get("/myProfile", isAuth, fetchMyProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);

export default router;
