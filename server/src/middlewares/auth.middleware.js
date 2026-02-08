import { asyncHandler } from "../utils/asyncHandler.js";
import { createApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { UserModel } from "../models/user.model.js";
import { isTokenBlacklisted } from "../utils/redis.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * authenticated route middleware - Requires valid JWT token
 * Attaches authenticated user to req.user
 */
export const authenticated = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // No token found
    if (!token) {
        throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    try {
        // Check if token is blacklisted (logged out)
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, "Token has been invalidated. Please login again.");
        }

        // Verify token and decode
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
        }

        const user = await UserModel.findById(decoded.userId).select("-password");

        if (!user) {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.USER_NOT_FOUND);
        }

        // Attach user to request object
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        // Handle JWT specific errors
        if (error.name === "JsonWebTokenError") {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid token. Please login again.");
        } else if (error.name === "TokenExpiredError") {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, "Token expired. Please login again.");
        }

        // Re-throw other errors
        throw error;
    }
});

/**
 * Optional auth middleware - Doesn't throw error if no token
 * Attaches user to req.user if token is valid, otherwise continues
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // No token - continue without user
    if (!token) {
        return next();
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
            return next();
        }

        // Verify and decode token
        const decoded = verifyToken(token);

        if (decoded && decoded.userId) {
            // Get user from database
            const user = await UserModel.findById(decoded.userId).select("-password");

            if (user) {
                req.user = user;
                req.token = token;
            }
        }
    } catch (error) {
        // Silently fail - this is optional auth
        console.warn("Optional auth failed:", error.message);
    }

    next();
});

/**
 * Role-based authorization middleware
 * Requires authenticated middleware to run first
 * @param {Array<String>} roles - Array of allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        if (!roles.includes(req.user.role)) {
            throw createApiError(HTTP_STATUS.FORBIDDEN, `User role '${req.user.role}' is not authorized to access this resource`);
        }

        next();
    };
};

/**
 * Check if user owns the resource
 * Requires authenticated middleware to run first
 * @param {String} userIdParam - Name of the parameter containing user ID
 */
export const checkOwnership = (userIdParam = "userId") => {
    return (req, res, next) => {
        if (!req.user) {
            throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

        if (!resourceUserId) {
            throw createApiError(HTTP_STATUS.BAD_REQUEST, `${userIdParam} is required`);
        }

        // Check if user owns the resource
        if (req.user._id.toString() !== resourceUserId.toString()) {
            throw createApiError(HTTP_STATUS.FORBIDDEN, "You don't have permission to access this resource");
        }

        next();
    };
};

/**
 * Verify email middleware
 * Requires user to have verified email
 */
export const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        throw createApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED)
    }

    if (!req.user.isEmailVerified) {
        throw createApiError(HTTP_STATUS.FORBIDDEN, "Please verify your email before accessing this resource");
    }

    next();
};

export default {
    authenticated,
    optionalAuth,
    authorize,
    checkOwnership,
    requireEmailVerification,
};