/**
 * Interview notes moved from /notes/* to /prep/*. Old URLs (bookmarks, links
 * in emails, notifications stored before the move) must still land on the new
 * pages: next.config.ts redirects them, and notification clicks open the new
 * page directly.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../../../next.config";
import { resolveNotificationRoute } from "@/lib/notificationRoute";

type Redirect = { source: string; destination: string; permanent: boolean };

const pageExists = (route: string) =>
  fs.existsSync(path.join(process.cwd(), "src/app/(interview)", route, "page.tsx"));

/** The first matching rule wins, as in Next.js; `:path*` takes the rest of the path (zero or more segments). */
function redirectFor(rules: Redirect[], url: string): string | null {
  for (const rule of rules) {
    const wildcard = rule.source.match(/^(.*)\/:path\*$/);
    if (wildcard && url === wildcard[1]) return rule.destination.replace("/:path*", "");
    if (wildcard && url.startsWith(wildcard[1] + "/")) {
      return rule.destination.replace(":path*", url.slice(wildcard[1].length + 1));
    }
    if (rule.source === url) return rule.destination;
  }
  return null;
}

const OLD_ROUTES: Array<[string, string]> = [
  ["/notes", "/prep"],
  ["/notes/generate", "/prep/notes"],
  ["/notes/english", "/prep/english"],
  ["/notes/hr", "/prep/hr"],
  ["/notes/hr/practice", "/prep/hr/practice"],
  ["/notes/managerial", "/prep/managerial"],
  ["/notes/managerial/practice", "/prep/managerial/practice"],
  ["/notes/technical", "/prep/technical"],
  ["/notes/technical/practice", "/prep/technical/practice"],
];

describe("old /notes URLs after the move to /prep", () => {
  it.each(OLD_ROUTES)("next.config.ts permanently redirects %s to %s, an existing page", async (oldUrl, newUrl) => {
    const rules = (await nextConfig.redirects?.()) as Redirect[];
    expect(redirectFor(rules, oldUrl)).toBe(newUrl);
    expect(rules.every((rule) => rule.permanent)).toBe(true);
    expect(pageExists(newUrl)).toBe(true);
  });

  it.each([
    ["/notes/generate", "/prep/notes"],
    ["/notes/english", "/prep/english"],
    ["/notes/hr#top", "/prep/hr#top"],
    ["/notes/managerial?tab=hr", "/prep/managerial?tab=hr"],
    ["/notes/technical/", "/prep/technical"],
    ["/prep/notes", "/prep/notes"],
    ["/prep/technical", "/prep/technical"],
  ])("a notification for %s opens %s", (actionUrl, expected) => {
    expect(resolveNotificationRoute({ type: "prep", action_url: actionUrl })).toBe(expected);
  });

  it("still ignores paths that are not known pages", () => {
    expect(resolveNotificationRoute({ type: "prep", action_url: "/notes/unknown" })).toBeNull();
    expect(resolveNotificationRoute({ type: "prep", action_url: "/prep/unknown" })).toBeNull();
  });
});
