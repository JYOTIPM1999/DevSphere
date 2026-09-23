import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAnalytics = catchAsync(async (req, res) => {
  const [dailySignups, postsPerDay, mostLikedPosts, mostActiveUsers] =
    await Promise.all([
      // 1. Daily Signups: Group users by the day they were created
      User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d-", date: "$createdAt" } },
            signups: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // sort by date ascending
      ]),

      // 2. Posts per Day: Group posts by the day they were created
      Post.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            posts: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // sort by date ascending
      ]),

      // 3. Most Liked Posts: Join the Like collection, count them, and sort
      Post.aggregate([
        // Join the likes collection where Like.post === Post._id

        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "post",
            as: "likes",
          },
        },
        // Add a new field calculating the size of the joined array
        { $addFields: { likeCount: { $size: "$likes" } } },

        // Sort by the new likeCount descending
        { $sort: { likCount: -1 } },
        { $limit: 5 },
        // Remove the raw likes array from the result to save bandwidth
        { $project: { likes: 0 } },
        // Join user details to show who authored the post
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDetails",
          },
        },
        { $unwind: "$authorDetails" },
      ]),
      // 4. Most Active Users: Group posts by author, count, and sort

      Post.aggregate([
        { $group: { _id: "$author", postCount: { $sum: 1 } } },
        { $sort: { postCount: -1 } },
        { $limit: 5 },
        // Join the user collection to get their name and avatar
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $project: { "user.passwordHash": 0 } }, // Exclude sensitive data
      ]),
    ]);
  res.status(200).json({
    success: true,
    data: { dailySignups, postsPerDay, mostLikedPosts, mostActiveUsers },
  });
});
