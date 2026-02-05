import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { createApiError } from "../utils/ApiError.js";
import { generateToken } from "../utils/jwt.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { SUCCESS_MESSAGES } from "../constants/successMessages.js";
import { getEnv } from "../config/env.config.js";
import { UserModel } from "../models/user.model.js";
import { setTokenCookie } from "../utils/setTokenCookie.js";
import { blacklistToken, isTokenBlacklisted } from "../utils/redis.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * @desc    Register new user with email/password
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, username } = req.body;

    // Check if user already exists with this email
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
        throw createApiError(
            HTTP_STATUS.CONFLICT,
            ERROR_MESSAGES.USER_ALREADY_EXISTS
        );
    }

    // Check if username is taken (if provided)
    if (username) {
        // ⚠️ CRITICAL FIX: Your original query was wrong!
        // You were checking: { username, email } - this checks if BOTH match
        // Should check: { username } only - to see if username is taken
        const usernameTaken = await UserModel.findOne({ username });
        if (usernameTaken) {
            throw createApiError(
                HTTP_STATUS.CONFLICT,
                ERROR_MESSAGES.USERNAME_TAKEN
            );
        }
    }

    // Create user
    const user = await UserModel.create({
        name,
        email,
        password,
        username,
        provider: "email",
        status: "online",
        isEmailVerified: false,
    });

    // Get user without password
    const userResponse = await UserModel.findById(user._id).select("-password");

    // Generate token
    // ⚠️ CRITICAL FIX: Your original code passed the whole user object
    // Should pass just the user ID
    const token = generateToken(userResponse._id);
    setTokenCookie(res, token);

    return sendCreated(
        res,
        { user: userResponse, token },
        SUCCESS_MESSAGES.REGISTER_SUCCESS
    );
});

// ============================================================================
// LOGIN
// ============================================================================

/**
 * @desc    Login user with email/password
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // Build query - user can login with either email or username
    const query = email ? { email } : { username };

    // Find user and explicitly select password
    const user = await UserModel.findOne(query).select("+password");

    if (!user) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_MESSAGES.INVALID_CREDENTIALS
        );
    }

    // Check if user registered with email (not OAuth)
    if (user.provider !== "email") {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            `This account is registered with ${user.provider}. Please login using ${user.provider}.`
        );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_MESSAGES.INVALID_CREDENTIALS
        );
    }

    // Update status to online and last seen
    await UserModel.findByIdAndUpdate(user._id, {
        status: "online",
        lastSeen: new Date(),
    });

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Return user without password
    const userResponse = await UserModel.findById(user._id).select("-password");

    return sendSuccess(
        res,
        { user: userResponse, token },
        SUCCESS_MESSAGES.LOGIN_SUCCESS
    );
});

// ============================================================================
// OAUTH CALLBACK
// ============================================================================

/**
 * @desc    OAuth callback handler (Google/GitHub/Facebook)
 * @route   GET /api/v1/auth/:provider/callback
 * @access  Public
 */
export const oauthCallback = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_MESSAGES.UNAUTHORIZED
        );
    }

    // Update status to online and last seen
    await UserModel.findByIdAndUpdate(req.user._id, {
        status: "online",
        lastSeen: new Date(),
    });

    // Generate token
    const token = generateToken(req.user._id);
    setTokenCookie(res, token);

    // Redirect to frontend
    const clientUrl = getEnv("CLIENT_URL");
    res.redirect(`${clientUrl}/auth/success?token=${token}`);
});

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    // Get token from cookie or header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    // Blacklist token (7 days = 604800 seconds)
    if (token) {
        await blacklistToken(token, 604800);
    }

    // Update user status to offline
    await UserModel.findByIdAndUpdate(req.user._id, {
        status: "offline",
        lastSeen: new Date()
    });

    // Clear cookie
    res.clearCookie("token", {
        httpOnly: true,
        secure: getEnv("NODE_ENV") === "production",
        sameSite: getEnv("NODE_ENV") === "production" ? "strict" : "lax",
    });

    return sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
});

// ============================================================================
// AUTH STATUS
// ============================================================================

/**
 * @desc    Get authentication status
 * @route   GET /api/v1/auth/status
 * @access  Public (but returns user if authenticated)
 */
export const getAuthStatus = asyncHandler(async (req, res) => {
    if (req.user) {
        return sendSuccess(res, {
            isAuthenticated: true,
            user: req.user,
        });
    }

    return sendSuccess(res, {
        isAuthenticated: false,
        user: null,
    });
});

// ============================================================================
// REFRESH TOKEN (Optional - Recommended)
// ============================================================================

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (with refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Refresh token required"
        );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Invalid refresh token"
        );
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Refresh token has been invalidated"
        );
    }

    // Get user
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Generate new access token
    const newToken = generateToken(user._id);
    setTokenCookie(res, newToken);

    return sendSuccess(res, { token: newToken }, "Token refreshed successfully");
});

export default {
    register,
    login,
    oauthCallback,
    logout,
    getAuthStatus,
    refreshToken,
};