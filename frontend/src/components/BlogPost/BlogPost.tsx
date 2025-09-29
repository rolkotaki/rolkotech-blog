import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { BACKEND_URL } from "../../services/api.ts";
import { blogpostService } from "../../services/blogpost.service";
import { formatDate } from "../../utils/format.ts";
import type { BlogPost as BlogPostType } from "../../types/blogpost";
import { BLOGPOSTS_IMAGE_PATH } from "../../types/blogpost";
import MarkdownContentProps from "./MarkdownContent";

interface BlogPostProps {
  blogPost: BlogPostType;
}

function BlogPost({ blogPost }: BlogPostProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this blog post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await blogpostService.deleteBlogPost(blogPost.id);
      navigate("/articles");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete blog post:", err);
      alert("Failed to delete blog post.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pt-6 flex-grow">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        {blogPost.title}
      </h1>

      <div className="flex justify-between items-start mb-4">
        {/* Left column: date and tags */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">
            {formatDate(blogPost.publication_date)}
          </p>

          {blogPost.tags && blogPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2" data-testid="blogpost-tags">
              {blogPost.tags
                .sort((a, b) =>
                  a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                )
                .map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded"
                  >
                    {tag.name}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Right column: Delete and Edit buttons for superusers */}
        {user?.is_superuser && (
          <div className="flex flex-col">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors"
              title="Delete blog post"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => navigate(`/articles/${blogPost.url}/edit`)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors"
              title="Edit blog post"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 4l4 4-8 8H8v-4l8-8z"
                />
              </svg>
              Edit
            </button>
          </div>
        )}
      </div>

      <img
        src={`${BACKEND_URL}${BLOGPOSTS_IMAGE_PATH}/${blogPost.image_path}`}
        alt={blogPost.title}
        className="w-full h-auto rounded-lg shadow-md mb-6"
      />

      <article className="prose prose-blue max-w-none mt-8">
        <MarkdownContentProps content={blogPost.content} />
      </article>
    </div>
  );
}

export default BlogPost;
