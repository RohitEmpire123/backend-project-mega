// routes/subscription.router.js
import { Router } from "express";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// toggle subscription (protected)
router.route("/channels/:channelId/toggle-subscribe").post(verifyJWT, toggleSubscription);

// channel subscribers list (public/paged)
router.route("/channels/:channelId/subscribers").get(getUserChannelSubscribers);

// channels a user subscribed to (if subscriberId omitted, uses current user)
router.route("/users/:subscriberId/subscriptions").get(getSubscribedChannels);
router.route("/subscriptions").get(verifyJWT, getSubscribedChannels); // current user

export default router;
