"use client";
import React, { useEffect, useRef } from "react";

interface AutoPaginatorProps {
  children: React.ReactNode;
  onPageCountChange?: (count: number) => void;
}

const AutoPaginator: React.FC<AutoPaginatorProps> = ({ 
  children, 
  onPageCountChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && onPageCountChange) {
      // Calculate approximate page count based on height
      // A4 page height is approximately 1122px at 96 DPI
      const pageHeight = 1122;
      const contentHeight = containerRef.current.scrollHeight;
      const pageCount = Math.ceil(contentHeight / pageHeight);
      onPageCountChange(pageCount);
    }
  }, [children, onPageCountChange]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
};

export default AutoPaginator;
