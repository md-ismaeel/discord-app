import express from "express";
import { authenticated } from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validate,
} from "../middlewares/validate.middleware.js";
import * as serverController from "../controllers/server.controller.js";
import * as channelController from "../controllers/channel.controller.js";
import {
  createServerSchema,
  updateServerSchema,
  serverIdParamSchema,
} from "../validations/server.validation.js";
import {
  createChannelSchema,
  updateChannelSchema,
  channelIdParamSchema,
} from "../validations/channel.validation.js";
import {
  updateMemberRoleSchema,
  memberIdParamSchema,
} from "../validations/serverMember.validation.js";
import {
  createInviteSchema,
  joinServerSchema,
} from "../validations/invite.validation.js";

const serverRouter = express.Router();

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================
serverRouter.use(authenticated); // Apply authentication to all routes below

// ============================================================================
// SERVER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/servers
 * @desc    Create a new server
 * @access  Private
 */
serverRouter.post(
  "/",
  validateBody(createServerSchema),
  serverController.createServer
);

/**
 * @route   GET /api/v1/servers
 * @desc    Get all servers for current user
 * @access  Private
 */
serverRouter.get("/", serverController.getUserServers);

/**
 * @route   POST /api/v1/servers/join
 * @desc    Join server using invite code
 * @access  Private
 */
// serverRouter.post(
//   "/join",
//   validateBody(joinServerSchema),
//   serverController.joinServer
// );

/**
 * @route   GET /api/v1/servers/:serverId
 * @desc    Get server by ID
 * @access  Private
 */
serverRouter.get(
  "/:serverId",
  validateParams(serverIdParamSchema),
  serverController.getServer
);

/**
 * @route   PATCH /api/v1/servers/:serverId
 * @desc    Update server
 * @access  Private (Owner or Admin)
 */
serverRouter.patch(
  "/:serverId",
  validateParams(serverIdParamSchema),
  validateBody(updateServerSchema),
  serverController.updateServer
);

/**
 * @route   DELETE /api/v1/servers/:serverId
 * @desc    Delete server
 * @access  Private (Owner only)
 */
serverRouter.delete(
  "/:serverId",
  validateParams(serverIdParamSchema),
  serverController.deleteServer
);

/**
 * @route   POST /api/v1/servers/:serverId/leave
 * @desc    Leave server
 * @access  Private
 */
serverRouter.post(
  "/:serverId/leave",
  validateParams(serverIdParamSchema),
  serverController.leaveServer
);

// ============================================================================
// SERVER MEMBER ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/servers/:serverId/members
 * @desc    Get all members of a server
 * @access  Private (Members only)
 */
serverRouter.get(
  "/:serverId/members",
  validateParams(serverIdParamSchema),
  serverController.getServerMembers
);

/**
 * @route   PATCH /api/v1/servers/:serverId/members/:memberId/role
 * @desc    Update member role
 * @access  Private (Owner or Admin)
 */
serverRouter.patch(
  "/:serverId/members/:memberId/role",
  validateParams(serverIdParamSchema),
  validateBody(updateMemberRoleSchema),
  serverController.updateMemberRole
);

/**
 * @route   DELETE /api/v1/servers/:serverId/members/:memberId
 * @desc    Kick member from server
 * @access  Private (Owner, Admin, or Moderator)
 */
serverRouter.delete(
  "/:serverId/members/:memberId",
  validateParams(serverIdParamSchema),
  serverController.kickMember
);

// ============================================================================
// SERVER INVITE ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/servers/:serverId/invites
 * @desc    Create server invite
 * @access  Private (Members with createInvite permission)
 */
// serverRouter.post(
//   "/:serverId/invites",
//   validateParams(serverIdParamSchema),
//   validateBody(createInviteSchema),
//   serverController.createInvite
// );

// ============================================================================
// CHANNEL ROUTES (nested under servers)
// ============================================================================

/**
 * @route   POST /api/v1/servers/:serverId/channels
 * @desc    Create a new channel
 * @access  Private (Owner, Admin, or Moderator)
 */
serverRouter.post(
  "/:serverId/channels",
  validateParams(serverIdParamSchema),
  validateBody(createChannelSchema),
  channelController.createChannel
);

/**
 * @route   GET /api/v1/servers/:serverId/channels
 * @desc    Get all channels in a server
 * @access  Private (Members only)
 */
serverRouter.get(
  "/:serverId/channels",
  validateParams(serverIdParamSchema),
  channelController.getServerChannels
);

/**
 * @route   PATCH /api/v1/servers/:serverId/channels/reorder
 * @desc    Reorder channels
 * @access  Private (Owner, Admin, or Moderator)
 */
serverRouter.patch(
  "/:serverId/channels/reorder",
  validateParams(serverIdParamSchema),
  channelController.reorderChannels
);

// ============================================================================
// STANDALONE CHANNEL ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/servers/channels/:channelId
 * @desc    Get channel by ID
 * @access  Private (Members only)
 */
serverRouter.get(
  "/channels/:channelId",
  validateParams(channelIdParamSchema),
  channelController.getChannel
);

/**
 * @route   PATCH /api/v1/servers/channels/:channelId
 * @desc    Update channel
 * @access  Private (Owner, Admin, or Moderator)
 */
serverRouter.patch(
  "/channels/:channelId",
  validateParams(channelIdParamSchema),
  validateBody(updateChannelSchema),
  channelController.updateChannel
);

/**
 * @route   DELETE /api/v1/servers/channels/:channelId
 * @desc    Delete channel
 * @access  Private (Owner or Admin)
 */
serverRouter.delete(
  "/channels/:channelId",
  validateParams(channelIdParamSchema),
  channelController.deleteChannel
);

export { serverRouter };