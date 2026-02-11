import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient, waitForRedis } from "../config/redis.config.js";
import { getEnv } from "../config/env.config.js";
import { verifyToken } from "../utils/jwt.js";
import { UserModel } from "../models/user.model.js";

let io = null;

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
export const initSocket = async (httpServer) => {
  try {
    // Wait for Redis to be ready before initializing Socket.IO
    console.log("Waiting for Redis to be ready...");
    await waitForRedis();
    console.log("Redis is ready, initializing Socket.IO...");

    io = new Server(httpServer, {
      cors: {
        origin: getEnv("CLIENT_URL"),
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    // Set up Redis adapter
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter initialized");

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get user
        const user = await UserModel.findById(decoded.userId).select(
          "-password",
        );

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        // Attach user to socket
        socket.userId = user._id.toString();
        socket.user = {
          _id: user._id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          status: user.status,
        };

        next();
      } catch (error) {
        console.error("Socket authentication error:", error.message);
        next(new Error("Authentication error: Invalid token"));
      }
    });

    // Connection handler
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.user.username} (${socket.id})`);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Update user status to online
      UserModel.findByIdAndUpdate(socket.userId, {
        status: "online",
        lastSeen: new Date(),
      }).catch((err) => console.error("Error updating user status:", err));

      /**
       * Join a room (channel/server)
       * Expected data: { roomId: string, type: "channel" | "server" }
       */
      socket.on("joinRoom", (data) => {
        try {
          if (!data?.roomId) {
            return socket.emit("error", { message: "Room ID is required" });
          }

          const { roomId, type } = data;
          const roomPrefix = type === "channel" ? "channel:" : "server:";
          const fullRoomId = `${roomPrefix}${roomId}`;

          socket.join(fullRoomId);
          console.log(`${socket.user.username} joined ${type}: ${roomId}`);

          // Notify others in the room
          socket.to(fullRoomId).emit("user:joinedRoom", {
            userId: socket.userId,
            username: socket.user.username,
            roomId,
            type,
            timestamp: new Date(),
          });

          // Confirm to sender
          socket.emit("joinedRoom", {
            roomId,
            type,
            success: true,
          });
        } catch (error) {
          console.error("Error joining room:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      });

      /**
       * Leave a room
       * Expected data: { roomId: string, type: "channel" | "server" }
       */
      socket.on("leaveRoom", (data) => {
        try {
          if (!data?.roomId) return;

          const { roomId, type } = data;
          const roomPrefix = type === "channel" ? "channel:" : "server:";
          const fullRoomId = `${roomPrefix}${roomId}`;

          socket.leave(fullRoomId);
          console.log(`${socket.user.username} left ${type}: ${roomId}`);

          // Notify others
          socket.to(fullRoomId).emit("user:leftRoom", {
            userId: socket.userId,
            roomId,
            type,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error leaving room:", error);
        }
      });

      // ================================================================
      // MESSAGING
      // ================================================================

      /**
       * Send message to a channel
       * Expected data: { channelId: string, message: object }
       */
      socket.on("sendMessage", (data) => {
        try {
          if (!data?.channelId || !data?.message) {
            return socket.emit("error", { message: "Invalid message data" });
          }

          const { channelId, message } = data;

          // Emit to all clients in the channel including sender
          io.to(`channel:${channelId}`).emit("newMessage", {
            ...message,
            sender: {
              _id: socket.userId,
              username: socket.user.username,
              avatar: socket.user.avatar,
            },
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // ================================================================
      // TYPING INDICATORS
      // ================================================================

      /**
       * Start typing indicator
       * Expected data: { channelId: string }
       */
      socket.on("typing:start", (data) => {
        try {
          if (!data?.channelId) return;

          socket.to(`channel:${data.channelId}`).emit("user:typing", {
            userId: socket.userId,
            username: socket.user.username,
            channelId: data.channelId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error in typing indicator:", error);
        }
      });

      /**
       * Stop typing indicator
       * Expected data: { channelId: string }
       */
      socket.on("typing:stop", (data) => {
        try {
          if (!data?.channelId) return;

          socket.to(`channel:${data.channelId}`).emit("user:stoppedTyping", {
            userId: socket.userId,
            channelId: data.channelId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error in stop typing:", error);
        }
      });

      // ================================================================
      // USER STATUS
      // ================================================================

      /**
       * Update user status
       * Expected data: { status: string, customStatus: string }
       */
      socket.on("status:update", async (data) => {
        try {
          const { status, customStatus } = data;

          if (!["online", "away", "dnd", "offline"].includes(status)) {
            return socket.emit("error", { message: "Invalid status" });
          }

          await UserModel.findByIdAndUpdate(socket.userId, {
            status,
            customStatus: customStatus || "",
          });

          // Broadcast to user's personal room (can be picked up by other sessions)
          io.to(`user:${socket.userId}`).emit("user:statusUpdated", {
            userId: socket.userId,
            status,
            customStatus,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error updating status:", error);
          socket.emit("error", { message: "Failed to update status" });
        }
      });

      // ================================================================
      // VOICE CHANNEL
      // ================================================================

      /**
       * Join voice channel
       * Expected data: { channelId: string, peerId: string }
       */
      socket.on("voice:join", (data) => {
        try {
          if (!data?.channelId || !data?.peerId) return;

          socket.join(`voice:${data.channelId}`);

          socket.to(`voice:${data.channelId}`).emit("user:joinedVoice", {
            userId: socket.userId,
            username: socket.user.username,
            peerId: data.peerId,
            channelId: data.channelId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error joining voice:", error);
        }
      });

      /**
       * Leave voice channel
       * Expected data: { channelId: string }
       */
      socket.on("voice:leave", (data) => {
        try {
          if (!data?.channelId) return;

          socket.leave(`voice:${data.channelId}`);

          socket.to(`voice:${data.channelId}`).emit("user:leftVoice", {
            userId: socket.userId,
            channelId: data.channelId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Error leaving voice:", error);
        }
      });

      /**
       * WebRTC signaling
       * Expected data: { channelId: string, signal: object, to: string }
       */
      socket.on("voice:signal", (data) => {
        try {
          if (!data?.channelId || !data?.signal || !data?.to) return;

          io.to(`user:${data.to}`).emit("voice:signal", {
            from: socket.userId,
            signal: data.signal,
            channelId: data.channelId,
          });
        } catch (error) {
          console.error("Error in voice signal:", error);
        }
      });

      // ================================================================
      // DISCONNECT HANDLER
      // ================================================================

      socket.on("disconnect", async (reason) => {
        console.log(
          `User disconnected: ${socket.user.username} (Reason: ${reason})`,
        );

        try {
          // Update user status to offline
          await UserModel.findByIdAndUpdate(socket.userId, {
            status: "offline",
            lastSeen: new Date(),
          });

          // Notify all rooms the user was in
          // Note: Socket.IO automatically handles leaving rooms on disconnect
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      });

      // ================================================================
      // ERROR HANDLER
      // ================================================================

      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.user.username}:`, error);
      });
    });

    console.log("✅ Socket.IO initialized successfully");
    return io;
  } catch (error) {
    console.error("Failed to initialize Socket.IO:", error);
    throw error;
  }
};

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket first.");
  }
  return io;
};

//  * Emit event to specific user
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

//  * Emit event to specific server
export const emitToServer = (serverId, event, data) => {
  if (!io) return;
  io.to(`server:${serverId}`).emit(event, data);
};

//  * Emit event to specific channel
export const emitToChannel = (channelId, event, data) => {
  if (!io) return;
  io.to(`channel:${channelId}`).emit(event, data);
};
