// dompurify is browser-only; this function is always called inside useEffect (client-side).
// Using "dompurify" directly avoids the isomorphic-dompurify → jsdom → ESM build failure.
import DOMPurify from "dompurify";

const EDITOR_CONFIG = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "ul", "ol", "li", "br", "span"],
  ALLOWED_ATTR: [] as string[],
  FORBID_TAGS: ["iframe", "object", "embed", "script", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc"],
};

/**
 * Sanitizes html with DOMPurify and assigns it to el.innerHTML.
 * Use this everywhere a contenteditable editor value is written back to the DOM.
 */
export function setSafeInnerHTML(el: HTMLElement | null, html: string): void {
  if (!el) return;
  // Cast to string: dompurify 3.x returns string | TrustedHTML, innerHTML requires string
  el.innerHTML = DOMPurify.sanitize(html ?? "", EDITOR_CONFIG) as string; // safe: DOMPurify-sanitized
}
