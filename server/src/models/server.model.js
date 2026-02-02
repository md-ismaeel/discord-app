import mongoose from "mongoose";

const serverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        icon: {
            type: String,
            default: null,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ServerMember",
            },
        ],
        channels: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Channel",
            },
        ],
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Role",
            },
        ],
        invites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Invite",
            },
        ],
    },
    {
        timestamps: true,
    }
);

serverSchema.index({ owner: 1 });
serverSchema.index({ name: 1 });

export const ServerModel = mongoose.model("Server", serverSchema);
