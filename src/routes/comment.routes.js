// routes/comment.router.js
import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Comments for a video (public)
router.route("/videos/:videoId/comments").get(getVideoComments).post(verifyJWT, addComment);

// Single comment operations (owner only)
router.route("/comments/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment);

export default router;
