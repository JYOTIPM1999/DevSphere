import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  bio: {
    type: String,
  },
});
export default mongoose.model("User", userSchema);
