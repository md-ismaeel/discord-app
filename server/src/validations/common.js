import { z } from "zod";

export const paginationSchema = z.object({
    page: z
        .string()
        .regex(/^\d+$/, "Page must be a number")
        .transform(Number)
        .refine(val => val > 0, "Page must be greater than 0")
        .optional()
        .default("1"),
    limit: z
        .string()
        .regex(/^\d+$/, "Limit must be a number")
        .transform(Number)
        .refine(val => val > 0 && val <= 100, "Limit must be between 1 and 100")
        .optional()
        .default("20"),
});