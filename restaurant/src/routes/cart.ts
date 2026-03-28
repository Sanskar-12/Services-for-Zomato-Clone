import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addToCart } from "../controllers/cart.js";

const router = express.Router();

router.post("/add", isAuth, addToCart);

export default router;
