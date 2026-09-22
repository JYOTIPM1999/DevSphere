import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
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
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);
userSchema.methods.getVerificationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  // Hash it and set it on the user document
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token; // We return the RAW token to send in the email
};
userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

export default mongoose.model("User", userSchema);
