import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db.js";
dotenv.config();
connectDb();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Rider Service is running on PORT ${PORT}`);
});
