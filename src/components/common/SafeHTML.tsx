"use client";

import React from "react";

// dompurify is browser-only; the "isomorphic" wrapper pulled in jsdom which breaks
// Next.js builds (jsdom 29 → @asamuzakjp/css-color is ESM-with-top-level-await).
// SafeHTML is only used inside "use client" templates so we can guard with typeof window.
// On the server SSR pass, React escapes the raw string automatically (no XSS path).

const ALLOWED_TAGS = ["b", "i", "em", "strong", "p", "ul", "ol", "li", "br", "span"];
const SANITIZE_OPTS = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [] as string[],
  FORBID_TAGS: ["iframe", "object", "embed", "script", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc"],
};

interface SafeHTMLProps {
  content: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function SafeHTML({
  content,
  className,
  as: Tag = "div",
}: SafeHTMLProps) {
  const raw = content ?? "";

  // Server-side: no DOM available — render as plain escaped text (React escapes by default).
  // This avoids importing jsdom and the ERR_REQUIRE_ASYNC_MODULE build failure.
  if (typeof window === "undefined") {
    return <Tag className={className}>{raw}</Tag>;
  }

  // Client-side: sanitize with browser-native DOMPurify before injecting HTML.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify") as typeof import("dompurify").default;
  const clean = DOMPurify.sanitize(raw, SANITIZE_OPTS) as string;

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
