/**
 * Shared setup for the suites that render the full ChatApp widget. Import it
 * for its side effects, before rendering.
 *
 * Why they were slow (#246 "Unit Tests (new failures)": the first test of
 * four suites ran past 15 s, twice, on a loaded CI runner):
 * - jsdom 23's selector engine re-parses the CSS selector on every
 *   Element.matches() call (~0.2-0.5 ms each). Testing Library's *ByText
 *   calls matches() twice for every element it looks at (its `script, style`
 *   ignore list, and getNodeText's `input[type=submit], ...`), and
 *   waitFor/findBy* re-run the query after every DOM change.
 * - *ByRole also reads getComputedStyle, ~10-50 ms per element in jsdom 23.
 * - CI runs 8 of these suites at once on a shared host.
 *
 * 1. Those two selectors are answered here directly, with jsdom's own answers
 *    (chatAppSuiteSetup.test.ts checks every case against jsdom); every other
 *    selector goes to jsdom unchanged.
 * 2. Test timeout 30 s (was 15 s per suite): a full-widget test takes 1-4 s
 *    locally, and the first (cold) test of a suite took over 4x that on CI.
 */
import { vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

const IGNORED = 'script, style';
const BUTTON_INPUTS = 'input[type=submit], input[type=button], input[type=reset]';
const BUTTON_TYPES = new Set(['submit', 'button', 'reset']);

const jsdomMatches = Element.prototype.matches;

export function fastMatches(this: Element, selectors: string): boolean {
  // Checked for HTML documents only (the test environment's); XML ones go to jsdom.
  if (this.ownerDocument.contentType !== 'text/html') return jsdomMatches.call(this, selectors);
  if (selectors === IGNORED) return this.localName === 'script' || this.localName === 'style';
  if (selectors === BUTTON_INPUTS) {
    const type = this.getAttribute('type');
    if (this.localName !== 'input' || type === null) return false;
    // In HTML documents jsdom compares `type` case-insensitively, in every namespace.
    return BUTTON_TYPES.has(type.toLowerCase());
  }
  return jsdomMatches.call(this, selectors);
}

export { jsdomMatches };

Element.prototype.matches = fastMatches;
