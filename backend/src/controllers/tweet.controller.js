// import mongoose, { isValidObjectId } from "mongoose"
// import {Tweet} from "../models/tweet.model.js"
// import {User} from "../models/user.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const createTweet = asyncHandler(async (req, res) => {
//     //TODO: create tweet
// })

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
// })

// const updateTweet = asyncHandler(async (req, res) => {
//     //TODO: update tweet
// })

// const deleteTweet = asyncHandler(async (req, res) => {
//     //TODO: delete tweet
// })

// export {
//     createTweet,
//     getUserTweets,
//     updateTweet,
//     deleteTweet
// }
import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /tweets
 * Body: { content }
 * Creates a tweet owned by the authenticated user (req.user must exist).
 */
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!content || !content.toString().trim()) throw new ApiError(400, "Tweet content is required");

  // optional: enforce max length
  const text = content.toString().trim();
  const MAX_LEN = 280;
  if (text.length > MAX_LEN) throw new ApiError(400, `Tweet content must be at most ${MAX_LEN} characters`);

  // ensure user exists (token may be valid but user removed)
  const user = await User.findById(req.user._id).select("_id username");
  if (!user) throw new ApiError(401, "Invalid user");

  const tweet = await Tweet.create({
    content: text,
    owner: user._id,
    createdAt: new Date()
  });

  // Optional: if you denormalize tweets on User schema (e.g., user.tweets array)
  // try to push tweet._id; ignore failure so tweet creation still succeeds.
  try {
    await User.findByIdAndUpdate(user._id, { $push: { tweets: tweet._id } }, { new: true });
  } catch (err) {
    // silently ignore or log
  }

  // Populate owner summary for response
  await tweet.populate({ path: "owner", select: "username fullName avatar" }).execPopulate?.() || await tweet.populate("owner", "username fullName avatar");

  return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

/**
 * GET /users/:identifier/tweets
 * identifier can be userId (ObjectId) or username (string)
 * Query: page, limit
 */
const getUserTweets = asyncHandler(async (req, res) => {
  const { identifier } = req.params; // use route like /users/:identifier/tweets
  let userId;

  // If identifier looks like ObjectId, use it; otherwise treat as username
  if (!identifier) throw new ApiError(400, "User identifier is required");

  if (isValidObjectId(identifier)) {
    userId = identifier;
  } else {
    const userByName = await User.findOne({ username: identifier.toLowerCase() }).select("_id");
    if (!userByName) throw new ApiError(404, "User not found");
    userId = userByName._id;
  }

  // Pagination
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  // Basic query: latest first, owner populated
  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("owner", "username fullName avatar")
    .lean();

  return res.status(200).json(new ApiResponse(200, { tweets, page, limit }, "User tweets fetched successfully"));
});

/**
 * PATCH /tweets/:tweetId
 * Body: { content }
 * Only owner can update their tweet.
 */
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");
  if (!content || !content.toString().trim()) throw new ApiError(400, "Tweet content is required");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to edit this tweet");
  }

  // update fields and save (so pre-save hooks/validators run)
  tweet.content = content.toString().trim();
  tweet.editedAt = new Date();

  await tweet.save();

  await tweet.populate("owner", "username fullName avatar");

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

/**
 * DELETE /tweets/:tweetId
 * Only owner can delete their tweet.
 * This implementation performs a hard delete. If you prefer soft delete,
 * replace findByIdAndDelete with findByIdAndUpdate({ isDeleted: true })
 */
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!tweetId || !isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this tweet");
  }

  // Delete tweet
  await Tweet.findByIdAndDelete(tweetId);

  // Optional: remove tweet id from user's tweets array if it exists
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { tweets: tweet._id } });
  } catch (err) {
    // ignore; deletion already succeeded
  }

  return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
};
