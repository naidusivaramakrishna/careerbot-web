// Base URL for the coding-test API (careerbot-api).
// Defaults to the local backend; override with NEXT_PUBLIC_API_BASE_URL.
// Set it to an empty string to route through the Next.js /api proxy rewrite
// instead of hitting the backend port directly.
export const CODING_TEST_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const CODING_TEST_API = {
  problems: `${CODING_TEST_API_BASE_URL}/api/v1/coding-test/problems`,
  problem: (slug: string) =>
    `${CODING_TEST_API_BASE_URL}/api/v1/coding-test/problems/${encodeURIComponent(slug)}`,
} as const;
