import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export const setUserOnline = async (userId: string, socketId: string) => {
    await redis.set(`online:${userId}`, socketId, "EX", 5); // Expires in 10 seconds
};

export const setUserOffline = async (userId: string) => {
    await redis.del(`online:${userId}`);
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
    const exists = await redis.exists(`online:${userId}`);
    return exists === 1;
};

export const getOnlineUsers = async (userIds: string[]): Promise<string[]> => {
    const onlineUsers: string[] = [];
    const pipeline = redis.pipeline();

    userIds.forEach((id) => pipeline.exists(`online:${id}`));
    const results = await pipeline.exec();

    if (results) {
        results.forEach((result, index) => {
            if (result[1] === 1) {
                onlineUsers.push(userIds[index]);
            }
        });
    }

    return onlineUsers;
};

export default redis;
