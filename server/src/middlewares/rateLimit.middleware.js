import { pubClient } from "../config/redis.config.js";
import { createApiError } from "../utils/ApiError.js";

export const loginRateLimit = async (req, res, next) => {
    const ip = req.ip;
    const key = `login_attempts:${ip}`;

    const attempts = await pubClient.get(key);

    if (attempts && parseInt(attempts) >= 5) {
        throw createApiError(429, "Too many login attempts. Please try again in 15 minutes.");
    }

    next();
};

export const recordLoginAttempt = async (ip) => {
    const key = `login_attempts:${ip}`;
    const current = await pubClient.get(key);

    if (current) {
        await pubClient.incr(key);
    } else {
        await pubClient.setex(key, 900, "1"); // 15 minutes
    }
};

export const clearLoginAttempts = async (ip) => {
    await pubClient.del(`login_attempts:${ip}`);
};