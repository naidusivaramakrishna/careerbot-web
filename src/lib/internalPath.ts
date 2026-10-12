/**
 * Validation for in-app "come back here afterwards" paths (the `return_to`
 * query param used by the Resume Builder -> Cover Letter handoff).
 *
 * Why this is not a one-line `startsWith` test:
 *
 *   `value.startsWith("/") && !value.startsWith("//")` on the RAW value is not
 *   sufficient. "/..//evil.com" passes it, and the consumer then does
 *   `new URL(value, window.location.origin)` and navigates to
 *   `url.pathname` — which WHATWG URL normalization has turned into
 *   "//evil.com", a protocol-relative URL that sends the browser off-origin.
 *
 * So: normalize first, re-check the normalized form, and return the exact
 * string the router will be handed. Callers must navigate to the RETURNED
 * value, never to the raw input.
 */

// A fixed, unreachable probe origin. Resolution only needs *an* origin to
// normalize a relative reference against, and a constant one keeps this
// function usable during server rendering where `window` does not exist.
const PROBE_ORIGIN = "https://internal-path.invalid";

export function toSameOriginPath(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  let resolved: URL;
  try {
    resolved = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (resolved.origin !== PROBE_ORIGIN) return null;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  // Re-check AFTER normalization: this is the check the raw-value test misses.
  if (!path.startsWith("/") || path.startsWith("//")) return null;

  return path;
}
