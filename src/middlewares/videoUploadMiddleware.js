import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = "upload/videos";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.random(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4" || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only mp4 and webm formats are allowed"), false);
    }
  },
});
