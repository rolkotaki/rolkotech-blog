import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blogpostService } from "../services/blogpost.service";
import { tagService } from "../services/tag.service";
import { formatDate } from "../utils/format";
import BlogPostBox from "../components/BlogPost/BlogPostBox";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import PageLoadingError from "../components/Common/PageLoadingError";
import type { BlogPost, Tag } from "../types";

const VISIBLE_TAGS_LIMIT: number = 11; // All + first 10

function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPostsCount, setRecentPostsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showAllTags, setShowAllTags] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [tagsResponse, featuredResponse] = await Promise.all([
          tagService.getTags(),
          blogpostService.getFeaturedBlogPosts()
        ]);
        setTags(tagsResponse.data);
        setFeaturedPosts(featuredResponse.data);

        // initial recent posts for "All" tag
        const recentResponse = await blogpostService.getRecentBlogPosts();
        setRecentPosts(recentResponse.data);
        setRecentPostsCount(recentResponse.count);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError("Failed to load Home page");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchRecentPostsData = async (tagName: string) => {
      try {
        const recentResponse = await blogpostService.getRecentBlogPosts(
          tagName === "All" ? undefined : tagName
        );
        setRecentPosts(recentResponse.data);
        setRecentPostsCount(recentResponse.count);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error fetching data:", err);
      }
    };

    fetchRecentPostsData(selectedTag);
  }, [selectedTag]);

  const handleTagClick = (tagName: string) => {
    setSelectedTag(tagName);
  };

  const handleMorePostsByTag = () => {
    if (selectedTag === "All") {
      navigate("/articles");
    } else {
      navigate(
        `/articles?search_by=tag&search_value=${encodeURIComponent(
          selectedTag
        )}`
      );
    }
  };

  const handleMorePosts = () => {
    navigate("/articles");
  };

  if (error) {
    return <PageLoadingError error={error} />;
  }

  return (
    <div className="container mx-auto px-4 pt-4 pb-12 flex-grow">
      {/* Tags */}
      {isLoading ? (
        <LoadingSpinner text="Loading tags..." />
      ) : (
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
          data-testid="tags-list"
        >
          {(() => {
            const allTags = [
              { id: 0, name: "All" },
              ...tags.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
              )
            ];

            let visibleTags = showAllTags
              ? allTags
              : allTags.slice(0, VISIBLE_TAGS_LIMIT);

            // If selectedTag isn't visible (and not 'All'), include it so user sees active state
            if (
              !showAllTags &&
              selectedTag !== "All" &&
              !visibleTags.some((t) => t.name === selectedTag)
            ) {
              const selectedTagOjbect = allTags.find(
                (t) => t.name === selectedTag
              );
              if (selectedTagOjbect)
                visibleTags = [...visibleTags, selectedTagOjbect];
            }

            return (
              <>
                {visibleTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.name)}
                    className={`px-3 py-1 rounded uppercase text-xs font-medium transition-colors ${
                      selectedTag === tag.name
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}

                {allTags.length > VISIBLE_TAGS_LIMIT && (
                  <button
                    onClick={() => setShowAllTags((s) => !s)}
                    className="px-3 py-1 rounded uppercase text-xs font-medium ml-1 text-blue-600 hover:text-blue-800"
                    aria-expanded={showAllTags}
                    aria-label={
                      showAllTags ? "Show fewer tags" : "Show all tags"
                    }
                  >
                    {showAllTags
                      ? "Show less"
                      : `+${allTags.length - VISIBLE_TAGS_LIMIT} more`}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Recent Posts */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Recent Posts
      </h2>
      {isLoading ? (
        <LoadingSpinner text="Loading recent posts..." />
      ) : (
        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          data-testid="recent-posts"
        >
          {recentPosts.map((post) => (
            <BlogPostBox
              key={post.id}
              id={post.id}
              url={post.url}
              title={post.title}
              imagePath={post.image_path}
              publicationDate={formatDate(post.publication_date)}
              tags={post.tags.map((tag) => tag.name)}
              content={post.content}
              featured={post.featured}
            />
          ))}
        </div>
      )}

      {/* More posts button */}
      {recentPostsCount > 3 && !isLoading && (
        <div className="text-center mb-8">
          <button
            onClick={handleMorePostsByTag}
            className="text-blue-600 hover:text-blue-800 font-medium text-lg transition-colors hover:underline"
          >
            View more posts →
          </button>
        </div>
      )}

      {/* Featured Posts */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Featured Posts
      </h2>
      {isLoading ? (
        <LoadingSpinner text="Loading featured posts..." />
      ) : (
        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          data-testid="featured-posts"
        >
          {featuredPosts.map((post) => (
            <BlogPostBox
              key={post.id}
              id={post.id}
              url={post.url}
              title={post.title}
              imagePath={post.image_path}
              publicationDate={formatDate(post.publication_date)}
              tags={post.tags.map((tag) => tag.name)}
              content={post.content}
              featured={post.featured}
            />
          ))}
        </div>
      )}

      {/* More posts button */}
      {!isLoading && (
        <div className="text-center">
          <button
            onClick={handleMorePosts}
            className="text-blue-600 hover:text-blue-800 font-medium text-lg transition-colors hover:underline"
          >
            View all posts →
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
