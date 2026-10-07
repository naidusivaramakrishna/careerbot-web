/**
 * Shared by the browser reporter and the server endpoint. No imports on
 * purpose: this file is bundled into the client, so it must never pull in
 * prom-client or anything server-only.
 */
export const CLIENT_ERROR_KINDS = ['js_error', 'unhandled_rejection', 'chunk_load'] as const;
export type ClientErrorKind = (typeof CLIENT_ERROR_KINDS)[number];

export function isClientErrorKind(value: unknown): value is ClientErrorKind {
  return typeof value === 'string' && (CLIENT_ERROR_KINDS as readonly string[]).includes(value);
}

// webpack: "ChunkLoadError: Loading chunk 123 failed." / "Loading CSS chunk 4 failed."
// native dynamic import: "Failed to fetch dynamically imported module" (Chrome),
// "error loading dynamically imported module" (Firefox),
// "Importing a module script failed." (Safari).
const CHUNK_LOAD_MESSAGE =
  /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/**
 * ChunkLoadError usually means the browser holds a page from an older deploy
 * whose chunks no longer exist. It is classified separately because it is a
 * deploy problem, not a code bug, and it is the signal a rollout broke users.
 */
export function isChunkLoadError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return typeof err === 'string' && CHUNK_LOAD_MESSAGE.test(err);
  }
  const e = err as { name?: unknown; message?: unknown };
  if (e.name === 'ChunkLoadError') return true;
  return typeof e.message === 'string' && CHUNK_LOAD_MESSAGE.test(e.message);
}

export function classifyClientError(
  source: 'error' | 'unhandledrejection',
  err: unknown,
  message?: string,
): ClientErrorKind {
  if (isChunkLoadError(err) || (message !== undefined && isChunkLoadError(message))) {
    return 'chunk_load';
  }
  return source === 'unhandledrejection' ? 'unhandled_rejection' : 'js_error';
}
