// routes/like.router.js
import { Router } from "express";
import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Toggle likes (protected)
router.route("/videos/:videoId/like").post(verifyJWT, toggleVideoLike);
router.route("/comments/:commentId/like").post(verifyJWT, toggleCommentLike);
router.route("/tweets/:tweetId/like").post(verifyJWT, toggleTweetLike);

// Get liked videos for current user
router.route("/likes/videos").get(verifyJWT, getLikedVideos);

export default router;
