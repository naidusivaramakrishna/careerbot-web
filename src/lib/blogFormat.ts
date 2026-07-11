// Client-safe helpers and types for blog content — no Node APIs here.
// The fs-based loader lives in src/lib/blog.ts (server-only).

export type ArticleIllustration = 'resume' | 'ats' | 'cover-letter' | 'interview';

export interface Article {
  slug: string;
  title: string;
  category: string;
  tag: string;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  excerpt: string;
  illustration: ArticleIllustration;
  featured: boolean;
  featuredGuide?: boolean;
  author: string;
  body: string[];
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}

/** Computed from the real `updatedAt` timestamp at render time — not a static string. */
export function formatUpdated(updatedAtIso: string): string {
  const diffMs = Date.now() - new Date(updatedAtIso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Updated today';
  if (diffDays === 1) return 'Updated 1 day ago';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Updated 1 week ago';
  if (diffWeeks < 5) return `Updated ${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 1) return 'Updated 1 month ago';
  return `Updated ${diffMonths} months ago`;
}
