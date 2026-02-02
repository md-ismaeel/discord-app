import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "../config/redis.config.js";

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        },
        transports: ["websocket", "polling"], // Explicit transports
    });

    // Wait for Redis clients to be ready before setting adapter
    Promise.all([
        pubClient.status === "ready" ? Promise.resolve() : new Promise(resolve => pubClient.once("ready", resolve)),
        subClient.status === "ready" ? Promise.resolve() : new Promise(resolve => subClient.once("ready", resolve)),
    ]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("✅ Socket.IO Redis adapter initialized");
    }).catch(err => {
        console.error("❌ Failed to initialize Redis adapter:", err);
    });

    io.on("connection", (socket) => {
        console.log("🟢 Connected:", socket.id);

        socket.on("joinRoom", (roomId) => {
            if (!roomId) return;
            socket.join(roomId);
            console.log(`👤 ${socket.id} joined room: ${roomId}`);
        });

        socket.on("sendMessage", (data) => {
            if (!data?.roomId) return;
            // Emit to all clients in room including sender
            io.to(data.roomId).emit("newMessage", data);
        });

        socket.on("typing", (roomId) => {
            if (!roomId) return;
            // Emit to all clients in room EXCEPT sender
            socket.to(roomId).emit("userTyping", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Disconnected:", socket.id);
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });
    });

    return io;
};