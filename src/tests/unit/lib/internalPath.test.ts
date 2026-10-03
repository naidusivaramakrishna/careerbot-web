/**
 * Invariant: a `return_to` value is only ever navigated to as a same-origin,
 * in-app path.
 *
 * The check this replaces was `value.startsWith("/") && !value.startsWith("//")`
 * on the RAW value, duplicated at four call sites. It accepts "/..//evil.com",
 * and the consumer then resolves that with `new URL(value, origin)` and
 * navigates to `url.pathname` — which WHATWG normalization has turned into
 * "//evil.com", a protocol-relative URL pointing off-origin.
 *
 * One assertion per shape so a regression names the shape that broke.
 */
import { describe, it, expect } from "vitest";
import { toSameOriginPath } from "@/lib/internalPath";

describe("toSameOriginPath", () => {
  describe("accepts in-app paths, returning the normalized form", () => {
    const accepted: Array<[string, string]> = [
      ["/cover-letter/new", "/cover-letter/new"],
      ["/cover-letter/new?resume_id=abc", "/cover-letter/new?resume_id=abc"],
      ["/builder/start/list", "/builder/start/list"],
      ["/a/b/#frag", "/a/b/#frag"],
      // Normalization is applied, and the normalized value is what is returned.
      ["/a/b/../c", "/a/c"],
      // A double slash INSIDE the path is still same-origin.
      ["/a//b", "/a//b"],
      // Percent-encoded slashes are not path separators.
      ["/%2F%2Fevil.com", "/%2F%2Fevil.com"],
    ];

    for (const [input, expected] of accepted) {
      it(`${JSON.stringify(input)} -> ${JSON.stringify(expected)}`, () => {
        expect(toSameOriginPath(input)).toBe(expected);
      });
    }
  });

  describe("rejects anything that can leave the origin", () => {
    const rejected: Array<string | null | undefined> = [
      // Protocol-relative, caught by the raw check too.
      "//evil.com",
      "///evil.com",
      // The shapes the raw startsWith check MISSES: they begin with a single
      // "/" and normalize to a protocol-relative path.
      "/..//evil.com",
      "/./..//evil.com",
      "/a/../..//evil.com",
      "/a/b/../../..//evil.com",
      // Backslash is a path separator for special schemes, so "/\" behaves
      // like "//" and resolves to a different host.
      "/\\evil.com",
      "/\\/evil.com",
      // Absolute and scheme-relative references.
      "https://evil.com",
      "http://evil.com/path",
      "javascript:alert(1)",
      "data:text/html,<script></script>",
      // Not a path at all.
      "cover-letter/new",
      "",
      null,
      undefined,
    ];

    for (const input of rejected) {
      it(`${JSON.stringify(input)} -> null`, () => {
        expect(toSameOriginPath(input)).toBeNull();
      });
    }
  });

  it("never returns a value that re-resolves to a different origin", () => {
    const origin = "https://app.careerbot.test";
    const probes = [
      "/cover-letter/new",
      "/..//evil.com",
      "/a/../..//evil.com",
      "/\\evil.com",
      "//evil.com",
      "/a//b",
      "/%2F%2Fevil.com",
    ];

    for (const probe of probes) {
      const result = toSameOriginPath(probe);
      if (result === null) continue;
      expect(new URL(result, origin).origin).toBe(origin);
    }
  });
});
