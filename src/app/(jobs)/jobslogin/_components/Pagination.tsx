"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems?: number;
  readonly itemsPerPage?: number;
  readonly onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | "start-ellipsis" | "end-ellipsis")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "start-ellipsis" | "end-ellipsis")[] = [];

    // Always show a window of 5 consecutive pages
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end === totalPages) start = Math.max(1, totalPages - 4);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("start-ellipsis");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("end-ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : currentPage * itemsPerPage;

  return (
    <div className="flex items-center justify-between mt-5 mb-2 px-1">
      {/* Showing X–Y of Z */}
      <p className="text-[13px] text-gray-500 shrink-0">
        Showing{" "}
        <span className="font-bold text-gray-800">{firstItem}–{lastItem}</span>{" "}
        of{" "}
        <span className="font-bold text-gray-800">{totalItems ?? totalPages * itemsPerPage}</span>
      </p>

      {/* Prev · pages · Next */}
      <div className="flex items-center gap-0.5">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft size={14} /> Prev
        </button>

        {/* Page numbers */}
        {getPages().map((page) =>
          page === "start-ellipsis" || page === "end-ellipsis" ? (
            <span key={page} className="px-2 text-gray-400 text-[13px] select-none">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              className={`min-w-8 h-8 rounded-lg text-[13px] font-semibold transition-all ${
                page === currentPage
                  ? "bg-[#4F46E5] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
