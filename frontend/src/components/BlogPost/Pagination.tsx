import { BLOGPOSTS_PER_PAGE, MAX_BLOGPOST_PAGES } from "../../types/blogpost";

interface PaginationProps {
  currentPage: number;
  blogpostCount: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  blogpostCount,
  onPageChange,
}: PaginationProps) {
  const totalPages: number = Math.ceil(blogpostCount / BLOGPOSTS_PER_PAGE);

  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = (): number[] => {
    if (totalPages <= MAX_BLOGPOST_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + MAX_BLOGPOST_PAGES - 1);
    startPage = Math.max(1, endPage - MAX_BLOGPOST_PAGES + 1);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const visiblePages = getVisiblePages();
  const showFirstArrow = visiblePages[0] > 1;
  const showLastArrow = visiblePages[visiblePages.length - 1] < totalPages;

  return (
    <>
      {/* First page arrow */}
      {showFirstArrow && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-blue-100"
            title="First page"
          >
            <span className="mr-1">«</span>1
          </button>
          {visiblePages[0] > 2 && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Visible page numbers */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 border border-gray-300 rounded hover:bg-blue-100 ${
            currentPage === page
              ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
              : ""
          }`}
        >
          {page}
        </button>
      ))}

      {/* Last page arrow */}
      {showLastArrow && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-blue-100"
            title="Last page"
          >
            {totalPages}
            <span className="ml-1">»</span>
          </button>
        </>
      )}
    </>
  );
}

export default Pagination;
