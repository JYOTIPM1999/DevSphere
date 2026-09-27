import Post from "../models/postModel.js";
import User from "../models/userModel.js";

export const resolvers = {
  Query: {
    // Fetch single post
    post: async (_, { id }) => await Post.findById(id),
    // Fetch the feed
    posts: async () => await Post.find().sort({ createdAt: -1 }).limit(10),
  },
  // This is where GraphQL solves Underfetching!
  Post: {
    // When a user asks for a Post's "author", GraphQL intercepts it and runs this function
    author: async (parent) => {
      // parent is the Post document returned by the Query
      return await User.findById(parent.author);
    },
    // We can compute fields on the fly
    commentCount: (parent) => {
      // Assuming you have a comments array on your post schema, otherwise return a random/mock number for now
      return parent.comments ? parent.comments.length : 15;
    },
  },
};
