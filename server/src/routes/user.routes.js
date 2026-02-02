import express from "express";
import { validate } from "../validations/validate.js";
import { updateProfileSchema } from "../validations/auth.validation.js";
import { protect } from "../middlewares/auth.middleware.js";
import { getMe, updateProfile, getUserById, searchUsers, updateStatus, deleteAccount } from "../controllers/user.controller.js";


const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

router.get("/me", getMe);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.delete("/me", deleteAccount);

router.get("/search", searchUsers);
router.get("/:id", getUserById);

router.patch("/status", updateStatus);

export default router;