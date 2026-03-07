import express from "express";
import connectDb from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

connectDb();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Restaurant Service is running on PORT ${PORT}`);
});
