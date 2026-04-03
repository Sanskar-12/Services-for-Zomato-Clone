import express from "express";
import connectDb from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import restaurantRoute from "./routes/restaurant.js";
import itemRoute from "./routes/menuItem.js";
import cartRoute from "./routes/cart.js";
import addressRoute from "./routes/address.js";
import orderRoute from "./routes/order.js";

dotenv.config();

connectDb();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/restaurant", restaurantRoute);
app.use("/api/item", itemRoute);
app.use("/api/cart", cartRoute);
app.use("/api/address", addressRoute);
app.use("/api/order", orderRoute);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Restaurant Service is running on PORT ${PORT}`);
});
