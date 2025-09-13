import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BACKEND_URL } from "../services/api.ts";
import { blogpostService } from "../services/blogpost.service";
import { imageService } from "../services/image.service";
import { tagService } from "../services/tag.service";
import type { BlogPost, Image } from "../types";
import LoadingSpinner from "../components/Common/LoadingSpinner.tsx";
import PageLoadingError from "../components/Common/PageLoadingError.tsx";

function EditBlogPost() {
  const { user } = useAuth();
  const { url } = useParams<{ url: string }>();
  const navigate = useNavigate();

  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [blogPostImage, setBlogPostImage] = useState<Image | null>(null);
  const [blogPostTitle, setBlogPostTitle] = useState<string>("");
  const [blogPostUrlSlug, setBlogPostUrlSlug] = useState<string>("");
  const [blogPostContent, setBlogPostContent] = useState<string>("");
  const [blogPostTags, setBlogPostTags] = useState<string>("");
  const [blogPostFeatured, setBlogPostFeatured] = useState<boolean>(false);
  const [blogPostPublicationDate, setBlogPostPublicationDate] =
    useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [images, setImages] = useState<Image[]>([]);

  // Check if user is authorized
  useEffect(() => {
    if (!user) return; // Still loading authentication (handled later)
    // Redirect to article page if not admin
    if (!user?.is_superuser) {
      navigate(`/articles/${url}`);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Load blog post data and images
  useEffect(() => {
    const fetchData = async () => {
      if (!url) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        // Fetch blog post and images in parallel
        const [blogPostResponse, imagesResponse] = await Promise.all([
          blogpostService.getBlogPostByUrl(url),
          imageService.getImages(),
        ]);

        const post = blogPostResponse;
        setBlogPost(post);
        setImages(imagesResponse.data);

        // Populate form fields
        setBlogPostTitle(post.title);
        setBlogPostUrlSlug(post.url);
        setBlogPostContent(post.content);
        setBlogPostFeatured(post.featured);
        setBlogPostTags(post.tags.map((tag) => tag.name).join(","));
        const publicationDate = new Date(post.publication_date);
        const formattedDate = publicationDate.toISOString().split("T")[0];
        setBlogPostPublicationDate(formattedDate);
        const currentImage = imagesResponse.data.find(
          (img) => img.filename === post.image_path,
        );
        setBlogPostImage(currentImage || null);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error fetching blog post data:", err);
        setError("Failed to load blog post for editing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const handleUpdateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blogPost || !url) return;

    if (
      !blogPostTitle ||
      !blogPostUrlSlug ||
      !blogPostContent ||
      !blogPostTags ||
      !blogPostPublicationDate
    ) {
      alert(
        "Please fill in all required fields (title, URL slug, content, tags, publication date).",
      );
      return;
    }

    if (!blogPostImage) {
      alert("Please select an image for the blog post.");
      return;
    }

    try {
      setIsUpdating(true);

      // Get list of tags from the form
      const tagNames = blogPostTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Get existing tags
      const existingTags = await tagService.getTags();
      const tagIds: number[] = [];

      // Check if tags already exist, if not we create them
      for (const tagName of tagNames) {
        const existingTag = existingTags.data.find(
          (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
        );

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          const newTag = await tagService.createTag({ name: tagName });
          tagIds.push(newTag.id);
        }
      }

      // Update blog post
      const blogPostData = {
        title: blogPostTitle,
        url: blogPostUrlSlug,
        content: blogPostContent,
        image_path: blogPostImage.filename,
        featured: blogPostFeatured,
        tags: tagIds,
        publication_date: blogPostPublicationDate,
      };

      await blogpostService.updateBlogPost(blogPost.id, blogPostData);

      // Navigate back to the blog post
      navigate(`/articles/${blogPostUrlSlug}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update blog post.";
      console.error("Failed to update blog post:", err);
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (blogPost) navigate(`/articles/${blogPost.url}`);
    else navigate("/articles");
  };

  if (!user) {
    return (
      <div className="container m-auto px-4 py-8 flex justify-center">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  if (!user || !user.is_superuser) {
    return (
      <PageLoadingError error="Access denied. Admin privileges required." />
    );
  }

  if (error) {
    return <PageLoadingError error={error} />;
  }

  if (isLoading) {
    return (
      <div className="container m-auto px-4 py-8 flex justify-center">
        <LoadingSpinner text="Loading blog post..." />
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
    <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Link
            to="/articles"
            className="hover:text-blue-600 transition-colors"
          >
            Articles
          </Link>
          <span>›</span>
          <Link
            to={`/articles/${blogPost.url}`}
            className="hover:text-blue-600 transition-colors"
          >
            {blogPost.title}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg py-6 px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Edit Blog Post
        </h1>

        {/* Edit form */}
        <form className="space-y-6" onSubmit={handleUpdateBlogPost}>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={blogPostTitle}
              onChange={(e) => setBlogPostTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              placeholder="Blog post title..."
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              URL Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={blogPostUrlSlug}
              onChange={(e) => setBlogPostUrlSlug(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              placeholder="Blog post URL slug..."
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              value={blogPostContent}
              onChange={(e) => setBlogPostContent(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 shadow-sm hover:shadow-md resize-y"
              placeholder="Blog post content..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={blogPostTags}
                onChange={(e) => setBlogPostTags(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="tag1,tag2,tag3..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate tags with commas. New tags will be created
                automatically.
              </p>
            </div>

            <div>
              <label
                htmlFor="image_select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Blog Post Image
              </label>
              <input
                type="text"
                id="image_select"
                name="image"
                list="image-suggestions"
                value={blogPostImage?.filename || ""}
                onChange={(e) => {
                  const image =
                    images?.find((img) => img.filename === e.target.value) ||
                    null;
                  setBlogPostImage(image);
                }}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="Paste or select an image filename..."
              />
              <datalist id="image-suggestions">
                {images &&
                  images.map((image) => (
                    <option key={image.filename} value={image.filename} />
                  ))}
              </datalist>
              {images.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No images available. Upload images in the Admin panel first.
                </p>
              )}
              {blogPostImage && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img
                    src={`${BACKEND_URL}${blogPostImage.url}`}
                    alt="Selected image preview"
                    className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="publication_date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Publication Date
            </label>
            <input
              type="date"
              id="publication_date"
              name="publication_date"
              value={blogPostPublicationDate}
              onChange={(e) => setBlogPostPublicationDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={blogPostFeatured}
              onChange={(e) => setBlogPostFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <label
              htmlFor="featured"
              className="ml-2 block text-sm text-gray-900"
            >
              Mark as featured
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isUpdating}
              className={`font-medium py-3 px-8 rounded-lg transition-colors duration-200 ${
                isUpdating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="font-medium py-3 px-8 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBlogPost;
