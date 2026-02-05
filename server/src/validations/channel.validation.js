import { z } from "zod";

export const createChannelSchema = z.object({
    name: z
        .string()
        .min(1, "Channel name is required")
        .max(100, "Channel name cannot exceed 100 characters")
        .trim()
        .regex(/^[a-z0-9-]+$/, "Channel name can only contain lowercase letters, numbers, and hyphens"),
    type: z
        .enum(["text", "voice", "announcement"], {
            errorMap: () => ({ message: "Type must be one of: text, voice, announcement" })
        }),
    topic: z
        .string()
        .max(1024, "Topic cannot exceed 1024 characters")
        .optional()
        .default(""),
    category: z
        .string()
        .max(100, "Category cannot exceed 100 characters")
        .optional()
        .nullable(),
    position: z
        .number()
        .int()
        .min(0, "Position must be a positive number")
        .optional()
        .default(0),
    isPrivate: z
        .boolean()
        .optional()
        .default(false),
    allowedRoles: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID"))
        .optional()
        .default([]),
});

export const updateChannelSchema = z.object({
    name: z
        .string()
        .min(1, "Channel name is required")
        .max(100, "Channel name cannot exceed 100 characters")
        .trim()
        .regex(/^[a-z0-9-]+$/, "Channel name can only contain lowercase letters, numbers, and hyphens")
        .optional(),
    topic: z
        .string()
        .max(1024, "Topic cannot exceed 1024 characters")
        .optional(),
    category: z
        .string()
        .max(100, "Category cannot exceed 100 characters")
        .optional()
        .nullable(),
    position: z
        .number()
        .int()
        .min(0, "Position must be a positive number")
        .optional(),
    isPrivate: z
        .boolean()
        .optional(),
    allowedRoles: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID"))
        .optional(),
});

export const channelIdParamSchema = z.object({
    channelId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid channel ID format"),
});