"use client";

import React, { useEffect, useRef, useState } from "react";

const PAGE_HEIGHT = 760;

interface ResumePagePagerProps {
  children: React.ReactNode;
  currentPage?: number;
  onPageCountChange?: (count: number) => void;
}

/** Presents the domain templates one resume page at a time without an inner scrollbar. */
const ResumePagePager: React.FC<ResumePagePagerProps> = ({
  children,
  currentPage = 1,
  onPageCountChange,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageOffsets, setPageOffsets] = useState<number[]>([0]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updatePageCount = () => {
      const pageCount = Math.max(1, Math.ceil(content.scrollHeight / PAGE_HEIGHT));
      const starts = Array.from({ length: pageCount }, (_, index) => index * PAGE_HEIGHT);
      setPageOffsets(starts);
      onPageCountChange?.(pageCount);
    };

    updatePageCount();
    const observer = new ResizeObserver(updatePageCount);
    observer.observe(content);
    window.addEventListener("load", updatePageCount);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", updatePageCount);
    };
  }, [children, onPageCountChange]);

  return (
    <div className="resume-domain-page-viewport" style={{ height: PAGE_HEIGHT }}>
      <div
        ref={contentRef}
        className="resume-domain-page-content"
        style={{ transform: `translateY(-${pageOffsets[Math.max(1, currentPage) - 1] ?? 0}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResumePagePager;
