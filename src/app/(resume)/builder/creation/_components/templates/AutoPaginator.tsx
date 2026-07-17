"use client";

import React, { useEffect, useRef, useState } from "react";

interface AutoPaginatorProps {
  children: React.ReactNode;
  onPageCountChange?: (count: number) => void; // send page count to PreviewPanel
  currentPage?: number;
}

const PAGE_HEIGHT = 760;

const AutoPaginator: React.FC<AutoPaginatorProps> = ({ children, onPageCountChange, currentPage = 1 }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<React.ReactNode[][]>([]);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    const reactNodes = React.Children.toArray(children);
    const blocks = Array.from(container.children) as HTMLElement[];
    const heights = blocks.map((block) => block.offsetHeight);

    // Group elements into preview pages
    const newPages: React.ReactNode[][] = [[]];
    let curHeight = 0;

    reactNodes.forEach((child, idx) => {
      const h = heights[idx];

      if (curHeight > 0 && curHeight + h > PAGE_HEIGHT - 60) {
        newPages.push([]);
        curHeight = 0;
      }

      newPages[newPages.length - 1].push(child);
      curHeight += h;
    });

    setPages(newPages);
    onPageCountChange?.(newPages.length); // IMPORTANT: Notify PreviewPanel
  }, [children, onPageCountChange]);

  return (
    <>
      {/* Rendered off-canvas so browser layout returns real heights. */}
      <div ref={measureRef} className="resume-measure-container" aria-hidden="true">
        {React.Children.map(children, (child, index) => (
          <div key={index} className="resume-measure-block">{child}</div>
        ))}
      </div>

      {/* rendered preview pages */}
      <div className="resume-container">
        {pages.map((page, index) => (
          <div
            key={index}
            className={`resume-pagination-page a2-page ${index + 1 === currentPage ? "resume-pagination-page--active" : ""}`}
          >
            <div className="a2-page-content">
              {page.map((node, i) => (
                <React.Fragment key={i}>{node}</React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AutoPaginator;
