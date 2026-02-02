import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { createApiError } from "../utils/ApiError.js";
import { generateToken } from "../utils/jwt.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { SUCCESS_MESSAGES } from "../constants/successMessages.js";
import { getEnv, isProduction } from "../config/env.config.js";
import { UserModel } from "../models/user.model.js";
import { setTokenCookie } from "../utils/setTokenCookie.js";
import { isTokenBlacklisted } from "../utils/redis.js";

// @desc    Register new user with email/password
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, username } = req.body;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
        throw createApiError(409, ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Check if username is taken
    if (username) {
        const usernameTaken = await UserModel.findOne({ username, email });
        if (usernameTaken) {
            throw createApiError(409, ERROR_MESSAGES.USERNAME_TAKEN);
        }
    }

    const user = await UserModel.create({
        name,
        email,
        password,
        username,
        provider: "email",
        status: "online",
    });

    // Return user without password
    const userResponse = await UserModel.findById(user._id).select("-password");

    // Generate token
    const token = generateToken(userResponse);
    setTokenCookie(res, token);

    return sendCreated(res, { user: userResponse, token },
        SUCCESS_MESSAGES.REGISTER_SUCCESS
    );
});

// @desc    Login user with email/password
export const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    const normalizeUser = email ? { email } : { username }
    const user = await UserModel.findOne(normalizeUser).select("+password");

    console.log(user);

    if (!user) {
        throw createApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user registered with email (not OAuth)
    if (user.provider !== "email") {
        throw createApiError(
            400,
            `This account is registered with ${user.provider}. Please login using ${user.provider}.`
        );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw createApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update status to online
    user.status = "online";
    user.lastSeen = new Date();
    await user.save();

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

// @desc    OAuth callback handler (Google/GitHub/Facebook)
export const oauthCallback = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw createApiError(401, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Update status to online
    req.user.status = "online";
    req.user.lastSeen = new Date();
    await req.user.save();

    const token = generateToken(req.user._id);
    setTokenCookie(res, token);

    // Redirect to frontend
    res.redirect(`${getEnv("CLIENT_URL")}/auth/success?token=${token}`);
});

// @desc    Logout user
export const logout = asyncHandler(async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    // Blacklist token (7 days = 604800 seconds)
    if (token) {
        await blacklistToken(token, 604800);
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
        status: "offline",
        lastSeen: new Date()
    });

    res.clearCookie("token");
    return sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
});

// @desc    Get auth status
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
