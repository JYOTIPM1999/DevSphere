import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { toggleFollow } from "../controllers/interactionController.js";
import { uploadAvatar } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddlware.js";

const router = express.Router();

router.route("/:id/follow").post(protect, toggleFollow);
// upload.single('avatar') tells Multer to look for a file attached to the field named "avatar"
router.route("/avatar").post(protect, upload.single("avatar"), uploadAvatar);

export default router;
