import express from "express";
import { authRouter } from "./auth.routes.js";
import { userRouter } from "./user.routes.js";
import { serverRouter } from "./server.routes.js";

const router = express.Router();

// Debug middleware (can remove in production)
router.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${req.method}] ${req.url} - Body:`, req.body);
    }
    next();
});

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/server", serverRouter);

export default router;