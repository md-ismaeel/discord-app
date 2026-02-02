import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .trim(),
    email: z
        .string()
        .email("Please provide a valid email")
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password cannot exceed 100 characters"),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .trim()
        .optional(),
});

export const loginSchema = z.object({
    email: z
        .string()
        .email("Please provide a valid email")
        .toLowerCase()
        .trim(),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .trim()
        .optional(),
    password: z
        .string()
        .min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .trim()
        .optional(),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .trim()
        .optional(),
    avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
    status: z.enum(["online", "offline", "away", "dnd"]).optional(),
    customStatus: z
        .string()
        .max(128, "Status cannot exceed 128 characters")
        .optional(),
    bio: z
        .string()
        .max(190, "Bio cannot exceed 190 characters")
        .optional(),
});