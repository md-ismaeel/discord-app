import { z } from "zod"

export const createInviteSchema = z.object({
    maxUses: z
        .number()
        .int()
        .min(0, "Max uses must be 0 (unlimited) or positive")
        .max(100, "Max uses cannot exceed 100")
        .optional()
        .default(0),
    expiresIn: z
        .number()
        .int()
        .min(0, "Expiration must be 0 (never) or positive")
        .max(604800, "Expiration cannot exceed 7 days (604800 seconds)")
        .optional()
        .default(86400), // 24 hours
});

export const joinServerSchema = z.object({
    inviteCode: z
        .string()
        .length(8, "Invite code must be 8 characters")
        .regex(/^[A-Za-z0-9]+$/, "Invalid invite code format"),
});
