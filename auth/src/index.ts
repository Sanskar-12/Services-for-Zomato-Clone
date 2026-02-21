import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";

dotenv.config();

connectDb();
const app = express();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Auth Service is running on PORT ${PORT}`);
});
