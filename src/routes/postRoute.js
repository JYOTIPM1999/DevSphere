import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.route("/").get(protect, getPosts).post(protect, createPost);
router
  .route("/:id")
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

export default router;
