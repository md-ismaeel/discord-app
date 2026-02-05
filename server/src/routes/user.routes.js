import express from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware.js";
import {
    updateProfileSchema,
    changePasswordSchema,
    updateUserStatusSchema,
    serverIdParamSchema,
    paginationSchema,
} from "../validations/auth.validation.js";
import {
    getMe,
    updateProfile,
    changePassword,
    getUserById,
    searchUsers,
    updateStatus,
    deleteAccount,
    uploadAvatar,
    getUserServers,
    getFriends,
    addFriend,
    removeFriend,
    blockUser,
    unblockUser,
    getBlockedUsers,
} from "../controllers/user.controller.js";
import { protect, checkOwnership } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// ============================================================================
// AUTHENTICATION REQUIRED FOR ALL ROUTES
// ============================================================================
router.use(protect);

// ============================================================================
// CURRENT USER PROFILE
// ============================================================================

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", getMe);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch(
    "/me",
    validateBody(updateProfileSchema),
    updateProfile
);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete("/me", deleteAccount);

/**
 * @route   POST /api/v1/users/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
    "/me/avatar",
    upload.single("avatar"), // multer middleware for file upload
    uploadAvatar
);

/**
 * @route   PATCH /api/v1/users/me/password
 * @desc    Change user password
 * @access  Private
 */
router.patch(
    "/me/password",
    validateBody(changePasswordSchema),
    changePassword
);

// ============================================================================
// USER STATUS
// ============================================================================

/**
 * @route   PATCH /api/v1/users/me/status
 * @desc    Update user status (online/offline/away/dnd)
 * @access  Private
 */
router.patch(
    "/me/status",
    validateBody(updateUserStatusSchema),
    updateStatus
);

// ============================================================================
// USER SERVERS
// ============================================================================

/**
 * @route   GET /api/v1/users/me/servers
 * @desc    Get all servers current user is a member of
 * @access  Private
 */
router.get("/me/servers", getUserServers);

// ============================================================================
// FRIENDS & SOCIAL
// ============================================================================

/**
 * @route   GET /api/v1/users/me/friends
 * @desc    Get user's friends list
 * @access  Private
 */
router.get("/me/friends", getFriends);

/**
 * @route   POST /api/v1/users/me/friends/:userId
 * @desc    Add a friend
 * @access  Private
 */
router.post(
    "/me/friends/:userId",
    validateParams(z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/)
    })),
    addFriend
);

/**
 * @route   DELETE /api/v1/users/me/friends/:userId
 * @desc    Remove a friend
 * @access  Private
 */
router.delete(
    "/me/friends/:userId",
    validateParams(z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/)
    })),
    removeFriend
);

// ============================================================================
// BLOCKING
// ============================================================================

/**
 * @route   GET /api/v1/users/me/blocked
 * @desc    Get list of blocked users
 * @access  Private
 */
router.get("/me/blocked", getBlockedUsers);

/**
 * @route   POST /api/v1/users/me/blocked/:userId
 * @desc    Block a user
 * @access  Private
 */
router.post(
    "/me/blocked/:userId",
    validateParams(z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/)
    })),
    blockUser
);

/**
 * @route   DELETE /api/v1/users/me/blocked/:userId
 * @desc    Unblock a user
 * @access  Private
 */
router.delete(
    "/me/blocked/:userId",
    validateParams(z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/)
    })),
    unblockUser
);

// ============================================================================
// SEARCH & DISCOVER
// ============================================================================

/**
 * @route   GET /api/v1/users/search
 * @desc    Search for users by username or email
 * @access  Private
 */
router.get(
    "/search",
    validateQuery(z.object({
        q: z.string().min(1, "Search query required"),
        page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
    })),
    searchUsers
);

// ============================================================================
// GET OTHER USERS
// ============================================================================

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
    "/:id",
    validateParams(z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
    })),
    getUserById
);

export default router;