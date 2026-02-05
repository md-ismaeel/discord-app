import { z } from "zod";

export const createServerSchema = z.object({
    name: z
        .string()
        .min(2, "Server name must be at least 2 characters")
        .max(100, "Server name cannot exceed 100 characters")
        .trim(),
    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
        .default(""),
    icon: z
        .string()
        .url("Icon must be a valid URL")
        .optional()
        .nullable(),
    banner: z
        .string()
        .url("Banner must be a valid URL")
        .optional()
        .nullable(),
    isPublic: z
        .boolean()
        .optional()
        .default(false),
});

export const updateServerSchema = z.object({
    name: z
        .string()
        .min(2, "Server name must be at least 2 characters")
        .max(100, "Server name cannot exceed 100 characters")
        .trim()
        .optional(),
    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),
    icon: z
        .string()
        .url("Icon must be a valid URL")
        .optional()
        .nullable(),
    banner: z
        .string()
        .url("Banner must be a valid URL")
        .optional()
        .nullable(),
    isPublic: z
        .boolean()
        .optional(),
});

export const serverIdParamSchema = z.object({
    serverId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid server ID format"),
});




