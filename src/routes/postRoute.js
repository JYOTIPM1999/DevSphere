import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  addComment,
  getComments,
  toggleLike,
} from "../controllers/interactionController.js";

const router = express.Router();
router.route("/").get(protect, getPosts).post(protect, createPost);
router
  .route("/:id")
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route("/:id/like").post(protect, toggleLike);
router
  .route("/:id/comments")
  .get(protect, getComments)
  .post(protect, addComment);

export default router;
