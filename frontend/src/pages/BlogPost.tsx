import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { blogpostService } from "../services/blogposts.service";
import BlogPost from "../components/BlogPost/BlogPost";
import type { BlogPost as BlogPostType } from "../types/blogposts";

function BlogPostPage() {
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
      <div className="flex-grow flex flex-col container mx-auto px-4 py-8 justify-center items-center">
        <div className="text-lg text-gray-600">Loading blog post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col container mx-auto px-4 py-8 justify-center items-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="flex-grow flex flex-col container mx-auto px-4 py-8 justify-center items-center">
        <div className="text-lg text-gray-600">Blog post not found</div>
      </div>
    );
  }

  return <BlogPost blogPost={blogPost} />;
}

export default BlogPostPage;
