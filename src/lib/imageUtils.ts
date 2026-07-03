const FALLBACK_IMAGE = '/assets/templates/template-1.png';

/**
 * Resolves a template preview_url to a src-ready string.
 *
 * The backend now stores and returns preview_url as an absolute URL
 * (e.g. "https://api.careerbot.com/assets/templates/...").
 * This utility handles the fallback cases so components never receive null/undefined.
 *
 *   absolute URL  → return as-is
 *   relative path → prepend NEXT_PUBLIC_SERVER_URL (legacy backend support)
 *   null/undefined → return local fallback image
 */
export function resolveTemplateImageUrl(previewUrl?: string | null): string {
  if (!previewUrl) return FALLBACK_IMAGE;
  if (previewUrl.startsWith('http')) return previewUrl;
  // /assets/templates/previews/ paths are served by the backend, not the Next.js public folder
  if (previewUrl.startsWith('/assets/') && !previewUrl.includes('/previews/')) return previewUrl;
  if (previewUrl.startsWith('/')) {
    const base = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '');
    return `${base}${previewUrl}`;
  }
  return FALLBACK_IMAGE;
}

export { FALLBACK_IMAGE };
