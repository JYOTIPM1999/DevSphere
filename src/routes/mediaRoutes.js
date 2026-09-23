import express from "express";
import { streamMedia, uploadMedia } from "../controllers/mediaController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadVideo } from "../middlewares/videoUploadMiddleware.js";

const router = express.Router();

router.post("/", protect, uploadVideo.single("video"), uploadMedia);
// Notice this route is intentionally NOT protected right now so a standard HTML <video> tag can easily request it without passing a JWT.
router.get("/:id/stream", streamMedia);

export default router;
