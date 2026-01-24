import connectDB from "./config/db";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import MessageRoutes from "./routes/MessageRoute";
import ChatRoutes from "./routes/ChatRoute";
import ChatUserRoutes from "./routes/ChatUserRoute";
import logger from "./utils/logger";
import chalk from "chalk";
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();
connectDB();
const app = express();
app.use(cors());
app.use(express.json());

export const server = http.createServer(app);
const API_URL = process.env.API_URL;

declare global {
    namespace Express {
        interface Request {
            io?: Server;
            user?: any;
        }
    }
}

app.use(
    cors({
        origin: API_URL,
        credentials: true,
    })
);

const io = new Server(server, {
    cors: {
        origin: API_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    req.io = io;
    next();
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({ message: "Internal Server Error" });
});

app.use("/api/messages", authMiddleware, MessageRoutes);
app.use("/api/chat", authMiddleware, ChatRoutes);
app.use("/api/chatUser", ChatUserRoutes);

import { setUserOnline, setUserOffline, getOnlineUsers } from "./config/redis";

// ... imports

io.on("connection", (socket) => {
    logger.info(chalk.green("New WebSocket connection"));

    socket.on("join", async (email) => {
        socket.join(email);
        logger.info(chalk.blue(`User joined room: ${email}`));
        // Initial online status set
        await setUserOnline(email, socket.id);
    });

    socket.on("heartbeat", async (email) => {
        // Refresh TTL
        await setUserOnline(email, socket.id);
    });

    socket.on("checkOnlineStatus", async (emails: string[]) => {
        const onlineUsers = await getOnlineUsers(emails);
        socket.emit("onlineStatusUpdate", onlineUsers);
    });

    socket.on("disconnect", async () => {
        logger.info(chalk.yellow("User disconnected"));
        // Optionally remove immediately, or let heartbeat expire
        // await setUserOffline(email); // Requires tracking email on socket object
    });
});

io.engine.on("connection_error", (err) => {
    logger.error(chalk.red(`Socket.io Error: ${err.message}`));
});

app.get("/", (req, res) => {
    logger.info("Health check accessed");
    res.send("Hello new friend!");
});