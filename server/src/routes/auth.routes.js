import express from "express";
import passport from "passport";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { register, login, oauthCallback, logout, getAuthStatus } from "../controllers/auth.controller.js";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import { loginRateLimit } from "../middlewares/rateLimit.middleware.js"

const router = express.Router();

// Email/Password Authentication
router.post("/register", validate(registerSchema), register);
router.post("/login", loginRateLimit, validate(loginSchema), login);

// Google OAuth
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    oauthCallback
);

// GitHub OAuth
router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
    "/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: "/login" }),
    oauthCallback
);

// Facebook OAuth
router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { session: false, failureRedirect: "/login" }),
    oauthCallback
);

// Auth status (optional auth)
router.get("/status", optionalAuth, getAuthStatus);

// Logout (protected)
router.post("/logout", protect, logout);

export default router;