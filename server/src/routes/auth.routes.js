import express from "express";
import passport from "passport";
import { validateBody, validateParams } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import {
    register,
    login,
    oauthCallback,
    logout,
    getAuthStatus,
    refreshToken,
} from "../controllers/auth.controller.js";
import { authenticated, optionalAuth } from "../middlewares/auth.middleware.js";
import { registerRateLimit, loginRateLimit } from "../middlewares/rateLimit.middleware.js";

const authRouter = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user with email/password
 * @access  Public
 */
authRouter.post("/register", registerRateLimit, validateBody(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with email/password
 * @access  Public
 */
authRouter.post("/login", loginRateLimit, validateBody(loginSchema), login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires refresh token)
 */
authRouter.post("/refresh", refreshToken);

// GOOGLE OAUTH
authRouter.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })
);

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// GITHUB OAUTH
authRouter.get(
    "/github",
    passport.authenticate("github", {
        scope: ["user:email"],
        session: false
    })
);

authRouter.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// FACEBOOK OAUTH
authRouter.get(
    "/facebook",
    passport.authenticate("facebook", {
        scope: ["email"],
        session: false
    })
);

authRouter.get(
    "/facebook/callback",
    passport.authenticate("facebook", {
        session: false,
        failureRedirect: "/login?error=oauth_failed"
    }),
    oauthCallback
);

// AUTH STATUS & LOGOUT
authRouter.get("/status", optionalAuth, getAuthStatus);
authRouter.post("/logout", authenticated, logout);

export { authRouter };