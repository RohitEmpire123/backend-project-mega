import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /dashboard/stats
 * Returns global platform statistics useful for an admin dashboard:
 *  - totalUsers
 *  - totalVideos
 *  - totalPlaylists
 *  - totalSubscribers (total subscription relations)
 *  - totalVideoViews (sum of video.views)
 *  - totalLikes (likes across videos)
 *
 * Also returns small snapshots:
 *  - topVideos (by views) limited
 *  - recentUsers (latest registered users) limited
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // You might restrict this route to admins via middleware; omitted here.
  const TOP_VIDEOS_LIMIT = Math.min(10, parseInt(req.query.top || "5", 10));
  const RECENT_USERS_LIMIT = Math.min(10, parseInt(req.query.recent || "5", 10));

  // Use promises in parallel for speed
  const totalUsersP = User.countDocuments({});
  const totalVideosP = Video.countDocuments({});
  const totalPlaylistsP = Playlist.countDocuments({});
  const totalSubscriptionsP = Subscription.countDocuments({});

  // Aggregate videos: totalViews and topVideos
  const videosAggP = Video.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $ifNull: ["$views", 0] } },
        totalVideos: { $sum: 1 },
      },
    },
  ]);

  // For top videos, get top N by views and include owner info (lookup)
  const topVideosP = Video.find({})
    .sort({ views: -1 })
    .limit(TOP_VIDEOS_LIMIT)
    .select("title views thumbnail owner createdAt")
    .populate("owner", "username fullName avatar")
    .lean();

  // For totalLikes across videos use Like collection (if likes are stored there)
  const totalLikesP = Like.countDocuments({ video: { $exists: true, $ne: null } });

  // Recent users
  const recentUsersP = User.find({})
    .sort({ createdAt: -1 })
    .limit(RECENT_USERS_LIMIT)
    .select("username fullName avatar createdAt")
    .lean();

  const [
    totalUsers,
    totalVideos,
    totalPlaylists,
    totalSubscriptions,
    videosAgg,
    topVideos,
    totalLikes,
    recentUsers,
  ] = await Promise.all([
    totalUsersP,
    totalVideosP,
    totalPlaylistsP,
    totalSubscriptionsP,
    videosAggP,
    topVideosP,
    totalLikesP,
    recentUsersP,
  ]);

  const totalViews = (videosAgg && videosAgg[0] && videosAgg[0].totalViews) || 0;

  const payload = {
    totals: {
      users: totalUsers,
      videos: totalVideos,
      playlists: totalPlaylists,
      subscriptions: totalSubscriptions,
      views: totalViews,
      likes: totalLikes,
    },
    topVideos,
    recentUsers,
  };

  return res.status(200).json(new ApiResponse(200, payload, "Dashboard stats fetched successfully"));
});

/**
 * GET /dashboard/activity
 * Returns a lightweight activity snapshot (counts over last N days)
 * Query: days (optional, default 7)
 */
const getDashboardActivity = asyncHandler(async (req, res) => {
  const days = Math.max(1, Math.min(30, parseInt(req.query.days || "7", 10)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // New users in range
  const newUsersP = User.countDocuments({ createdAt: { $gte: since } });

  // New videos in range and views in range (sum views on videos created in range)
  const newVideosP = Video.countDocuments({ createdAt: { $gte: since } });

  // New playlists in range
  const newPlaylistsP = Playlist.countDocuments({ createdAt: { $gte: since } });

  // New subscriptions in range
  const newSubscriptionsP = Subscription.countDocuments({ createdAt: { $gte: since } });

  // Likes on videos in range
  const newLikesP = Like.countDocuments({ createdAt: { $gte: since }, video: { $exists: true, $ne: null } });

  const [newUsers, newVideos, newPlaylists, newSubscriptions, newLikes] = await Promise.all([
    newUsersP,
    newVideosP,
    newPlaylistsP,
    newSubscriptionsP,
    newLikesP,
  ]);

  const activity = {
    days,
    since,
    newUsers,
    newVideos,
    newPlaylists,
    newSubscriptions,
    newLikes,
  };

  return res.status(200).json(new ApiResponse(200, activity, `Activity for last ${days} days`));
});

export {
  getDashboardStats,
  getDashboardActivity,
};
