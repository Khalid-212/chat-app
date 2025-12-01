import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index";
import { setupSocket } from "./socket/socketHandler";
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST"],
    },
});
// Middleware
app.use(cors());
app.use(express.json());
// API Routes
app.use("/api", routes);
// Socket Setup
setupSocket(io);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
