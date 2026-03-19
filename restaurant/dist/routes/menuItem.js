import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import { addMenuItem, deleteMenuItem, getAllItems, toggleMenuItemAvailability, } from "../controllers/menuItem.js";
const router = express();
router.post("/new", isAuth, isSeller, addMenuItem);
router.get("/all/:id", isAuth, getAllItems);
router.delete("/:id", isAuth, isSeller, deleteMenuItem);
router.put("/status/:id", isAuth, isSeller, toggleMenuItemAvailability);
export default router;
