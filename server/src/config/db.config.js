import mongoose from "mongoose";
import { getEnv } from "./env.config.js";

let isConnected = false;

export const connectDb = async () => {
    if (isConnected) {
        console.log("MongoDB already connected");
        return;
    }

    const uri = getEnv("MONGODB_URI");

    try {
        await mongoose.connect(uri);
        isConnected = true;
        console.log("MongoDB connected successfully!");

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB error:", err);
            isConnected = false;
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB disconnected");
            isConnected = false;
        });

    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};