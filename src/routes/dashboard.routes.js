// routes/dashboard.router.js
import { Router } from "express";
import { getDashboardStats, getDashboardActivity } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// These should generally be admin-only; add admin middleware if available.
// For now they require authentication.
router.route("/dashboard/stats").get(verifyJWT, getDashboardStats);
router.route("/dashboard/activity").get(verifyJWT, getDashboardActivity);

export default router;
