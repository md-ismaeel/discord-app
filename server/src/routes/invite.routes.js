import express from "express";
import { authenticated } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middlewares/validate.middleware.js";
import * as inviteController from "../controllers/invite.controller.js";
import { z } from "zod";

const inviteRouter = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createInviteSchema = z.object({
  maxUses: z.number().int().positive().optional(),
  expiresIn: z.number().int().positive().max(168).optional(), // Max 7 days (168 hours)
});

const serverIdParamSchema = z.object({
  serverId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid server ID"),
});

const inviteCodeParamSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

// ============================================================================
// PUBLIC ROUTES (No auth required to view invites)
// ============================================================================

//    Get invite details by code
inviteRouter.get(
  "/:code",
  validateParams(inviteCodeParamSchema),
  inviteController.getInvite,
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================
inviteRouter.use(authenticated);

//    Join server using invite code
inviteRouter.post(
  "/:code/join",
  validateParams(inviteCodeParamSchema),
  inviteController.joinServerWithInvite,
);

//    Delete/Revoke an invite
inviteRouter.delete(
  "/:code",
  validateParams(inviteCodeParamSchema),
  inviteController.deleteInvite,
);

//    Clean up expired invites
inviteRouter.post("/cleanup", inviteController.cleanupExpiredInvites);

// ============================================================================
// SERVER-SPECIFIC INVITE ROUTES (nested under servers)
// These are typically used in server.routes.js but included here for reference
// ============================================================================

//    Create server invite
inviteRouter.post(
  "/servers/:serverId/invites",
  validateParams(serverIdParamSchema),
  validateBody(createInviteSchema),
  inviteController.createInvite,
);

//    Get all invites for a server
inviteRouter.get(
  "/servers/:serverId/invites",
  validateParams(serverIdParamSchema),
  inviteController.getServerInvites,
);

export { inviteRouter };
