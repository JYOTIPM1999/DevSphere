import { catchAsync } from "../utils/catchAsync.js";
import Media from "../models/mediaModel.js";
import fs from "fs";

export const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new Error("Please upload a video file (mp4/webm)");
  }
  const media = await Media.create({
    uploader: req.user._id,
    filename: req.file.filename,
    filepath: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json({ success: true, data: media });
});

export const streamMedia = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) {
    return res.status(404).json({ success: false, error: "Media not found" });
  }
  const videoPath = media.filepath;
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ success: false, error: "File missing" });
  }
  const videoSize = fs.statSync(videoPath).size;
  const range = req.headers.range;
  console.log("Range Header:", req.headers.range);

  // If the browser doesn't request a specific range, send the whole file (status 200)
  if (!range) {
    res.writeHead(200, {
      "Content-length": videoSize,
      "Content-Type": media.mimetype,
      "Accept-Ranges": "bytes",
    });
    return fs.createReadStream(videoPath).pipe(res);
  }
  // 1. Parse the Range header (e.g., "bytes=32324-")

  const CHUNK_SIZE = 10 ** 6; //10MB chunks
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // 2. Compute the content length for this specific chunk
  const contentLength = end - start + 1;
  // 3. Set the 206 Partial Content headers
  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Range": "bytes",
    "Content-Length": contentLength,
    "Content-Type": media.mimetype,
  });
  // 4. Create a read stream for just this byte slice and pipe it to the response
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});
