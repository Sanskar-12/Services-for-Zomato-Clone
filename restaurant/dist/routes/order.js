import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createOrder, fetchOrderForPayment, fetchUserForOrder, } from "../controllers/order.js";
const router = express.Router();
router.post("/new", isAuth, createOrder);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/get/user/:id", fetchUserForOrder);
export default router;
