import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { catchAsync } from "../utils/catchAsync.js";
import crypto from "crypto";
import { emailQueue } from "../queue/queues.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "30m",
    },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, role, bio } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash: passwordHash,
      avatar,
      role,
      bio,
    });
    const verifyToken = user.getVerificationToken();
    await user.save(); // Save the newly generated token and expiry to DB

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;
    const message = `<p>Welcome to DevSphere! Click to verify your email:</p><a href="${verifyUrl}">Verify Account</a>`;

    // sendEmail({
    //   to: user.email,
    //   subject: "Verify your DevSphere Account",
    //   html: message,
    // }).catch((error) => console.error("Email failed to send:", error));

    await emailQueue.add(
      "verify-email",
      {
        to: user.email,
        subject: "Verify your DevSphere Account",
        html: message,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // Retries at 2s, 4s, 8s
      },
    );

    // Update the forgotPassword function identically:
    await emailQueue.add(
      "reset-password",
      {
        to: user.email,
        subject: "Password Reset",
        html: message,
      },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error registering user", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  console.log("login");

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    console.log(accessToken, refreshToken);

    // Send refresh token in an HTTP only cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const cookie = req.cookies;

    if (!cookie.jwt) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - No Refresh Token" });
    }
    const refreshToken = cookie.jwt;
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            success: false,
            error: "Forbidden - Invalid Refresh Token",
          });
        }
        const user = await User.findById(decoded.id);
        if (!user) {
          return res
            .status(401)
            .json({ success: false, error: "Unauthorized" });
        }
        const accessToken = generateAccessToken(user._id);
        res.status(200).json({ success: true, data: { accessToken } });
      },
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie?.jwt) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized - No Refresh Token" });
    }
    res.clearCookie("jwt", {
      httpsOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV,
    });
    res.status(200).json({ success: true, data: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyEmail = catchAsync(async (req, res) => {
  // Re-hash the raw token from the URL to compare with DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: { $gt: Date.now() }, // Ensure it hasn't expired
  });
  if (!user) throw new Error("Invalid or expired verification token");

  // Clear tokens
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save();
  res.status(200).json({ success: true, data: "Email verified successfully" });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // Return 200 even if user doesn't exist to prevent email enumeration (security best practice)
    return res.status(200).json({
      success: true,
      data: "If an account exists, a reset email was sent.",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `<p>You requested a password reset. Click here:</p><a href="${resetUrl}">Reset Password</a>`;
  sendEmail({
    to: user.email,
    subject: "Password Reset",
    html: message,
  }).catch((error) => console.error(error));
  res.status(200).json({
    success: true,
    data: "If an account exists, a reset email was sent.",
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) throw new Error("Invalid or expired reset token");

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(req.body.password, salt);

  // Clear tokens
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.status(200).json({ success: true, data: "Password reset successful" });
});

export const googleCallback = catchAsync(async (req, res) => {
  // req.user is provided by Passport after successful authentication
  const user = req.user;
  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set the HTTP-Only refresh cookie (same as standard login)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie("jwt", refreshToken, cookieOptions);

  // Redirect to frontend, passing the access token in the URL so the React app can grab it
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-success?token=${accessToken}`,
  );
});
