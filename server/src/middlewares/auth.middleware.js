import { asyncHandler } from "../utils/asyncHandler.js";
import { createApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { UserModel } from "../models/user.model.js";
import { isTokenBlacklisted } from "../utils/redis.js";

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw createApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
        throw createApiError(401, "Token has been invalidated");
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
        throw createApiError(401, ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    // Get user from token
    const user = await UserModel.findById(decoded.id).select("-__v");

    if (!user) {
        throw createApiError(401, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Attach user to request
    req.user = user;
    next();
});

// Optional auth - doesn't throw error if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            const user = await UserModel.findById(decoded.id).select("-__v");
            if (user) {
                req.user = user;
            }
        }
    }

    next();
});