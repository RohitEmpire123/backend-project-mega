import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /videos/:videoId/comments
 * Query: page, limit
 */
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username fullName avatar")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, { comments, page, limit }, "Comments fetched successfully")
    );
});

/**
 * POST /videos/:videoId/comments
 * Body: { content }
 */
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!req.user?._id) throw new ApiError(401, "Authentication required");

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    if (!content || !content.toString().trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content: content.toString().trim(),
        createdAt: new Date(),
    });

    // populate owner details in response
    await comment.populate("owner", "username fullName avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

/**
 * PATCH /comments/:commentId
 * Body: { content }
 */
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user?._id) throw new ApiError(401, "Authentication required");

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    if (!content || !content.toString().trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = content.toString().trim();
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate("owner", "username fullName avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

/**
 * DELETE /comments/:commentId
 */
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!req.user?._id) throw new ApiError(401, "Authentication required");

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
