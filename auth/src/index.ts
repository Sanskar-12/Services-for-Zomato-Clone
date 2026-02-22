import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.js";

dotenv.config();

connectDb();
const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Auth Service is running on PORT ${PORT}`);
});
