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
 * Guards against javascript:/data:/vbscript: URIs sneaking into an <a href>
 * from API-supplied job/application URLs (e.g. third-party job aggregators).
 */
export function isSafeExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    return SAFE_URL_PROTOCOLS.has(new URL(trimmed).protocol);
  } catch {
    return false;
  }
}
