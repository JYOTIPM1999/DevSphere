import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToPush,
  testPush,
} from "../controllers/notificationController.js";

const router = express.Router();
router.route("/").get(protect, getNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.post("/subscribe", protect, subscribeToPush);
router.post("/test", protect, testPush);

export default router;
