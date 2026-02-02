import express from "express";
import http from "http";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import helmet from "helmet";

import { connectDb } from "./src/config/db.config.js";
import { initSocket } from "./src/socket/socketHandler.js";
import { validateEnv, getEnv, isProduction } from "./src/config/env.config.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import "./src/config/passport.config.js";
import routes from "./src/routes/routes.js";

// Validate environment variables
validateEnv();

const PORT = getEnv("PORT");
const CLIENT_URL = getEnv("CLIENT_URL");

const app = express();

const corsOrigin = {
    origin: [CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}

// Security
app.use(cors(corsOrigin));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());

// Sessions (needed for passport OAuth)
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
            maxAge: 1000 * 60 * 60 * 24,
        },
    })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/v1", routes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
    try {
        await connectDb();

        const server = http.createServer(app);
        initSocket(server);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${getEnv("NODE_ENV")}`);
            console.log(`Client URL: ${CLIENT_URL}`);
        });

        const shutdown = (signal) => {
            console.log(`\n ${signal} received, shutting down...`);

            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });

            setTimeout(() => {
                console.error("Forced shutdown");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (err) {
        console.error("Startup error:", err);
        process.exit(1);
    }
};

startServer();