import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * GET /videos
 * Query params: page, limit, query (text), sortBy (createdAt/views/title), sortType (asc/desc), userId
 */
const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query && query.toString().trim()) {
    const q = query.toString().trim();
    // basic text search on title & description
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");
    filter.owner = mongoose.Types.ObjectId(userId);
  }

  // safe sort field list
  const ALLOWED_SORT_FIELDS = ["createdAt", "views", "title"];
  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) sortBy = "createdAt";
  sortType = sortType === "asc" ? 1 : -1;

  const sort = { [sortBy]: sortType };

  const [total, videos] = await Promise.all([
    Video.countDocuments(filter),
    Video.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", "username fullName avatar")
      .lean(),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { videos, page, limit, total }, "Videos fetched successfully"));
});

/**
 * POST /videos
 * Body: { title, description }
 * File: optionally req.file (thumbnail)
 */
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!title?.trim()) throw new ApiError(400, "Video title is required");

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  // Upload video
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  if (!uploadedVideo?.url) {
    throw new ApiError(400, "Error uploading video");
  }

  // Upload thumbnail (optional)
  let uploadedThumbnail;
  if (thumbnailLocalPath) {
    uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  }

  const video = await Video.create({
    title: title.trim(),
    description: description?.trim() || "",
    owner: req.user._id,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail?.url || "",
    duration: uploadedVideo.duration || 0,
    views: 0,
    isPublished: true
  });

  await video.populate("owner", "username fullName avatar");

  return res.status(201).json(
    new ApiResponse(201, video, "Video uploaded successfully")
  );
});


/**
 * GET /videos/:videoId
 * increments views by 1 (atomically) and returns populated video
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  // increment views atomically and return the document
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("owner", "username fullName avatar")
    .lean();

  if (!video) throw new ApiError(404, "Video not found");

  return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

/**
 * PATCH /videos/:videoId
 * Body: { title?, description? }
 * File: optional req.file for new thumbnail
 */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  if (!req.user?._id) throw new ApiError(401, "Authentication required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const updatePayload = {};
  if (title?.toString().trim()) updatePayload.title = title.toString().trim();
  if (description !== undefined) updatePayload.description = description?.toString().trim() || "";

  const thumbnailLocalPath = req.file?.path;
  if (thumbnailLocalPath) {
    const uploaded = await uploadOnCloudinary(thumbnailLocalPath);
    if (!uploaded?.url) throw new ApiError(400, "Error while uploading thumbnail");
    updatePayload.thumbnail = uploaded.url;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const updated = await Video.findByIdAndUpdate(videoId, { $set: updatePayload }, { new: true, runValidators: true })
    .populate("owner", "username fullName avatar");

  return res.status(200).json(new ApiResponse(200, updated, "Video updated successfully"));
});

/**
 * DELETE /videos/:videoId
 * Only owner can delete (hard delete)
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  if (!req.user?._id) throw new ApiError(401, "Authentication required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

/**
 * PATCH /videos/:videoId/toggle-publish
 * Toggle isPublished flag (owner only)
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  if (!req.user?._id) throw new ApiError(401, "Authentication required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change publish status of this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
