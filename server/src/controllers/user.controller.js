import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { createApiError } from "../utils/ApiError.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { SUCCESS_MESSAGES } from "../constants/successMessages.js";
import { UserModel } from "../models/user.model.js";
import { ServerMemberModel } from "../models/serverMember.model.js";
import { ServerModel } from "../models/server.model.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { pubClient } from "../config/redis.config.js";
import { getIO } from "../config/socket.config.js";

// ============================================================================
// CURRENT USER PROFILE
// ============================================================================

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    // User is already attached to req by protect middleware
    const user = await UserModel.findById(req.user._id)
        .select("-password")
        .populate("friends", "username name avatar status customStatus")
        .lean();

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    sendSuccess(res, user);
});

/**
 * @desc    Update current user profile
 * @route   PATCH /api/v1/users/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, username, bio, avatar } = req.body;

    const user = await UserModel.findById(req.user._id);

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Check if username is taken (if trying to change it)
    if (username && username !== user.username) {
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            throw createApiError(
                HTTP_STATUS.CONFLICT,
                ERROR_MESSAGES.USERNAME_TAKEN
            );
        }
        user.username = username;
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Get updated user without password
    const updatedUser = await UserModel.findById(user._id).select("-password");

    // Invalidate cache if needed
    await pubClient.del(`user:${user._id}`);

    // Emit socket event to user's servers about profile update
    const memberships = await ServerMemberModel.find({ user: user._id }).select("server");
    const io = getIO();

    memberships.forEach(membership => {
        io.to(`server:${membership.server}`).emit("user:profileUpdated", {
            userId: user._id,
            username: updatedUser.username,
            name: updatedUser.name,
            avatar: updatedUser.avatar,
            timestamp: new Date(),
        });
    });

    sendSuccess(res, updatedUser, SUCCESS_MESSAGES.PROFILE_UPDATED);
});

/**
 * @desc    Change user password
 * @route   PATCH /api/v1/users/me/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await UserModel.findById(req.user._id).select("+password");

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Check if user registered with email (not OAuth)
    if (user.provider !== "email") {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Cannot change password for ${user.provider} accounts`
        );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
        throw createApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Current password is incorrect"
        );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, "Password changed successfully");
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/users/me
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all servers owned by user
    const ownedServers = await ServerModel.find({ owner: userId });

    if (ownedServers.length > 0) {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "You must delete or transfer ownership of all your servers before deleting your account"
        );
    }

    // Remove user from all server memberships
    await ServerMemberModel.deleteMany({ user: userId });

    // Delete user
    await UserModel.findByIdAndDelete(userId);

    // Clear any cached data
    await pubClient.del(`user:${userId}`);

    sendSuccess(res, null, "Account deleted successfully");
});

/**
 * @desc    Upload user avatar
 * @route   POST /api/v1/users/me/avatar
 * @access  Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw createApiError(HTTP_STATUS.BAD_REQUEST, "No file uploaded");
    }

    // Assuming you have file upload middleware that saves to cloud storage
    // and adds the URL to req.file.location or req.file.path
    const avatarUrl = req.file.location || req.file.path;

    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true, runValidators: true }
    ).select("-password");

    // Invalidate cache
    await pubClient.del(`user:${user._id}`);

    // Emit socket event
    const memberships = await ServerMemberModel.find({ user: user._id }).select("server");
    const io = getIO();

    memberships.forEach(membership => {
        io.to(`server:${membership.server}`).emit("user:avatarUpdated", {
            userId: user._id,
            avatar: avatarUrl,
            timestamp: new Date(),
        });
    });

    sendSuccess(res, { avatar: avatarUrl }, "Avatar uploaded successfully");
});

// ============================================================================
// USER STATUS
// ============================================================================

/**
 * @desc    Update user status
 * @route   PATCH /api/v1/users/me/status
 * @access  Private
 */
export const updateStatus = asyncHandler(async (req, res) => {
    const { status, customStatus } = req.body;

    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            status,
            customStatus: customStatus || "",
            lastSeen: new Date(),
        },
        { new: true, runValidators: true }
    ).select("-password");

    // Invalidate cache
    await pubClient.del(`user:${user._id}`);

    // Emit socket event to all user's servers
    const memberships = await ServerMemberModel.find({ user: user._id }).select("server");
    const io = getIO();

    memberships.forEach(membership => {
        io.to(`server:${membership.server}`).emit("user:statusUpdated", {
            userId: user._id,
            status,
            customStatus,
            timestamp: new Date(),
        });
    });

    sendSuccess(res, user, "Status updated successfully");
});

// ============================================================================
// GET OTHER USERS
// ============================================================================

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Try cache first
    const cacheKey = `user:${id}`;
    const cached = await pubClient.get(cacheKey);

    if (cached) {
        return sendSuccess(res, JSON.parse(cached));
    }

    const user = await UserModel.findById(id)
        .select("-password")
        .lean();

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Cache for 30 minutes
    await pubClient.setex(cacheKey, 1800, JSON.stringify(user));

    sendSuccess(res, user);
});

/**
 * @desc    Search for users
 * @route   GET /api/v1/users/search?q=username
 * @access  Private
 */
export const searchUsers = asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        throw createApiError(HTTP_STATUS.BAD_REQUEST, "Search query is required");
    }

    const skip = (page - 1) * limit;

    // Search by username or name (case-insensitive)
    const users = await UserModel.find({
        $or: [
            { username: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
        ],
    })
        .select("username name avatar status customStatus")
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

    const total = await UserModel.countDocuments({
        $or: [
            { username: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
        ],
    });

    sendSuccess(res, {
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// ============================================================================
// USER SERVERS
// ============================================================================

/**
 * @desc    Get all servers user is a member of
 * @route   GET /api/v1/users/me/servers
 * @access  Private
 */
export const getUserServers = asyncHandler(async (req, res) => {
    const cacheKey = `user:${req.user._id}:servers`;

    // Try cache first
    const cached = await pubClient.get(cacheKey);
    if (cached) {
        return sendSuccess(res, JSON.parse(cached));
    }

    // Find all server memberships
    const memberships = await ServerMemberModel.find({
        user: req.user._id
    }).select("server");

    const serverIds = memberships.map(m => m.server);

    // Get servers
    const servers = await ServerModel.find({ _id: { $in: serverIds } })
        .populate("owner", "username name avatar")
        .select("name icon banner owner isPublic createdAt")
        .sort({ createdAt: -1 })
        .lean();

    // Cache for 30 minutes
    await pubClient.setex(cacheKey, 1800, JSON.stringify(servers));

    sendSuccess(res, servers);
});

// ============================================================================
// FRIENDS SYSTEM
// ============================================================================

/**
 * @desc    Get user's friends list
 * @route   GET /api/v1/users/me/friends
 * @access  Private
 */
export const getFriends = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user._id)
        .populate("friends", "username name avatar status customStatus lastSeen")
        .select("friends")
        .lean();

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    sendSuccess(res, user.friends);
});

/**
 * @desc    Add a friend
 * @route   POST /api/v1/users/me/friends/:userId
 * @access  Private
 */
export const addFriend = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Cannot add yourself as friend
    if (userId === req.user._id.toString()) {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Cannot add yourself as a friend"
        );
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Check if already friends
    const currentUser = await UserModel.findById(req.user._id);
    if (currentUser.friends.includes(userId)) {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Already friends with this user"
        );
    }

    // Add to both users' friend lists
    await UserModel.findByIdAndUpdate(req.user._id, {
        $addToSet: { friends: userId },
    });

    await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { friends: req.user._id },
    });

    // Emit socket event
    const io = getIO();
    io.to(`user:${userId}`).emit("friend:added", {
        user: {
            _id: req.user._id,
            username: req.user.username,
            name: req.user.name,
            avatar: req.user.avatar,
        },
        timestamp: new Date(),
    });

    sendSuccess(res, null, "Friend added successfully");
});

/**
 * @desc    Remove a friend
 * @route   DELETE /api/v1/users/me/friends/:userId
 * @access  Private
 */
export const removeFriend = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Remove from both users' friend lists
    await UserModel.findByIdAndUpdate(req.user._id, {
        $pull: { friends: userId },
    });

    await UserModel.findByIdAndUpdate(userId, {
        $pull: { friends: req.user._id },
    });

    // Emit socket event
    const io = getIO();
    io.to(`user:${userId}`).emit("friend:removed", {
        userId: req.user._id,
        timestamp: new Date(),
    });

    sendSuccess(res, null, "Friend removed successfully");
});

// ============================================================================
// BLOCKING SYSTEM
// ============================================================================

/**
 * @desc    Get list of blocked users
 * @route   GET /api/v1/users/me/blocked
 * @access  Private
 */
export const getBlockedUsers = asyncHandler(async (req, res) => {
    // You'll need to add a 'blocked' field to your User model
    const user = await UserModel.findById(req.user._id)
        .populate("blocked", "username name avatar")
        .select("blocked")
        .lean();

    if (!user) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    sendSuccess(res, user.blocked || []);
});

/**
 * @desc    Block a user
 * @route   POST /api/v1/users/me/blocked/:userId
 * @access  Private
 */
export const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Cannot block yourself
    if (userId === req.user._id.toString()) {
        throw createApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Cannot block yourself"
        );
    }

    // Check if user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
        throw createApiError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_MESSAGES.USER_NOT_FOUND
        );
    }

    // Add to blocked list
    await UserModel.findByIdAndUpdate(req.user._id, {
        $addToSet: { blocked: userId },
        $pull: { friends: userId }, // Remove from friends if they were friends
    });

    // Remove from other user's friends list
    await UserModel.findByIdAndUpdate(userId, {
        $pull: { friends: req.user._id },
    });

    sendSuccess(res, null, "User blocked successfully");
});

/**
 * @desc    Unblock a user
 * @route   DELETE /api/v1/users/me/blocked/:userId
 * @access  Private
 */
export const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Remove from blocked list
    await UserModel.findByIdAndUpdate(req.user._id, {
        $pull: { blocked: userId },
    });

    sendSuccess(res, null, "User unblocked successfully");
});

export default {
    getMe,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadAvatar,
    updateStatus,
    getUserById,
    searchUsers,
    getUserServers,
    getFriends,
    addFriend,
    removeFriend,
    getBlockedUsers,
    blockUser,
    unblockUser,
};