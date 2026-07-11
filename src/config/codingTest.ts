// Coding-test API paths.
// Relative paths route through the Next.js /api proxy rewrite
// (next.config.ts -> BACKEND_URL) in EVERY environment (dev, staging, prod),
// so the browser never needs the backend port (8000) exposed to it. This
// matches how the rest of the app (httpClient) reaches the backend.
export const CODING_TEST_API = {
  problems: '/api/v1/coding-test/problems',
  problem: (slug: string) =>
    `/api/v1/coding-test/problems/${encodeURIComponent(slug)}`,
} as const;
