import { useState, useEffect, useCallback, useRef } from "react";
import { BACKEND_URL, API_DOCS_URL } from "../services/api.ts";
import { blogpostService } from "../services/blogpost.service";
import { imageService } from "../services/image.service";
import { tagService } from "../services/tag.service";
import { userService } from "../services/user.service";
import { formatDate } from "../utils/format.ts";
import { USERS_PER_LOAD } from "../types";
import type { User, Image } from "../types";
import LoadingSpinner from "../components/Common/LoadingSpinner.tsx";

// Image buttons click animation
const animateButtonClick = (element: HTMLButtonElement) => {
  // Shrink the button slightly
  element.style.transform = "scale(0.95)";
  element.style.transition = "all 150ms ease";
  // Make buttons darker on click
  if (element.classList.contains("bg-blue-100"))
    element.style.backgroundColor = "#93c5fd";
  else if (element.classList.contains("bg-red-100"))
    element.style.backgroundColor = "#fca5a5";

  // Reset after 150ms
  setTimeout(() => {
    element.style.transform = "scale(1)";
    element.style.backgroundColor = "";
  }, 150);
};

function Admin() {
  const tabs = [
    { id: "blog-posts", label: "Blog Posts", icon: "📝" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "api-docs", label: "API Docs", icon: "📚" },
  ];

  const [activeTab, setActiveTab] = useState<string>("blog-posts");
  const [loading, setLoading] = useState<boolean>(false);

  // Blog post states
  const [blogPostImage, setBlogPostImage] = useState<Image | null>(null);
  const [blogPostTitle, setBlogPostTitle] = useState<string>("");
  const [blogPostUrlSlug, setBlogPostUrlSlug] = useState<string>("");
  const [blogPostContent, setBlogPostContent] = useState<string>("");
  const [blogPostTags, setBlogPostTags] = useState<string>("");
  const [blogPostFeatured, setBlogPostFeatured] = useState<boolean>(false);
  const [creatingBlogPost, setCreatingBlogPost] = useState<boolean>(false);

  // Image states
  const [images, setImages] = useState<Image[]>([]);
  const [loadingImages, setLoadingImages] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // User states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState<boolean>(false);
  const [currentUserPage, setCurrentUserPage] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [hasMoreUsers, setHasMoreUsers] = useState<boolean>(true);

  // User filter states
  const [userNameFilter, setUserNameFilter] = useState<string>("");
  const [userEmailFilter, setUserEmailFilter] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  // Debouncing for user filters
  const [debouncedUserNameFilter, setDebouncedUserNameFilter] =
    useState<string>("");
  const [debouncedUserEmailFilter, setDebouncedUserEmailFilter] =
    useState<string>("");

  // BLOG POSTS

  // Create blog post and its tags if necessary
  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !blogPostTitle ||
      !blogPostUrlSlug ||
      !blogPostContent ||
      !blogPostTags
    ) {
      alert(
        "Please fill in all required fields (title, URL slug, content, tags).",
      );
      return;
    }

    if (!blogPostImage) {
      alert("Please select an image for the blog post.");
      return;
    }

    try {
      setCreatingBlogPost(true);

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

      // Create blog post
      const blogPostData = {
        title: blogPostTitle,
        url: blogPostUrlSlug,
        content: blogPostContent,
        image_path: blogPostImage.filename,
        featured: blogPostFeatured,
        tags: tagIds,
      };

      await blogpostService.createBlogPost(blogPostData);

      // Reset form
      setBlogPostTitle("");
      setBlogPostUrlSlug("");
      setBlogPostContent("");
      setBlogPostTags("");
      setBlogPostFeatured(false);
      setBlogPostImage(null);

      alert("Blog post created successfully!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create blog post.";
      console.error("Failed to create blog post:", err);
      alert(errorMessage);
    } finally {
      setCreatingBlogPost(false);
    }
  };

  // USERS

  // Users infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastUserElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading || loadingMoreUsers) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreUsers) {
          loadMoreUsers();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, loadingMoreUsers, hasMoreUsers],
  );

  // Load users when the users tab is active or filters change
  useEffect(() => {
    if (activeTab === "users") {
      resetAndLoadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    debouncedUserNameFilter,
    debouncedUserEmailFilter,
    userRoleFilter,
    userStatusFilter,
  ]);

  // Debounce user name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserNameFilter(userNameFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [userNameFilter]);

  // Debounce user email filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserEmailFilter(userEmailFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [userEmailFilter]);

  const resetAndLoadUsers = () => {
    setCurrentUserPage(1);
    setUsers([]);
    setHasMoreUsers(true);
    loadUsers(1, true);
  };

  const loadUsers = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMoreUsers(true);

      const searchByName = debouncedUserNameFilter || undefined;
      const searchByEmail = debouncedUserEmailFilter || undefined;
      const searchByActive =
        userStatusFilter === "active"
          ? true
          : userStatusFilter === "inactive"
            ? false
            : undefined;
      const searchBySuperuser =
        userRoleFilter === "admin"
          ? true
          : userRoleFilter === "user"
            ? false
            : undefined;

      const response = await userService.getUsers(
        page,
        searchByName,
        searchByEmail,
        searchByActive,
        searchBySuperuser,
      );

      if (reset) setUsers(response.data);
      else setUsers((prev) => [...prev, ...response.data]);

      setTotalUsers(response.count);
      setCurrentUserPage(page);
      setHasMoreUsers(response.count > page * USERS_PER_LOAD);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to load users:", err);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
      setLoadingMoreUsers(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!hasMoreUsers || loading || loadingMoreUsers) return;
    loadUsers(currentUserPage + 1, false);
  };

  const handleUpdateUser = async (
    userId: string,
    data: { is_active?: boolean; is_superuser?: boolean },
  ) => {
    try {
      await userService.updateUser(userId, data);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, ...data } : user,
        ),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to update user:", err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user.");
    }
  };

  // IMAGES

  // Load images when Images or Blog Posts tab is active
  useEffect(() => {
    if (["images", "blog-posts"].includes(activeTab)) {
      if (images.length === 0) loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // TODO: implement infinite scroll and maybe filtering
  const loadImages = async () => {
    try {
      setLoadingImages(true);
      const response = await imageService.getImages();
      setImages(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to load images:", err);
      alert("Failed to load images.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const uploadedImage = await imageService.uploadImage(file);
      // Update local image list
      setImages((prevImages) => [
        {
          filename: uploadedImage.filename,
          url: uploadedImage.url,
          size: uploadedImage.size,
          upload_date: formatDate(new Date().toDateString()),
        },
        ...prevImages,
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload image.";
      console.error("Failed to upload image:", err);
      alert(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this image? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await imageService.deleteImage(filename);
      setImages((prev) => prev.filter((img) => img.filename !== filename));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "blog-posts":
        return (
          // Add new blog post
          <div className="bg-white rounded-xl shadow-lg py-6 px-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Add New Blog Post
            </h2>
            <form className="space-y-6" onSubmit={handleCreateBlogPost}>
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
                        images?.find(
                          (img) => img.filename === e.target.value,
                        ) || null;
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
                      No images available. Upload images in the Images tab
                      first.
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

              <button
                type="submit"
                disabled={creatingBlogPost}
                className={`font-medium py-3 px-8 rounded-lg transition-colors duration-200 ${
                  creatingBlogPost
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {creatingBlogPost ? "Publishing..." : "Publish Post"}
              </button>
            </form>
          </div>
        );

      case "images":
        return (
          <div className="bg-white rounded-xl shadow-lg py-6 px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Image Management
              </h2>
              {/* Image upload button */}
              <div className="flex gap-3">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 cursor-pointer ${
                    uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </label>
              </div>
            </div>

            {loadingImages ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner text="Loading images..." />
              </div>
            ) : (
              <div>
                {(images.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No images uploaded yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first image.
                    </p>
                  </div>
                ) : (
                  // Image boxes
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images &&
                      images.map((image) => (
                        <div
                          key={image.filename}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <img
                            src={`${BACKEND_URL}${image.url}`}
                            alt={image.filename}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {image.filename}
                            </h4>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>
                                {(image.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                              <span>{formatDate(image.upload_date)}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  animateButtonClick(e.currentTarget);
                                  navigator.clipboard.writeText(image.filename);
                                }}
                                className="flex-1 bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm hover:bg-blue-200 active:bg-blue-300 active:scale-95 transform transition-all duration-150"
                              >
                                Copy Name
                              </button>
                              <button
                                onClick={(e) => {
                                  animateButtonClick(e.currentTarget);
                                  navigator.clipboard.writeText(
                                    `${BACKEND_URL}${image.url}`,
                                  );
                                }}
                                className="flex-1 bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm hover:bg-blue-200 active:bg-blue-300 active:scale-95 transform transition-all duration-150"
                              >
                                Copy URL
                              </button>
                              <button
                                onClick={(e) => {
                                  animateButtonClick(e.currentTarget);
                                  handleDeleteImage(image.filename);
                                }}
                                className="flex-1 bg-red-100 text-red-700 py-1 px-3 rounded text-sm hover:bg-red-200 active:bg-red-300 active:scale-95 transform transition-all duration-150"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "users":
        return (
          <div className="bg-white rounded-xl shadow-lg py-6 px-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  User Management
                </h2>
                <p className="text-gray-600 mt-1">
                  Showing {users.length} of {totalUsers} users
                </p>
              </div>
              <button
                onClick={() => resetAndLoadUsers()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Refresh Users
              </button>
            </div>

            {/* User filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                id="nameFilter"
                value={userNameFilter}
                onChange={(e) => setUserNameFilter(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              />
              <input
                type="text"
                id="emailFilter"
                value={userEmailFilter}
                onChange={(e) => setUserEmailFilter(e.target.value)}
                placeholder="Search by email..."
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              />
              <select
                id="roleFilter"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin Only</option>
                <option value="user">User Only</option>
              </select>
              <select
                id="statusFilter"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner text="Loading users..." />
              </div>
            ) : (
              // Users table
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Username
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Account Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 px-4 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr
                          key={user.id}
                          ref={
                            index === users.length - 1
                              ? lastUserElementRef
                              : undefined
                          }
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(user.creation_date)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {user.email}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.is_superuser}
                                  onChange={(e) =>
                                    handleUpdateUser(user.id, {
                                      is_superuser: e.target.checked,
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
                              </label>
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {user.is_superuser ? "Admin" : "User"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.is_active}
                                  onChange={(e) =>
                                    handleUpdateUser(user.id, {
                                      is_active: e.target.checked,
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* More users */}
                {loadingMoreUsers && (
                  <div className="flex justify-center items-center py-4">
                    <LoadingSpinner text="Loading more users..." />
                  </div>
                )}
                {!hasMoreUsers && users.length > 0 && (
                  <div className="flex justify-center items-center py-4">
                    <p className="text-gray-500 text-sm">
                      No more users to load
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "api-docs":
        return (
          <div className="bg-white rounded-xl shadow-lg pt-6 pb-8 px-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              API Documentation
            </h2>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📖</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Interactive API Documentation
                    </h3>
                    <p className="text-gray-600">
                      Explore all available API endpoints
                    </p>
                  </div>
                </div>
                <a
                  href={API_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Open API Docs
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Tab navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="mb-8">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default Admin;
