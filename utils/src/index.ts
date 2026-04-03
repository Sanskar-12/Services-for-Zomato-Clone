import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import uploadRoute from "./routes/cloudinary.js";
import paymentRoute from "./routes/payment.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

connectRabbitMQ();

const app = express();

app.use(
  express.json({
    limit: "50mb",
  }),
);
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);
app.use(cors());

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET_KEY,
});

app.use("/api/utils", uploadRoute);
app.use("/api/payment", paymentRoute);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Utils Service is running on PORT ${PORT}`);
});
