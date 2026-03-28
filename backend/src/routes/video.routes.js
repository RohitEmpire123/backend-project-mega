// routes/video.router.js
import { Router } from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public listing & search
router.route("/").get(getAllVideos);

// Publish a video (protected) - expects optional thumbnail file named "thumbnail"
router.route("/").post(verifyJWT, upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
])
, publishAVideo);

// Video detail & view (increments views)
router.route("/:videoId").get(getVideoById);

// Update / Delete / Toggle publish (owner only)
router.route("/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo).delete(verifyJWT, deleteVideo);
router.route("/:videoId/toggle-publish").patch(verifyJWT, togglePublishStatus);

export default router;
