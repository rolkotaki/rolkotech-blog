import api from "./api";
import { BLOGPOSTS_PER_PAGE } from "../types/blogpost";
import type {
  BlogPosts,
  BlogPost,
  Comments,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "../types";

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

  getCommentsForBlogPost: async (url: string): Promise<Comments> => {
    const response = await api.get<Comments>(`/blogposts/${url}/comments`);
    return response.data;
  },

  createComment: async (
    url: string,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/blogposts/${url}/comments`,
      data
    );
    return response.data;
  },

  updateComment: async (
    url: string,
    commentId: number,
    data: UpdateCommentRequest
  ): Promise<Comment> => {
    const response = await api.patch<Comment>(
      `/blogposts/${url}/comments/${commentId}`,
      data
    );
    return response.data;
  },

  deleteComment: async (url: string, commentId: number): Promise<void> => {
    await api.delete(`/blogposts/${url}/comments/${commentId}`);
  },
};
