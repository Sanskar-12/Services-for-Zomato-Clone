import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  assignRiderToOrder,
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  fetchUserForOrder,
  getCurrentOrderForRider,
  getMyOrders,
  updateOrderStatus,
  updateOrderStatusRider,
} from "../controllers/order.js";

const router = express.Router();

router.post("/new", isAuth, createOrder);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/get/user/:id", fetchUserForOrder);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.get("/my", isAuth, getMyOrders);
router.get("/current/order", getCurrentOrderForRider);
router.put("/update/status/rider", updateOrderStatusRider);
router.put("/assign/rider", assignRiderToOrder);
router.get("/single/:orderId", isAuth, fetchSingleOrder);
router.get("/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);

export default router;
