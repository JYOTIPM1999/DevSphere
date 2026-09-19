import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { toggleFollow } from "../controllers/interactionController.js";

const router = express.Router();

router.route("/:id/follow").post(protect, toggleFollow);
export default router;
