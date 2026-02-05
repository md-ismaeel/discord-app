import express from "express";
import http from "http";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import helmet from "helmet";
import mongoose from "mongoose";

import { connectDb } from "./src/config/db.config.js";
import { initSocket } from "./src/socket/socketHandler.js";
import { validateEnv, getEnv, isProduction } from "./src/config/env.config.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import { closeRedis } from "./src/config/redis.config.js";
import "./src/config/passport.config.js";
import routes from "./src/routes/routes.js";

// Validate environment variables first
try {
    validateEnv();
} catch (error) {
    console.error("Environment validation failed:", error.message);
    process.exit(1);
}

const PORT = getEnv("PORT");
const CLIENT_URL = getEnv("CLIENT_URL");

const app = express();


// MIDDLEWARE CONFIGURATION
const corsOrigin = {
    origin: [CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// Security and parsing
app.use(cors(corsOrigin));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(helmet({
    contentSecurityPolicy: isProduction(),
    crossOriginEmbedderPolicy: isProduction(),
}));
app.use(cookieParser());

// Session configuration (needed for passport OAuth)
app.use(
    session({
        name: "sid",
        secret: getEnv("SESSION_SECRET"),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction(),
            sameSite: isProduction() ? "strict" : "lax",
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use("/api/v1", routes);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler (must be last)
app.use(errorHandler);


// SERVER STARTUP
let server;
let isShuttingDown = false;

const startServer = async () => {
    try {
        console.log("Starting server...");
        console.log(`Environment: ${getEnv("NODE_ENV")}`);
        console.log(`Client URL: ${CLIENT_URL}`);

        // Connect to MongoDB
        await connectDb();

        // Create HTTP server
        server = http.createServer(app);

        // Initialize Socket.IO (now waits for Redis)
        await initSocket(server);

        // Start listening
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API: http://localhost:${PORT}/api/v1`);
            console.log(`Health: http://localhost:${PORT}/health`);
        });

        // Handle server errors
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use`);
                process.exit(1);
            } else {
                console.error("Server error:", error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};


// GRACEFUL SHUTDOWN
const gracefulShutdown = async (signal) => {
    if (isShuttingDown) {
        console.log("Shutdown already in progress...");
        return;
    }

    isShuttingDown = true;
    console.log(`\n ${signal} received, starting graceful shutdown...`);

    // Set a timeout for forced shutdown
    const forceShutdownTimeout = setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
    }, 15000); // 15 seconds

    try {
        // Stop accepting new connections
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        console.error("Error closing HTTP server:", err);
                        reject(err);
                    } else {
                        console.log("HTTP server closed");
                        resolve();
                    }
                });
            });
        }

        // Close Redis connections
        await closeRedis();

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log("MongoDB connection closed");

        clearTimeout(forceShutdownTimeout);
        console.log("Graceful shutdown completed");
        process.exit(0);

    } catch (error) {
        console.error("Error during shutdown:", error);
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
    }
};

// Handle different shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer();