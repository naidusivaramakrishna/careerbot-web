"use client";

import React from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

// SafeHTML renders rich-text resume content with the shared allowlist defined in
// src/lib/sanitizeHtml.ts. On the server SSR pass there is no DOM, so we render
// the raw string as escaped text (React escapes by default — no XSS path).

interface SafeHTMLProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function SafeHTML({
  content,
  className,
  style,
  as: Tag = "div",
}: SafeHTMLProps) {
  const raw = content ?? "";

  // Server-side: no DOM available — render as plain escaped text.
  if (typeof window === "undefined") {
    return <Tag className={className} style={style}>{raw}</Tag>;
  }

  // Client-side: sanitize against the shared allowlist before injecting HTML.
  const clean = sanitizeHtml(raw);

  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
