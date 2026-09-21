import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createConversation,
  getConversations,
} from "../controllers/conversationController.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createConversation)
  .get(protect, getConversations);
export default router;
