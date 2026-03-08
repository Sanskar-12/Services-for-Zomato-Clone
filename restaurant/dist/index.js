import express from "express";
import connectDb from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import restaurantRoute from "./routes/restaurant.js";
dotenv.config();
connectDb();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/restaurant", restaurantRoute);
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Restaurant Service is running on PORT ${PORT}`);
});
