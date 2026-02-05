import { z } from "zod";

export const createRoleSchema = z.object({
    name: z
        .string()
        .min(1, "Role name is required")
        .max(100, "Role name cannot exceed 100 characters")
        .trim(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)")
        .optional()
        .default("#99AAB5"),
    permissions: z.object({
        administrator: z.boolean().optional().default(false),
        manageServer: z.boolean().optional().default(false),
        manageRoles: z.boolean().optional().default(false),
        manageChannels: z.boolean().optional().default(false),
        kickMembers: z.boolean().optional().default(false),
        banMembers: z.boolean().optional().default(false),
        createInvite: z.boolean().optional().default(true),
        manageMessages: z.boolean().optional().default(false),
        sendMessages: z.boolean().optional().default(true),
        readMessages: z.boolean().optional().default(true),
        mentionEveryone: z.boolean().optional().default(false),
        connect: z.boolean().optional().default(true),
        speak: z.boolean().optional().default(true),
        muteMembers: z.boolean().optional().default(false),
        deafenMembers: z.boolean().optional().default(false),
    }).optional().default({}),
    position: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0),
});

export const updateRoleSchema = z.object({
    name: z
        .string()
        .min(1, "Role name is required")
        .max(100, "Role name cannot exceed 100 characters")
        .trim()
        .optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .optional(),
    permissions: z.object({
        administrator: z.boolean().optional(),
        manageServer: z.boolean().optional(),
        manageRoles: z.boolean().optional(),
        manageChannels: z.boolean().optional(),
        kickMembers: z.boolean().optional(),
        banMembers: z.boolean().optional(),
        createInvite: z.boolean().optional(),
        manageMessages: z.boolean().optional(),
        sendMessages: z.boolean().optional(),
        readMessages: z.boolean().optional(),
        mentionEveryone: z.boolean().optional(),
        connect: z.boolean().optional(),
        speak: z.boolean().optional(),
        muteMembers: z.boolean().optional(),
        deafenMembers: z.boolean().optional(),
    }).optional(),
    position: z
        .number()
        .int()
        .min(0)
        .optional(),
});

export const roleIdParamSchema = z.object({
    roleId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID format"),
});