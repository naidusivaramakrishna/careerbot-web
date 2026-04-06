"use client";

import DOMPurify from "dompurify";

interface SafeHTMLProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function SafeHTML({
  content,
  className,
  as: Tag = "div",
}: SafeHTMLProps) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  );
}
