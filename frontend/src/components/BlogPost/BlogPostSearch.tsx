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
  currentSearchValue = "",
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
        <input
          type="text"
          name="query"
          id="query"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search articles..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <select
          name="searchBy"
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
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
