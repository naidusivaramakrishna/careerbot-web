const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

/**
 * Cheap client-side UX guard only (rejects the wrong file before an upload
 * round-trip) — trivially bypassable, so the backend must still validate
 * file type/content independently.
 */
export function hasAllowedDocumentExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Normalizes a possibly scheme-less external URL — aggregator data frequently
 * carries bare-domain URLs like "www.company.com/jobs/123" with no
 * http(s):// prefix — and returns it only if it resolves to a safe http(s)
 * URL. Rejects javascript:/data:/vbscript: URIs sneaking into an <a href>:
 * anything that doesn't already start with http(s):// gets one prepended
 * before validation, so a dangerous scheme can never surface as the
 * resulting URL's actual protocol. Returns undefined for anything invalid
 * or unsafe so callers can gate rendering on it directly.
 */
export function getSafeExternalUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const withScheme =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  try {
    return SAFE_URL_PROTOCOLS.has(new URL(withScheme).protocol) ? withScheme : undefined;
  } catch {
    return undefined;
  }
}

/** Boolean form of {@link getSafeExternalUrl} for simple render guards. */
export function isSafeExternalUrl(url?: string | null): boolean {
  return getSafeExternalUrl(url) !== undefined;
}
