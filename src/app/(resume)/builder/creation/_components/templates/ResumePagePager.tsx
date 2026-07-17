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
      const root = content.firstElementChild as HTMLElement | null;
      const blocks = root ? Array.from(root.children) as HTMLElement[] : [];
      const starts = [0];
      let pageStart = 0;

      blocks.forEach((block) => {
        const blockTop = block.offsetTop;
        const blockBottom = blockTop + block.offsetHeight;
        if (blockBottom > pageStart + PAGE_HEIGHT && blockTop > pageStart) {
          pageStart = blockTop;
          starts.push(pageStart);
        }
      });

      const pageCount = Math.max(1, starts.length);
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
