import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB. Wiping old data...");
    // Clear existing data
    await User.deleteMany();
    await Post.deleteMany();
    console.log("Generating users...");
    const users = [];
    const passwordHash = await bcrypt.hash("password123", 10);

    for (let i = 0; i < 15; i++) {
      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash,
        isVerified: true,
        avatar: faker.image.avatar(),
      });
    }
    const createdUsers = await User.insertMany(users);
    console.log("Generating posts...");
    const posts = [];
    for (let i = 0; i < 40; i++) {
      const randomUser =
        createdUsers[Math.floor(Math.random() * createdUsers.length)];

      posts.push({
        author: randomUser._id,
        content: faker.lorem.paragraph(),
        // Spread posts out over the last 30 days to make the analytics charts look good
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
    await Post.insertMany(posts);
    console.log("Database seeded successfully! 🌱");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed", error);
    process.exit(1);
  }
};
seedDatabase();
