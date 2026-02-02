// src/models/ServerMember.js
import mongoose from "mongoose";

const serverMemberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        server: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Server",
            required: true,
        },
        nickname: {
            type: String,
            trim: true,
            default: null,
        },
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Role",
            },
        ],
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate memberships
serverMemberSchema.index({ user: 1, server: 1 }, { unique: true });
serverMemberSchema.index({ server: 1 });

export const ServerMemberModel = mongoose.model("ServerMember", serverMemberSchema);
