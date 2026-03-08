import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Utils Service is running on PORT ${PORT}`);
});
