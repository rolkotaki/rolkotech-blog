import api from "./api";
import { BLOGPOSTS_PER_PAGE } from "../types/blogposts";
import type { BlogPosts, BlogPost } from "../types";

export const blogpostService = {
  getBlogPosts: async (
    page: number,
    searchBy?: string,
    searchValue?: string
  ): Promise<BlogPosts> => {
    const limit: number = BLOGPOSTS_PER_PAGE;
    const skip: number = (page - 1) * limit;

    let url = `/blogposts?limit=${limit}&skip=${skip}`;
    if (searchBy && searchValue) {
      url += `&search_by=${encodeURIComponent(searchBy)}`;
      url += `&search_value=${encodeURIComponent(searchValue)}`;
    }

    const response = await api.get<BlogPosts>(url);
    return response.data;
  },

  getBlogPostByUrl: async (url: string): Promise<BlogPost> => {
    const response = await api.get<BlogPost>(`/blogposts/${url}`);
    return response.data;
  },
};
