"use client";
import { useEffect, useState } from "react";

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
  const [sanitized, setSanitized] = useState(content);

  useEffect(() => {
    import("dompurify").then((mod) => {
      setSanitized(mod.default.sanitize(content));
    });
  }, [content]);

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
