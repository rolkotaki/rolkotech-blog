import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blogpostService } from "../services/blogpost.service";
import { tagService } from "../services/tag.service";
import { formatDate } from "../utils/format";
import BlogPostBox from "../components/BlogPost/BlogPostBox";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import PageLoadingError from "../components/Common/PageLoadingError";
import type { BlogPost, Tag } from "../types";

function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPostsCount, setRecentPostsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [tagsResponse, featuredResponse] = await Promise.all([
          tagService.getTags(),
          blogpostService.getFeaturedBlogPosts(),
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

  const allTags: Tag[] = [{ id: 0, name: "All" }, ...tags];

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
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-blue-700 mb-3">RolkoTech</h1>
        <p className="text-md text-gray-600">
          Real life solutions for real life problems.
        </p>
      </div>

      {/* Tags */}
      {isLoading ? (
        <LoadingSpinner text="Loading tags..." />
      ) : (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {allTags
            .sort((a, b) =>
              a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            )
            .map((tag) => (
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
        </div>
      )}

      {/* Recent Posts */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Recent Posts
      </h2>
      {isLoading ? (
        <LoadingSpinner text="Loading recent posts..." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            More posts
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            More posts
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
