import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const root = path.resolve(__dirname, "../../../../..");
const MI_DIR = "src/app/(interview)/mock-interview";
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

function sourceFiles(rel: string): string[] {
  return readdirSync(path.join(root, rel)).flatMap((name) => {
    const child = `${rel}/${name}`;
    if (statSync(path.join(root, child)).isDirectory()) return sourceFiles(child);
    return /\.(tsx?|css)$/.test(name) ? [child] : [];
  });
}

// An encoding round-trip turned ’ … · into "?" or U+FFFD ("you?ve",
// "We\uFFFDll", "rounds ? Avg", "Loading sessions?"). It is visible in the UI
// but nothing else fails, so scan the sources. A lost "…" cannot be told from
// a real question mark, so those strings are pinned one by one.
describe("mock-interview copy has no corrupted punctuation", () => {
  const files = sourceFiles(MI_DIR);

  it("finds the source files", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("has no U+FFFD replacement characters", () => {
    const hits = files.flatMap((f) =>
      read(f).split("\n").flatMap((line, i) => (line.includes("\uFFFD") ? [`${f}:${i + 1}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it("has no contraction whose apostrophe became '?' (e.g. you?ve, Let?s)", () => {
    const pattern = /[A-Za-z]\?(?:s|t|re|ve|ll|d|m)\b(?!=)/;
    const hits = files.flatMap((f) =>
      read(f).split("\n").flatMap((line, i) => (pattern.test(line) ? [`${f}:${i + 1}: ${line.trim().slice(0, 80)}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it("has no middle dot that became ' ? ' in JSX text (e.g. rounds ? Avg, {a} ? {b})", () => {
    const pattern = /[>}][^<>{}\n]*?\w \? \w[^<>{}\n]*[<{]|\} \? \{/;
    const hits = files.flatMap((f) =>
      read(f).split("\n").flatMap((line, i) => (pattern.test(line) ? [`${f}:${i + 1}: ${line.trim().slice(0, 80)}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it.each([
    ["history/page.tsx", "Loading sessions\u2026"],
    ["report/[sessionId]/page.tsx", "Generating\u2026"],
  ])("%s keeps the ellipsis in %s", (file, text) => {
    expect(read(`${MI_DIR}/${file}`)).toContain(text);
  });
});

// jsdom does not apply media queries, so check the rule itself.
function mediaBlock(css: string, query: string): string {
  const start = css.indexOf(`@media(${query}){`);
  expect(start, `@media(${query}) block`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  throw new Error("unterminated @media block");
}

function lastDisplayFor(block: string, selector: string): string | undefined {
  let display: string | undefined;
  for (const rule of block.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = rule[1].split(",").map((s) => s.trim());
    const decl = rule[2].match(/(?:^|;)\s*display\s*:\s*([^;]+)/);
    if (selectors.includes(selector) && decl) display = decl[1].trim();
  }
  return display;
}

describe("mock-interview sidebar on small screens", () => {
  const css = read("src/app/globals.css");
  const room = '.mi-workspace[data-room="true"] .mi-sidebar';

  it("hides the sidebar in the live room below 1024px (as develop2 did), after every other sidebar rule", () => {
    const below1024 = mediaBlock(css, "max-width:1023px");
    expect(lastDisplayFor(below1024, room)).toBe("none");
    // Later blocks must not bring it back (same specificity: source order wins).
    // Spacing rules for the sidebar's children (.mi-sidebar .mi-logo, nav, ...) are fine;
    // what must not follow is a rule that sets display on the sidebar element itself.
    const start = css.indexOf("@media(max-width:1023px){");
    const after = css.slice(css.indexOf("}}", start) + 2).replace(/\/\*[\s\S]*?\*\//g, "");
    const sidebarSelectors = new Set([".mi-sidebar", room]);
    const reshown = [...after.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, sel, body]) => /(?:^|;)\s*display\s*:/.test(body) && sel.split(",").some((s) => sidebarSelectors.has(s.trim())))
      .map(([, sel]) => sel.trim());
    expect(reshown).toEqual([]);
  });

  it("keeps the sidebar as a top bar on the other mock-interview pages at <=640px", () => {
    const phone = mediaBlock(css, "max-width:640px").replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = phone.match(/(?:^|})\s*\.mi-sidebar\{([^}]*)\}/);
    expect(rule?.[1]).toContain("flex-direction:row");
    expect(rule?.[1]).not.toMatch(/display\s*:\s*none/);
    expect(lastDisplayFor(phone, ".mi-sidebar")).toBeUndefined();
  });
});

let mockPathname = "/mock-interview/live";
let mockHistoryCount = 0;

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  MockInterviewProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMockInterview: () => ({ stageState: { history_count: mockHistoryCount } }),
}));

import MockInterviewLayout from "@/app/(interview)/mock-interview/layout";
import MockSidebar from "@/app/(interview)/mock-interview/_components/MockSidebar";

describe("mock-interview layout marks only the live room", () => {
  beforeEach(() => {
    mockHistoryCount = 0;
  });

  it.each([
    ["/mock-interview/live/session-1", "true"],
    ["/mock-interview/live/starting", null],
    ["/mock-interview/live", null],
    ["/mock-interview/history", null],
  ])("%s -> data-room=%s", (pathname, expected) => {
    mockPathname = pathname;
    const { container } = render(<MockInterviewLayout>{null}</MockInterviewLayout>);
    expect((container.firstChild as HTMLElement).getAttribute("data-room")).toBe(expected);
  });
});

describe("MockSidebar session count", () => {
  it.each([
    [1, "1 session"],
    [3, "3 sessions"],
  ])("history_count %i -> %s", (count, label) => {
    mockPathname = "/mock-interview/live";
    mockHistoryCount = count;
    render(<MockSidebar />);
    expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
  });
});
