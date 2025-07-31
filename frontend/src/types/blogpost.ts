export const BLOGPOSTS_PER_PAGE = 6;
export const MAX_BLOGPOST_PAGES = 5;
export const BLOGPOSTS_IMAGE_PATH = "/images/blogposts";

export interface Tag {
  id: number;
  name: string;
}

export interface BlogPost {
  id: number;
  title: string;
  url: string;
  content: string;
  image_path: string;
  publication_date: string;
  tags: Tag[];
}

export interface BlogPosts {
  data: BlogPost[];
  count: number;
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
