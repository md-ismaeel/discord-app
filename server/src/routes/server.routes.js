import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody, validateParams, validate } from "../middlewares/validation.middleware.js";
import * as serverController from "../controllers/server.controller.js";
import * as channelController from "../controllers/channel.controller.js";
import { createServerSchema, updateServerSchema, serverIdParamSchema, } from "../validations/server.validation.js";
import { createChannelSchema, updateChannelSchema, channelIdParamSchema, } from "../validations/channel.validation.js"
import { updateMemberRoleSchema, memberIdParamSchema, createInviteSchema, joinServerSchema } from "../validations/serverMember.validation.js"
import { createInviteSchema, joinServerSchema } from "../validations/invite.validation.js"


const router = express.Router();

// ============================================================================
// SERVER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/servers
 * @desc    Create a new server
 * @access  Private
 */
router.post(
    "/",
    authenticate,
    validateBody(createServerSchema),
    serverController.createServer
);

/**
 * @route   GET /api/v1/servers
 * @desc    Get all servers for current user
 * @access  Private
 */
router.get(
    "/",
    authenticate,
    serverController.getUserServers
);

/**
 * @route   POST /api/v1/servers/join
 * @desc    Join server using invite code
 * @access  Private
 */
router.post(
    "/join",
    authenticate,
    validateBody(joinServerSchema),
    serverController.joinServer
);

/**
 * @route   GET /api/v1/servers/:serverId
 * @desc    Get server by ID
 * @access  Private
 */
router.get(
    "/:serverId",
    authenticate,
    validateParams(serverIdParamSchema),
    serverController.getServer
);

/**
 * @route   PATCH /api/v1/servers/:serverId
 * @desc    Update server
 * @access  Private (Owner or Admin)
 */
router.patch(
    "/:serverId",
    authenticate,
    validate(updateServerSchema, serverIdParamSchema),
    serverController.updateServer
);

/**
 * @route   DELETE /api/v1/servers/:serverId
 * @desc    Delete server
 * @access  Private (Owner only)
 */
router.delete(
    "/:serverId",
    authenticate,
    validateParams(serverIdParamSchema),
    serverController.deleteServer
);

/**
 * @route   POST /api/v1/servers/:serverId/leave
 * @desc    Leave server
 * @access  Private
 */
router.post(
    "/:serverId/leave",
    authenticate,
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
router.get(
    "/:serverId/members",
    authenticate,
    validateParams(serverIdParamSchema),
    serverController.getServerMembers
);

/**
 * @route   PATCH /api/v1/servers/:serverId/members/:memberId/role
 * @desc    Update member role
 * @access  Private (Owner or Admin)
 */
router.patch(
    "/:serverId/members/:memberId/role",
    authenticate,
    validateParams(serverIdParamSchema),
    validateBody(updateMemberRoleSchema),
    serverController.updateMemberRole
);

/**
 * @route   DELETE /api/v1/servers/:serverId/members/:memberId
 * @desc    Kick member from server
 * @access  Private (Owner, Admin, or Moderator)
 */
router.delete(
    "/:serverId/members/:memberId",
    authenticate,
    validateParams(serverIdParamSchema),
    validateBody(kickMemberSchema),
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
router.post(
    "/:serverId/invites",
    authenticate,
    validateParams(serverIdParamSchema),
    validateBody(createInviteSchema),
    serverController.createInvite
);

// ============================================================================
// CHANNEL ROUTES (nested under servers)
// ============================================================================

/**
 * @route   POST /api/v1/servers/:serverId/channels
 * @desc    Create a new channel
 * @access  Private (Owner, Admin, or Moderator)
 */
router.post(
    "/:serverId/channels",
    authenticate,
    validateParams(serverIdParamSchema),
    validateBody(createChannelSchema),
    channelController.createChannel
);

/**
 * @route   GET /api/v1/servers/:serverId/channels
 * @desc    Get all channels in a server
 * @access  Private (Members only)
 */
router.get(
    "/:serverId/channels",
    authenticate,
    validateParams(serverIdParamSchema),
    channelController.getServerChannels
);

/**
 * @route   PATCH /api/v1/servers/:serverId/channels/reorder
 * @desc    Reorder channels
 * @access  Private (Owner, Admin, or Moderator)
 */
router.patch(
    "/:serverId/channels/reorder",
    authenticate,
    validateParams(serverIdParamSchema),
    channelController.reorderChannels
);

// ============================================================================
// STANDALONE CHANNEL ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/channels/:channelId
 * @desc    Get channel by ID
 * @access  Private (Members only)
 */
router.get(
    "/channels/:channelId",
    authenticate,
    validateParams(channelIdParamSchema),
    channelController.getChannel
);

/**
 * @route   PATCH /api/v1/channels/:channelId
 * @desc    Update channel
 * @access  Private (Owner, Admin, or Moderator)
 */
router.patch(
    "/channels/:channelId",
    authenticate,
    validate(updateChannelSchema, channelIdParamSchema),
    channelController.updateChannel
);

/**
 * @route   DELETE /api/v1/channels/:channelId
 * @desc    Delete channel
 * @access  Private (Owner or Admin)
 */
router.delete(
    "/channels/:channelId",
    authenticate,
    validateParams(channelIdParamSchema),
    channelController.deleteChannel
);

export default router;