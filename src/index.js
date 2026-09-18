import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import apiRoutes from "./routes/authRoutes.js";
import { connectDB } from "./config/db.js";

connectDB();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

console.log("PORT:", PORT);
console.log("MONGO_URI:", MONGO_URI);

app.use("/api/auth", apiRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
