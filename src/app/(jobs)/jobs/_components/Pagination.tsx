"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
          currentPage === 1
            ? "border-gray-200 text-gray-300 cursor-not-allowed bg-white"
            : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 hover:text-gray-900"
        }`}
      >
        <ChevronLeft size={15} />
        Previous
      </button>

      {/* Page numbers */}
      {getPages().map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`min-w-9.5 h-9.5 rounded-full text-sm font-semibold transition-all ${
              page === currentPage
                ? "bg-[#0f172a] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
          currentPage === totalPages
            ? "border-gray-200 text-gray-300 cursor-not-allowed bg-white"
            : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 hover:text-gray-900"
        }`}
      >
        Next
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
