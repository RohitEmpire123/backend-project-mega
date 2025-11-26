import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Toggle like on a video.
 * POST /videos/:videoId/like  (or similar)
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Authentication required");
  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  // Check if like already exists for this user + video
  const existing = await Like.findOne({ user: userId, video: videoId });

  if (existing) {
    // remove like
    await Like.findByIdAndDelete(existing._id);
    return res.status(200).json(new ApiResponse(200, { liked: false }, "Video unliked"));
  } else {
    // create like
    const like = await Like.create({
      user: userId,
      video: mongoose.Types.ObjectId(videoId),
      createdAt: new Date(),
    });
    return res.status(201).json(new ApiResponse(201, { liked: true, likeId: like._id }, "Video liked"));
  }
});

/**
 * Toggle like on a comment.
 * POST /comments/:commentId/like
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Authentication required");
  if (!commentId || !isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment id");

  const existing = await Like.findOne({ user: userId, comment: commentId });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return res.status(200).json(new ApiResponse(200, { liked: false }, "Comment unliked"));
  } else {
    const like = await Like.create({
      user: userId,
      comment: mongoose.Types.ObjectId(commentId),
      createdAt: new Date(),
    });
    return res.status(201).json(new ApiResponse(201, { liked: true, likeId: like._id }, "Comment liked"));
  }
});

/**
 * Toggle like on a tweet.
 * POST /tweets/:tweetId/like
 */
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!userId) throw new ApiError(401, "Authentication required");
  if (!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const existing = await Like.findOne({ user: userId, tweet: tweetId });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return res.status(200).json(new ApiResponse(200, { liked: false }, "Tweet unliked"));
  } else {
    const like = await Like.create({
      user: userId,
      tweet: mongoose.Types.ObjectId(tweetId),
      createdAt: new Date(),
    });
    return res.status(201).json(new ApiResponse(201, { liked: true, likeId: like._id }, "Tweet liked"));
  }
});

/**
 * GET /likes/videos
 * Get videos liked by current user (paginated). Assumes Like.video references a Video model.
 */
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Authentication required");

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  // find likes by user where video is present, populate the video
  const likes = await Like.find({ user: userId, video: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "video",
      select: "title description owner thumbnail createdAt", // adjust fields to your Video schema
      populate: { path: "owner", select: "username fullName avatar" },
    })
    .lean();

  // map to only return populated video objects (omit nulls)
  const videos = likes.map((lk) => lk.video).filter(Boolean);

  return res.status(200).json(new ApiResponse(200, { videos, page, limit }, "Liked videos fetched successfully"));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
