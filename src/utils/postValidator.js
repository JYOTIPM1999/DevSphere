import { z } from "zod";
export const postSchema = z.object({
  content: z
    .string()
    .min(1, "Post Content can't be empty")
    .max(1000, "Post Content can't exceed 1000 characters"),
  imageUrl: z.string().url("Invalid image url").optional().or(z.literal("")),
});
