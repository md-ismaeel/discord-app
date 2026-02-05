import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import img from "../assets/default-avatar.jpg";

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
            select: false,
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

// Hash password before saving
userSchema.pre("save", async function () {
    // Only hash password if it's modified and provider is email
    if (!this.isModified("password") || this.provider !== "email") {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);