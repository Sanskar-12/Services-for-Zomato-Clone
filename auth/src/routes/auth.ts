import express from "express";
import { addUserRole, loginUser } from "../controllers/auth.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/add/role", isAuth, addUserRole);

export default router;
