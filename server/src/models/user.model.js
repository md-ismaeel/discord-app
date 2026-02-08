import mongoose from "mongoose";

const img = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return this.provider === 'email';
            },
            minlength: 6,
            select: false, // Don't include password in queries by default
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        avatar: {
            type: String,
            default: img,
        },
        provider: {
            type: String,
            enum: ["email", "google", "github", "facebook"],
            required: true,
        },
        providerId: {
            type: String,
            sparse: true,
        },
        status: {
            type: String,
            enum: ["online", "offline", "away", "dnd"],
            default: "offline",
        },
        customStatus: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        servers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Server",
            },
        ],
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ provider: 1, providerId: 1 });

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);