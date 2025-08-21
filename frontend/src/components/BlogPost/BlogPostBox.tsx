import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { blogpostService } from "../../services/blogpost.service";
import MarkdownContentProps from "./MarkdownContent";
import { BLOGPOSTS_IMAGE_PATH } from "../../types/blogpost";

interface BlogPostBoxProps {
  id: number;
  url: string;
  title: string;
  imagePath: string;
  publicationDate: string;
  tags: string[];
  content: string;
  featured: boolean;
}

function BlogPostBox({
  id,
  url,
  title,
  imagePath,
  publicationDate,
  tags,
  content,
  featured,
}: BlogPostBoxProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFeatured, setIsFeatured] = useState<boolean>(featured);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if user clicks on an <a> or <button> tag inside the blog post box
    const target = e.target as HTMLElement;
    if (
      target.tagName === "A" ||
      target.tagName === "BUTTON" ||
      target.closest("button")
    ) {
      return;
    }
    navigate(`/articles/${url}`);
  };

  const handleFeaturedToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await blogpostService.updateBlogPostFeatured(id, {
        featured: !isFeatured,
      });
      setIsFeatured(!isFeatured);
    } catch (error) {
      console.error("Failed to update featured status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow transition transform hover:scale-[1.02] hover:shadow-xl cursor-pointer duration-200 overflow-hidden"
      onClick={handleClick}
    >
      {/* Featured Toggle Button */}
      {user?.is_superuser && (
        <button
          onClick={handleFeaturedToggle}
          disabled={isUpdating}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFeatured
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-200 text-gray-500 hover:bg-gray-300"
          } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isFeatured ? "Remove from featured" : "Mark as featured"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      )}

      <img
        src={`${BLOGPOSTS_IMAGE_PATH}/${imagePath}`}
        alt={title}
        className="w-full h-40 object-cover"
      />
      <div className="p-5">
        <p className="text-sm text-gray-400 mb-1">{publicationDate}</p>
        <h3 className="text-xl font-semibold text-blue-700 mb-2">{title}</h3>
        <div
          className="prose prose-blue max-w-none mt-4 mb-2 line-clamp-3"
          style={{ fontSize: "1rem", lineHeight: "1.5em" }}
        >
          <MarkdownContentProps
            content={
              (content + "\n\n")
                .split("\n\n")
                .filter((s) => s.trim().length > 0)[0]
            }
          />
        </div>
        {tags
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .map((tag, idx) => (
            <Fragment key={tag}>
              <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">
                {tag}
              </span>
              {idx < tags.length - 1 && <span>&nbsp;</span>}
            </Fragment>
          ))}
      </div>
    </div>
  );
}

export default BlogPostBox;
