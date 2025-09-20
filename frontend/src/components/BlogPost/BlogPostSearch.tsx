import { useState, useEffect } from "react";

interface BlogPostSearchProps {
  onSearch: (searchBy: string, searchValue: string) => void;
  isLoading: boolean;
  currentSearchBy: string;
  currentSearchValue: string;
}

function BlogPostSearch({
  onSearch,
  isLoading = false,
  currentSearchBy = "",
  currentSearchValue = ""
}: BlogPostSearchProps) {
  const [searchValue, setSearchValue] = useState<string>(currentSearchValue);
  const [searchBy, setSearchBy] = useState<string>(currentSearchBy || "title");

  // To keep the search values after clicking search
  useEffect(() => {
    setSearchValue(currentSearchValue);
    setSearchBy(currentSearchBy || "title");
  }, [currentSearchBy, currentSearchValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchBy, searchValue.trim());
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setSearchBy("title");
    onSearch("", "");
  };

  const hasActiveSearch = currentSearchValue.trim();
  const canSearch = searchValue.trim() && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col sm:flex-row gap-2 sm:items-center justify-center"
    >
      <div className="w-full sm:max-w-md">
        <label htmlFor="query" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            name="query"
            id="query"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <select
          name="searchBy"
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
          disabled={isLoading}
        >
          <option value="title">Title</option>
          <option value="tag">Tag</option>
          <option value="content">Content</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>

        {hasActiveSearch && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

export default BlogPostSearch;
