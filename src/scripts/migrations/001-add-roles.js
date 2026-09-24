import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../../models/userModel.js";

dotenv.config();
const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Running Migration 001: Add default role to users...");

    // Update all users who do NOT have a role field, setting it to 'user'
    const result = await User.updateMany(
      {
        role: { $exists: false },
      },
      { $set: { role: "user" } },
    );
    console.log(
      `Migration complete. Modified ${result.modifiedCount} documents.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};
migrate();
