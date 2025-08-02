import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { blogpostService } from "../services/blogpost.service";
import BlogPost from "../components/BlogPost/BlogPost";
import CommentsSection from "../components/Comment/CommentsSection";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import type { BlogPost as BlogPostType } from "../types/blogpost";

function BlogPostPage() {
  const { user } = useAuth();
  const { url } = useParams<{ url: string }>();
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!url) {
        setError("Blog post URL not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await blogpostService.getBlogPostByUrl(url);
        setBlogPost(response);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response.status === 404) {
          setBlogPost(null);
        } else {
          setError("Failed to load blog post");
          console.error("Error fetching blog post:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [url]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col container mx-auto justify-center items-center">
        <LoadingSpinner text="Loading blog post..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col container mx-auto justify-center items-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="flex-grow flex flex-col container mx-auto justify-center items-center">
        <div className="text-lg text-gray-600">Blog post not found</div>
      </div>
    );
  }

  return (
    <div className="flex-grow">
      <BlogPost blogPost={blogPost} />
      <CommentsSection
        blogPostUrl={blogPost.url}
        currentUsername={user?.name}
      />
    </div>
  );
}

export default BlogPostPage;
