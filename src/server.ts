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
app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

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

const allowedOrigins = [
    "http://localhost:5173",
    "https://chizzel.space",
    "https://www.chizzel.space",
    "https://backend.chizzel.space",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("Socket Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
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

import GroupRoutes from "./routes/GroupRoute";

app.use("/api/messages", authMiddleware, MessageRoutes);
app.use("/api/chat", authMiddleware, ChatRoutes);
app.use("/api/chatUser", ChatUserRoutes);
app.use("/api/group", authMiddleware, GroupRoutes);

import { setUserOnline, setUserOffline, getOnlineUsers } from "./config/redis";

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", redis: "check_logs" });
});

io.engine.on("connection_error", (err) => {
    logger.error(chalk.red(`Socket.io Engine Error: ${err.req?.url} - ${err.message}`));
    console.error("Detailed Socket Error:", err);
});

io.on("connection", (socket) => {
    logger.info(chalk.green(`New WebSocket connection: ${socket.id}`));

    // Log transport mechanism (polling/websocket)
    console.log(`Socket ${socket.id} transport: ${socket.conn.transport.name}`);

    socket.on("join", async (email) => {
        if (!email) {
            logger.error(chalk.red(`Socket ${socket.id} tried to join with empty email`));
            return;
        }
        socket.join(email);
        logger.info(chalk.blue(`User joined room: ${email} (Socket: ${socket.id})`));
        try {
            await setUserOnline(email, socket.id);
            logger.info(`Set user ${email} online in Redis`);
        } catch (e) {
            logger.error(chalk.red(`Failed to set user online: ${e}`));
        }
    });

    socket.on("heartbeat", async (email) => {
        try {
            await setUserOnline(email, socket.id);
        } catch (e) {
            logger.error(chalk.red(`Heartbeat error for ${email}: ${e}`));
        }
    });

    socket.on("checkOnlineStatus", async (emails: string[]) => {
        try {
            const onlineUsers = await getOnlineUsers(emails);
            socket.emit("onlineStatusUpdate", onlineUsers);
        } catch (e) {
            logger.error(chalk.red(`checkOnlineStatus error: ${e}`));
        }
    });

    socket.on("disconnect", async (reason) => {
        logger.info(chalk.yellow(`User ${socket.id} disconnected. Reason: ${reason}`));
    });

    // WebRTC Signaling Events
    socket.on("callUser", (data) => {
        const { userToCall, signalData, from, name } = data;
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("ice-candidate", (data) => {
        io.to(data.to).emit("ice-candidate", data.candidate);
    });

    socket.on("endCall", (data) => {
        io.to(data.to).emit("callEnded");
    });
});

app.get("/", (req, res) => {
    logger.info("Health check accessed");
    res.send("Hello new friend!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(chalk.yellow(`Server is running on port ${PORT}`));
});