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

// import rateLimit from "express-rate-limit";
// import RedisStore from "rate-limit-redis";
// import { pubClient } from "../config/redis.config.js";

// // ============================================================================
// // RATE LIMITING CONFIGURATION
// // ============================================================================

// // Create Redis store for rate limiting (optional but recommended for production)
// // If Redis is not available, it will fall back to memory store
// const createRedisStore = () => {
//     try {
//         return new RedisStore({
//             client: pubClient,
//             prefix: "rl:", // Rate limit prefix in Redis
//         });
//     } catch (error) {
//         console.warn("Redis store not available, using memory store for rate limiting");
//         return undefined; // Falls back to memory store
//     }
// };

// // ============================================================================
// // RATE LIMITERS
// // ============================================================================

// /**
//  * Login rate limiter - Prevent brute force attacks
//  * 5 requests per 15 minutes per IP
//  */
// export const loginRateLimit = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // 5 requests per window
//     message: {
//         success: false,
//         message: "Too many login attempts. Please try again in 15 minutes.",
//     },
//     standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
//     legacyHeaders: false, // Disable `X-RateLimit-*` headers
//     skipSuccessfulRequests: true, // Don't count successful logins
//     store: createRedisStore(),
// });

// /**
//  * Register rate limiter - Prevent spam registrations
//  * 3 requests per 15 minutes per IP
//  */
// export const registerRateLimit = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 3, // 3 requests per window
//     message: {
//         success: false,
//         message: "Too many registration attempts. Please try again in 15 minutes.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     store: createRedisStore(),
// });

// /**
//  * Password reset rate limiter - Prevent abuse
//  * 3 requests per hour per IP
//  */
// export const passwordResetRateLimit = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 3, // 3 requests per hour
//     message: {
//         success: false,
//         message: "Too many password reset attempts. Please try again in 1 hour.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     store: createRedisStore(),
// });

// /**
//  * API rate limiter - General API protection
//  * 100 requests per 15 minutes per IP
//  */
// export const apiRateLimit = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // 100 requests per window
//     message: {
//         success: false,
//         message: "Too many requests. Please slow down.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     store: createRedisStore(),
// });

// /**
//  * Message rate limiter - Prevent message spam
//  * 20 messages per minute per user
//  */
// export const messageRateLimit = rateLimit({
//     windowMs: 60 * 1000, // 1 minute
//     max: 20, // 20 messages per minute
//     message: {
//         success: false,
//         message: "You're sending messages too quickly. Please slow down.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         // Rate limit per user, not per IP
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// /**
//  * File upload rate limiter - Prevent upload abuse
//  * 10 uploads per 10 minutes per user
//  */
// export const uploadRateLimit = rateLimit({
//     windowMs: 10 * 60 * 1000, // 10 minutes
//     max: 10, // 10 uploads per window
//     message: {
//         success: false,
//         message: "Too many file uploads. Please wait a few minutes.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// /**
//  * Server creation rate limiter - Prevent server spam
//  * 3 servers per day per user
//  */
// export const serverCreateRateLimit = rateLimit({
//     windowMs: 24 * 60 * 60 * 1000, // 24 hours
//     max: 3, // 3 servers per day
//     message: {
//         success: false,
//         message: "You've reached the maximum number of servers you can create today. Please try again tomorrow.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// /**
//  * Invite creation rate limiter - Prevent invite spam
//  * 20 invites per hour per user
//  */
// export const inviteCreateRateLimit = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 20, // 20 invites per hour
//     message: {
//         success: false,
//         message: "You're creating invites too quickly. Please wait a bit.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// /**
//  * DM rate limiter - Prevent DM spam
//  * 30 DMs per minute per user
//  */
// export const dmRateLimit = rateLimit({
//     windowMs: 60 * 1000, // 1 minute
//     max: 30, // 30 DMs per minute
//     message: {
//         success: false,
//         message: "You're sending direct messages too quickly. Please slow down.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// /**
//  * Friend request rate limiter - Prevent friend spam
//  * 10 friend requests per hour per user
//  */
// export const friendRequestRateLimit = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 10, // 10 requests per hour
//     message: {
//         success: false,
//         message: "You're sending friend requests too quickly. Please wait a bit.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
//     keyGenerator: (req) => {
//         return req.user?._id?.toString() || req.ip;
//     },
//     store: createRedisStore(),
// });

// // ============================================================================
// // CUSTOM RATE LIMITER FACTORY
// // ============================================================================

// /**
//  * Create a custom rate limiter
//  * @param {Object} options - Rate limiter options
//  * @returns {Function} Express middleware
//  */
// export const createRateLimit = (options = {}) => {
//     const defaultOptions = {
//         windowMs: 15 * 60 * 1000, // 15 minutes
//         max: 100,
//         standardHeaders: true,
//         legacyHeaders: false,
//         store: createRedisStore(),
//     };

//     return rateLimit({ ...defaultOptions, ...options });
// };

// export default {
//     loginRateLimit,
//     registerRateLimit,
//     passwordResetRateLimit,
//     apiRateLimit,
//     messageRateLimit,
//     uploadRateLimit,
//     serverCreateRateLimit,
//     inviteCreateRateLimit,
//     dmRateLimit,
//     friendRequestRateLimit,
//     createRateLimit,
// };