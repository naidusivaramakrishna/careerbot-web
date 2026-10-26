/**
 * Shared setup for heavy rendering suites (the mock-interview room and setup
 * pages, the dashboard, the coding step). Import it for its side effects,
 * before rendering.
 *
 * Why (#245 "Unit Tests (new failures)": the chunk of PR-touched suites ran
 * past its 420 s limit on a loaded CI runner; under load, tests ran past their
 * limits, were retried, and the retries slowed the chunk further):
 * - jsdom 23's selector engine re-parses the CSS selector on every
 *   Element.matches() call. MockInterviewPage.test.tsx made ~119,000 of them
 *   (~9 s of its ~63 s), nearly all from *ByRole: it finds each element's
 *   implicit role by trying Testing Library's role selectors (`button`,
 *   `input[type="checkbox"]`, `select:not([multiple]):not([size])`, ...) one
 *   by one, and waitFor/findBy* repeat the query after every DOM change.
 *   *ByText adds two fixed selectors per element (`script, style` and the
 *   submit/button/reset input check). (getComputedStyle, ~25 s, is jsdom's
 *   own cost and is left alone.)
 *
 * 1. Those selectors are answered here directly, with jsdom's own answers
 *    (pageSuiteSetup.test.ts checks every role selector Testing Library uses
 *    against jsdom). Any other selector, and any case that is not plainly
 *    decidable (a non-HTML document, an element outside the HTML namespace or
 *    with an upper-case tag name, an attribute set with setAttributeNS, a value
 *    that differs from the selector's only in letter case), goes to jsdom unchanged.
 * 2. Test timeout 60 s (vitest's default is 5 s) for tests that set none. A
 *    whole-page test takes 1-5 s on an idle machine and up to ~25 s at load 20
 *    on 8 cores. A test that runs past its limit is retried while its first run
 *    is still rendering, and its unused mock*Once values (vi.clearAllMocks keeps
 *    them) reach the next tests: at load 20 the 5 s limit failed 8 tests of
 *    these suites. The cost: a test that hangs takes up to 2 x 60 s (CI runs
 *    --retry=1) of its chunk's 420 s instead of 2 x 5 s.
 */
import { vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000 });

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const IGNORED = 'script, style';
const BUTTON_INPUTS = 'input[type=submit], input[type=button], input[type=reset]';
const BUTTON_TYPES = new Set(['submit', 'button', 'reset']);

type Condition = { attr: string; present: boolean; value?: string };
type RoleSelector = { tag: string; conditions: Condition[] };

// Testing Library's role selectors: a tag, then [attr], [attr="value"] or :not([attr]) parts.
const ROLE_SELECTOR = /^([a-z][a-z0-9]*)((?:\[[a-z-]+(?:="[a-z0-9]+")?\]|:not\(\[[a-z-]+\]\))*)$/;
const PART = /\[([a-z-]+)(?:="([a-z0-9]+)")?\]|:not\(\[([a-z-]+)\]\)/g;
const compiled = new Map<string, RoleSelector | null>();

export function compileRoleSelector(selectors: string): RoleSelector | null {
  if (compiled.has(selectors)) return compiled.get(selectors)!;
  const m = ROLE_SELECTOR.exec(selectors);
  const result = m
    ? {
        tag: m[1],
        conditions: [...m[2].matchAll(PART)].map(([, attr, value, absent]) =>
          absent ? { attr: absent, present: false } : { attr, present: true, value }),
      }
    : null;
  compiled.set(selectors, result);
  return result;
}

/**
 * false when an attribute was set with setAttributeNS: an upper-case name (matched
 * case-insensitively), a prefix, or a name used twice. jsdom's [attr] matches the
 * local name in any namespace, which getAttribute() does not mirror for those.
 */
function hasPlainAttributes(el: Element): boolean {
  const names = el.getAttributeNames();
  return !names.some((name) => name !== name.toLowerCase() || name.includes(':')) && new Set(names).size === names.length;
}

/** true/false when the answer is certain, undefined to ask jsdom. */
function matchRoleSelector(el: Element, sel: RoleSelector): boolean | undefined {
  if (el.namespaceURI !== HTML_NS) return undefined;
  const tag = el.localName;
  if (tag !== sel.tag) return tag === tag.toLowerCase() ? false : undefined;
  if (sel.conditions.length === 0) return true;
  if (!hasPlainAttributes(el)) return undefined;
  let undecided = false;
  for (const c of sel.conditions) {
    const attr = el.getAttributeNode(c.attr);
    if (attr && attr.namespaceURI !== null) return undefined;
    const value = attr ? attr.value : null;
    if (!c.present) {
      if (value !== null) return false;
    } else if (value === null) {
      return false;
    } else if (c.value !== undefined && value !== c.value) {
      // HTML compares some attribute values (type, scope, ...) ASCII case-insensitively.
      if (value.toLowerCase() !== c.value) return false;
      undecided = true;
    }
  }
  return undecided ? undefined : true;
}

const jsdomMatches = Element.prototype.matches;

export function fastMatches(this: Element, selectors: string): boolean {
  // Checked for HTML documents only (the test environment's); XML ones go to jsdom.
  if (this.ownerDocument.contentType !== 'text/html') return jsdomMatches.call(this, selectors);
  const tag = this.localName;
  // Upper-case tag names (createElementNS only) are left to jsdom's case rules.
  if (tag === tag.toLowerCase()) {
    if (selectors === IGNORED) return tag === 'script' || tag === 'style';
    if (selectors === BUTTON_INPUTS) {
      if (tag !== 'input') return false;
      if (hasPlainAttributes(this)) {
        const type = this.getAttribute('type');
        // In HTML documents jsdom compares `type` case-insensitively, in every namespace.
        return type !== null && BUTTON_TYPES.has(type.toLowerCase());
      }
    }
  }
  const role = compileRoleSelector(selectors);
  const answer = role ? matchRoleSelector(this, role) : undefined;
  return answer ?? jsdomMatches.call(this, selectors);
}

export { jsdomMatches };

Element.prototype.matches = fastMatches;
