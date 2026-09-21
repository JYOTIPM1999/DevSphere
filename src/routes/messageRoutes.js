import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMessages } from "../controllers/messageController.js";
const router = express.Router();

router.route("/:conversationId").get(protect, getMessages);

export default router;
