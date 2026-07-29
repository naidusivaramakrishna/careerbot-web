"use client";

import React, { useEffect, useRef, useState } from "react";

interface AutoPaginatorProps {
  children: React.ReactNode;
  onPageCountChange?: (count: number) => void; // send page count to PreviewPanel
}

const PAGE_HEIGHT = 1122;

const AutoPaginator: React.FC<AutoPaginatorProps> = ({ children, onPageCountChange }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<React.ReactNode[][]>([]);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    const reactNodes = React.Children.toArray(children);
    container.replaceChildren();

    const heights: number[] = [];

    reactNodes.forEach((child, idx) => {
      const wrapper = document.createElement("div");
      wrapper.style.width = "100%";
      container.appendChild(wrapper);

      const temp = document.createElement("div"); // safe: static empty element
      wrapper.appendChild(temp);

      temp.innerHTML = serialize(child); // safe: serialize() outputs React-controlled HTML, no user-supplied raw strings
      heights[idx] = temp.offsetHeight;

      wrapper.remove();
    });

    // Group elements into A4 pages
    const newPages: React.ReactNode[][] = [[]];
    let curHeight = 0;

    reactNodes.forEach((child, idx) => {
      const h = heights[idx];

      if (curHeight + h > PAGE_HEIGHT - 60) {
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
      {/* hidden measuring container */}
      <div ref={measureRef} className="hidden-content" />

      {/* rendered A4 pages */}
      <div className="resume-container">
        {pages.map((page, idx) => (
          <div key={idx} className="a4-page">
            <div className="a4-page-content">
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

/* Convert React node to HTML string for height measurement */
function serialize(child: unknown): string {
  if (typeof child === "string" || typeof child === "number") return `${child}`;
  const reactChild = child as { props?: { children?: React.ReactNode } };
  if (!reactChild?.props) return "";

  let html = "<div>";
  React.Children.forEach(reactChild.props.children, (inner) => {
    html += serialize(inner);
  });
  html += "</div>";

  return html;
}

export default AutoPaginator;

