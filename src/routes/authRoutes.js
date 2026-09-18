import express from "express";
import {
  registerUser,
  loginUser,
  refresh,
  logoutUser,
} from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", authenticateToken, refresh);
router.post("/logout", logoutUser);

export default router;
