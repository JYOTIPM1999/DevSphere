import User from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image file");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: req.file.path,
    },
    { new: true },
  ).select("-passwordHash"); // dont send passwordHash to the frontend
  res.status(200).json({ success: true, data: user });
});
