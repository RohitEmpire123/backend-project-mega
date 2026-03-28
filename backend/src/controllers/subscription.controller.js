import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /channels/:channelId/toggle-subscribe
 * Toggle subscription for authenticated user to channelId.
 */
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Authentication required");
  if (!channelId || !isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

  // cannot subscribe to self
  if (userId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  // Ensure channel (user) exists
  const channel = await User.findById(channelId).select("_id");
  if (!channel) throw new ApiError(404, "Channel not found");

  const existing = await Subscription.findOne({ subscriber: userId, channel: channelId });

  if (existing) {
    // Unsubscribe
    await Subscription.findByIdAndDelete(existing._id);
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    return res
      .status(200)
      .json(new ApiResponse(200, { subscribed: false, totalSubscribers }, "Unsubscribed successfully"));
  } else {
    // Subscribe
    const sub = await Subscription.create({
      subscriber: userId,
      channel: mongoose.Types.ObjectId(channelId),
      createdAt: new Date(),
    });

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    return res
      .status(201)
      .json(new ApiResponse(201, { subscribed: true, subscriptionId: sub._id, totalSubscribers }, "Subscribed successfully"));
  }
});

/**
 * GET /channels/:channelId/subscribers
 * Returns paginated list of subscribers for a channel.
 * Query params: page, limit
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  let { page = 1, limit = 20 } = req.query;

  if (!channelId || !isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (page - 1) * limit;

  const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

  const subs = await Subscription.find({ channel: channelId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("subscriber", "username fullName avatar")
    .lean();

  // Map to subscriber objects for client
  const subscribers = subs.map((s) => s.subscriber).filter(Boolean);

  return res
    .status(200)
    .json(new ApiResponse(200, { subscribers, totalSubscribers, page, limit }, "Channel subscribers fetched successfully"));
});

/**
 * GET /users/:subscriberId/subscriptions
 * Returns list of channels the user has subscribed to.
 * If subscriberId is not provided, uses currently authenticated user.
 * Query params: page, limit
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
  let { subscriberId } = req.params;
  let { page = 1, limit = 20 } = req.query;

  if (!subscriberId) {
    if (!req.user?._id) throw new ApiError(401, "Authentication required");
    subscriberId = req.user._id;
  }

  if (!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriber id");

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (page - 1) * limit;

  const total = await Subscription.countDocuments({ subscriber: subscriberId });

  const subs = await Subscription.find({ subscriber: subscriberId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("channel", "username fullName avatar")
    .lean();

  const channels = subs.map((s) => s.channel).filter(Boolean);

  return res
    .status(200)
    .json(new ApiResponse(200, { channels, total, page, limit }, "Subscribed channels fetched successfully"));
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
}
