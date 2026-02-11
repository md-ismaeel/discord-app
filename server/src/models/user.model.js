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
        return this.provider === "email";
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
    // Cloud storage identifiers for avatar (choose one based on your provider)
    avatarPublicId: {
      type: String,
      default: null, // For Cloudinary
    },
    avatarKey: {
      type: String,
      default: null, // For AWS S3
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
      maxlength: 128,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
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
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
    // Account settings
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "dark",
      },
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        directMessages: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ provider: 1, providerId: 1 });
userSchema.index({ status: 1 });

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.avatarPublicId; // Don't expose cloud storage IDs
  delete obj.avatarKey;
  return obj;
};

// Virtual for display name
userSchema.virtual("displayName").get(function () {
  return this.username || this.name;
});

// Method to check if user is online
userSchema.methods.isOnline = function () {
  return this.status === "online";
};

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
