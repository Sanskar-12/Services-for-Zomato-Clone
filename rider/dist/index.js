import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db.js";
import riderRoutes from "./routes/rider.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
dotenv.config();
await connectRabbitMQ();
connectDb();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/rider", riderRoutes);
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Rider Service is running on PORT ${PORT}`);
});
