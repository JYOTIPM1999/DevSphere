import express from "express";
import {
  registerUser,
  loginUser,
  refresh,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleCallback,
} from "../controllers/authController.js";
import passport from "passport";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refresh);
router.post("/logout", logoutUser);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
// Trigger the Google login screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // We use JWTs, not Express sessions
  }),
);
// Google redirects here after the user clicks "Allow"
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback,
);

export default router;
