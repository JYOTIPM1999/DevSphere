import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
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
