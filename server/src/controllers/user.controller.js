import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { createApiError } from "../utils/ApiError.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { SUCCESS_MESSAGES } from "../constants/successMessages.js";
import { UserModel } from "../models/user.model.js";

// @desc    Get current user profile
export const getMe = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user._id)
        .populate("friends", "name username avatar status")
        .populate("servers", "name icon");

    return sendSuccess(res, user);
});

// @desc    Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    )
        .populate("friends", "name username avatar status")
        .populate("servers", "name icon");

    if (!user) {
        throw createApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);
});

// @desc    Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await UserModel.findById(id)
        .select("name username avatar status customStatus bio")
        .populate("friends", "name username avatar status");

    if (!user) {
        throw createApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, user);
});

// @desc    Search users by username or name
export const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        throw createApiError(400, "Search term must be at least 2 characters");
    }

    const users = await UserModel.find({
        $or: [
            { username: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
        ],
        _id: { $ne: req.user._id }, // Exclude current user
    })
        .select("name username avatar status")
        .limit(20);

    return sendSuccess(res, users);
});

// @desc    Update user status (online, offline, away, dnd)
export const updateStatus = asyncHandler(async (req, res) => {
    const { status, customStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (customStatus !== undefined) updateData.customStatus = customStatus;

    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
    ).select("status customStatus");

    return sendSuccess(res, user, "Status updated successfully");
});

// @desc    Delete user account
export const deleteAccount = asyncHandler(async (req, res) => {
    await UserModel.findByIdAndDelete(req.user._id);

    // Clear cookie
    res.clearCookie("token");

    return sendSuccess(res, null, SUCCESS_MESSAGES.USER_DELETED);
});