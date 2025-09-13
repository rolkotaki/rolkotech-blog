import api from "./api";
import {
  BLOGPOSTS_PER_PAGE,
  COMMENTS_PER_LOAD,
  FEATURED_BLOGPOSTS,
  RECENT_BLOGPOSTS,
} from "../types/blogpost";
import type {
  BlogPosts,
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  UpdateFeaturedRequest,
  Comments,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "../types";

export const blogpostService = {
  getBlogPosts: async (
    page: number,
    searchBy?: string,
    searchValue?: string,
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

  getRecentBlogPosts: async (tag?: string): Promise<BlogPosts> => {
    let url = `/blogposts?limit=${RECENT_BLOGPOSTS}&skip=0`;
    if (tag) url += `&search_by=tag&search_value=${encodeURIComponent(tag)}`;

    const response = await api.get<BlogPosts>(url);
    return response.data;
  },

  getFeaturedBlogPosts: async (): Promise<BlogPosts> => {
    const url = `/blogposts?limit=${FEATURED_BLOGPOSTS}&skip=0&featured_only=true`;
    const response = await api.get<BlogPosts>(url);
    return response.data;
  },

  getBlogPostByUrl: async (url: string): Promise<BlogPost> => {
    const response = await api.get<BlogPost>(`/blogposts/${url}`);
    return response.data;
  },

  createBlogPost: async (data: CreateBlogPostRequest): Promise<BlogPost> => {
    const response = await api.post<BlogPost>("/blogposts", data);
    return response.data;
  },

  updateBlogPost: async (
    id: number,
    data: UpdateBlogPostRequest,
  ): Promise<BlogPost> => {
    const response = await api.patch<BlogPost>(`/blogposts/${id}`, data);
    return response.data;
  },

  updateBlogPostFeatured: async (
    id: number,
    data: UpdateFeaturedRequest,
  ): Promise<BlogPost> => {
    const response = await api.patch<BlogPost>(`/blogposts/${id}`, data);
    return response.data;
  },

  deleteBlogPost: async (id: number): Promise<void> => {
    await api.delete(`/blogposts/${id}`);
  },

  getCommentsForBlogPost: async (
    url: string,
    page: number,
  ): Promise<Comments> => {
    const limit: number = COMMENTS_PER_LOAD;
    const skip: number = (page - 1) * limit;
    const response = await api.get<Comments>(
      `/blogposts/${url}/comments?limit=${limit}&skip=${skip}`,
    );
    return response.data;
  },

  createComment: async (
    url: string,
    data: CreateCommentRequest,
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/blogposts/${url}/comments`,
      data,
    );
    return response.data;
  },

  updateComment: async (
    url: string,
    commentId: number,
    data: UpdateCommentRequest,
  ): Promise<Comment> => {
    const response = await api.patch<Comment>(
      `/blogposts/${url}/comments/${commentId}`,
      data,
    );
    return response.data;
  },

  deleteComment: async (url: string, commentId: number): Promise<void> => {
    await api.delete(`/blogposts/${url}/comments/${commentId}`);
  },
};
