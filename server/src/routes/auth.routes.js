import express from "express";
import passport from "passport";
import { validateBody, validateParams } from "../middlewares/validation.middleware.js";
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    updateUserStatusSchema,
    verifyEmailSchema,
    resetPasswordRequestSchema,
    resetPasswordSchema,
} from "../validations/auth.validation.js";
import {
    register,
    login,
    oauthCallback,
    logout,
    getAuthStatus,
    refreshToken,
} from "../controllers/auth.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { loginRateLimit, registerRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();



/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user with email/password
 * @access  Public
 */
router.post(
    "/register",
    registerRateLimit, // Limit: 3 requests per 15 minutes
    validateBody(registerSchema),
    register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with email/password
 * @access  Public
 */
router.post(
    "/login",
    loginRateLimit, // Limit: 5 requests per 15 minutes
    validateBody(loginSchema),
    login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token)
 */
router.post("/refresh", refreshToken);

// GOOGLE OAUTH
/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })
);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// GITHUB OAUTH
/**
 * @route   GET /api/v1/auth/github
 * @desc    Initiate GitHub OAuth flow
 * @access  Public
 */
router.get(
    "/github",
    passport.authenticate("github", {
        scope: ["user:email"],
        session: false
    })
);

/**
 * @route   GET /api/v1/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// FACEBOOK OAUTH
/**
 * @route   GET /api/v1/auth/facebook
 * @desc    Initiate Facebook OAuth flow
 * @access  Public
 */
router.get(
    "/facebook",
    passport.authenticate("facebook", {
        scope: ["email"],
        session: false
    })
);

/**
 * @route   GET /api/v1/auth/facebook/callback
 * @desc    Facebook OAuth callback
 * @access  Public
 */
router.get(
    "/facebook/callback",
    passport.authenticate("facebook", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// AUTH STATUS & LOGOUT
/**
 * @route   GET /api/v1/auth/status
 * @desc    Get current authentication status
 * @access  Public (returns user if authenticated)
 */
router.get("/status", optionalAuth, getAuthStatus);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
router.post("/logout", protect, logout);

export default router;