import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /playlists
 * Body: { name, description }
 * Creates a playlist for the authenticated user.
 */
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!name || !name.toString().trim()) throw new ApiError(400, "Playlist name is required");

  const playlist = await Playlist.create({
    name: name.toString().trim(),
    description: description?.toString().trim() || "",
    owner: req.user._id,
    videos: [],
    createdAt: new Date(),
  });

  return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

/**
 * GET /users/:userId/playlists
 * Fetch playlists for a given userId.
 * Query params: page, limit (optional)
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  const playlists = await Playlist.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.status(200).json(new ApiResponse(200, { playlists, page, limit }, "User playlists fetched successfully"));
});

/**
 * GET /playlists/:playlistId
 * Fetch one playlist by id (with videos if your schema references them and you want to populate).
 */
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id");

  const playlist = await Playlist.findById(playlistId).lean();
  if (!playlist) throw new ApiError(404, "Playlist not found");

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

/**
 * POST /playlists/:playlistId/videos/:videoId
 * Add a video to playlist. Only owner can add.
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!playlistId || !isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id");
  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  // add without duplication
  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Video added to playlist"));
});

/**
 * DELETE /playlists/:playlistId/videos/:videoId
 * Remove a video from playlist. Only owner can remove.
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!playlistId || !isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id");
  if (!videoId || !isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to modify this playlist");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Video removed from playlist"));
});

/**
 * DELETE /playlists/:playlistId
 * Delete a playlist. Only owner can delete.
 * This performs a hard delete. If you prefer soft delete, replace with update { isDeleted: true }.
 */
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!playlistId || !isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

/**
 * PATCH /playlists/:playlistId
 * Body: { name?, description? }
 * Update playlist metadata. Only owner can update.
 */
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Authentication required");
  if (!playlistId || !isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this playlist");
  }

  const updatePayload = {};
  if (name?.toString().trim()) updatePayload.name = name.toString().trim();
  if (description !== undefined) updatePayload.description = description?.toString().trim() || "";

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updatePayload },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};
