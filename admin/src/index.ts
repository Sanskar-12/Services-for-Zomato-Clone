import express from "express";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/v1/admin", adminRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Admin Service is running on PORT ${PORT}`);
});
