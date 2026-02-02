import Redis from "ioredis";

const redisConfig = {
    maxRetriesPerRequest: null, // Important for Socket.IO adapter
    enableReadyCheck: false,
};

export const pubClient = new Redis(process.env.REDIS_URL, redisConfig);
export const subClient = pubClient.duplicate();

// Connection event handlers
pubClient.on("connect", () => console.log("Redis Pub Client connected"));
pubClient.on("error", (err) => console.error("Redis Pub Client error:", err));

subClient.on("connect", () => console.log("Redis Sub Client connected"));
subClient.on("error", (err) => console.error("Redis Sub Client error:", err));

// Graceful shutdown
process.on("SIGTERM", async () => {
    await pubClient.quit();
    await subClient.quit();
});