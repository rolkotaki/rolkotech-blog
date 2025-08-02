import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { blogpostService } from "../services/blogpost.service.ts";
import BlogPostBox from "../components/BlogPost/BlogPostBox";
import BlogPostSearch from "../components/BlogPost/BlogPostSearch.tsx";
import Pagination from "../components/BlogPost/Pagination";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { BLOGPOSTS_PER_PAGE } from "../types/blogpost.ts";
import type { BlogPost } from "../types/blogpost.ts";

function BlogPosts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const searchBy = searchParams.get("search_by") || "";
  const searchValue = searchParams.get("search_value") || "";

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await blogpostService.getBlogPosts(
          currentPage,
          searchBy || undefined,
          searchValue || undefined
        );
        setBlogPosts(response.data);
        setTotalCount(response.count);
      } catch (err) {
        setError("Failed to load blog posts");
        console.error("Error fetching blog posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [currentPage, searchBy, searchValue]);

  const handlePageChange = (page: number) => {
    const newParams: Record<string, string> = { page: page.toString() };
    if (searchBy) newParams.search_by = searchBy;
    if (searchValue) newParams.search_value = searchValue;
    setSearchParams(newParams);
  };

  const handleSearch = (newSearchBy: string, newSearchValue: string) => {
    const newParams: Record<string, string> = {};
    if (newSearchBy && newSearchValue) {
      newParams.search_by = newSearchBy;
      newParams.search_value = newSearchValue;
    }
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col container mx-auto justify-center items-center">
        <LoadingSpinner text="Loading blog posts..." />
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

  return (
    <div className="flex-grow flex flex-col container mx-auto px-4 py-8">
      <BlogPostSearch
        onSearch={handleSearch}
        isLoading={loading}
        currentSearchBy={searchBy}
        currentSearchValue={searchValue}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {blogPosts.map((post) => (
          <BlogPostBox
            key={post.id}
            url={post.url}
            title={post.title}
            imagePath={post.image_path}
            publicationDate={new Date(post.publication_date).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            )}
            tags={post.tags.map((tag) => tag.name)}
            content={post.content}
          />
        ))}
      </div>
      <div className="mt-auto flex justify-center space-x-2">
        {totalCount > BLOGPOSTS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            blogpostCount={totalCount}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

export default BlogPosts;
