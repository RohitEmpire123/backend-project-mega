// routes/tweet.router.js
import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// public read
router.route("/users/:identifier/tweets").get(getUserTweets); // identifier = userId or username
router.route("/tweets/:tweetId").get(getUserTweets); // optional: if you implement single-tweet fetch in getUserTweets

// protected write
router.route("/tweets").post(verifyJWT, createTweet);
router.route("/tweets/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router;
