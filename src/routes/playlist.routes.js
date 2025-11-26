// routes/playlist.router.js
import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create playlist (protected)
router.route("/playlists").post(verifyJWT, createPlaylist);

// Get playlists of a user
router.route("/users/:userId/playlists").get(getUserPlaylists);

// Playlist operations
router.route("/playlists/:playlistId").get(getPlaylistById).patch(verifyJWT, updatePlaylist).delete(verifyJWT, deletePlaylist);

// Add / Remove video
router.route("/playlists/:playlistId/videos/:videoId").post(verifyJWT, addVideoToPlaylist).delete(verifyJWT, removeVideoFromPlaylist);

export default router;
