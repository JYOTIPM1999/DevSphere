import express from "express";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import { getAnalytics } from "../controllers/adminController.js";

const router = express.Router();

router.get("/analytics", protect, adminOnly, getAnalytics);

export default router;
