import express from "express";
import { createPost, getPosts } from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.route("/").get(protect, getPosts).post(protect, createPost);

export default router;
