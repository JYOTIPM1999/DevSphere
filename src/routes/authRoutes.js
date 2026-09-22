import express from "express";
import {
  registerUser,
  loginUser,
  refresh,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refresh);
router.post("/logout", logoutUser);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
