import type { Tag } from "./tag";

export const BLOGPOSTS_PER_PAGE = 6;
export const MAX_BLOGPOST_PAGES = 5;
export const FEATURED_BLOGPOSTS = 3;
export const RECENT_BLOGPOSTS = 3;
export const BLOGPOSTS_IMAGE_PATH = "/uploads/images/blogposts";
export const COMMENTS_PER_LOAD = 50;

export interface BlogPost {
  id: number;
  title: string;
  url: string;
  content: string;
  image_path: string;
  publication_date: string;
  featured: boolean;
  tags: Tag[];
}

export interface BlogPosts {
  data: BlogPost[];
  count: number;
}

export interface CreateBlogPostRequest {
  title: string;
  url: string;
  content: string;
  image_path: string;
  featured: boolean;
  tags: number[];
}

export interface UpdateBlogPostRequest extends CreateBlogPostRequest {
  publication_date: string;
}

export interface UpdateFeaturedRequest {
  featured: boolean;
}

export interface Comment {
  id: number;
  content: string;
  comment_date: string;
  blog_post_id: number;
  reply_to: number | null;
  username: string;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

export interface Comments {
  data: CommentWithReplies[];
  count: number;
}

export interface CreateCommentRequest {
  content: string;
  reply_to?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}
