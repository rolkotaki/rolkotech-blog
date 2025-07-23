import api from "./api";
import { BLOGPOSTS_PER_PAGE } from "../types/blogposts";
import type { BlogPosts, BlogPost } from "../types";

export const blogpostService = {
  getBlogPosts: async (page: number): Promise<BlogPosts> => {
    const limit: number = BLOGPOSTS_PER_PAGE;
    const skip: number = (page - 1) * limit;
    const response = await api.get<BlogPosts>(
      `/blogposts?limit=${limit}&skip=${skip}`
    );
    return response.data;
  },

  getBlogPostByUrl: async (url: string): Promise<BlogPost> => {
    const response = await api.get<BlogPost>(`/blogposts/${url}`);
    return response.data;
  },
};
