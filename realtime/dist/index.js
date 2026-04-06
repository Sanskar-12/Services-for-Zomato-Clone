import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import http from "http";
import internalRoute from "./routes/internal.js";
import { initSocket } from "./socket.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/internal", internalRoute);
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Realtime Service is running on PORT ${PORT}`);
});
