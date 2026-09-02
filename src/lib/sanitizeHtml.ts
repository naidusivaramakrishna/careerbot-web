// Shared HTML sanitizer — the single allowlist used by both <SafeHTML> and the
// resume-builder contentEditable editors. Keep this the ONLY place the resume
// rich-text allowlist is defined so the editor and the rendered template agree.
//
// Browser-only: dompurify needs a DOM. On the server sanitizeHtml() returns ""
// — callers must never inject raw HTML server-side (React escapes by default).

// Tags the resume rich-text toolbar can produce (bold/italic/underline/lists).
export const ALLOWED_TAGS = [
  'b', 'i', 'u', 'em', 'strong', 'p', 'ul', 'ol', 'li', 'br', 'span',
];

export const SANITIZE_OPTS = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [] as string[],
  FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'srcdoc'],
};

/**
 * Sanitize an HTML string against the shared resume-content allowlist.
 * Returns "" on the server (no DOM available).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  const raw = input ?? '';
  if (typeof window === 'undefined') return '';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify') as typeof import('dompurify').default;
  return DOMPurify.sanitize(raw, SANITIZE_OPTS) as string;
}

/**
 * Escape the HTML-significant characters so a string is safe to place inside
 * HTML. Use when building a small HTML string (e.g. wrapping regex matches in
 * <mark>) where the surrounding text must NOT be interpreted as HTML.
 * Pure string operation — safe on the server too.
 */
export function escapeHtml(input: string | null | undefined): string {
  return (input ?? '')
    // Escape "&" only when it does not already begin a valid entity, so
    // already-escaped text is not double-escaped ("&lt;" stays "&lt;").
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
