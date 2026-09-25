import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// mock-interview/layout.tsx tags every authenticated mock-interview route with
// data-mock-interview="private"; the styles for that surface (tokens, panel
// colours, focus rings, scrollbars) live only in globals.css. If the block is
// dropped while the attribute is still emitted, those routes silently lose
// their styling -- nothing crashes, so only a check like this notices.
const root = path.resolve(__dirname, "../../../../..");
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("mock-interview private surface styles", () => {
  it("globals.css defines a rule for every data-mock-interview value the layout emits", () => {
    const layout = read("src/app/(interview)/mock-interview/layout.tsx");
    const css = read("src/app/globals.css");

    const values = Array.from(layout.matchAll(/data-mock-interview=\{[^}]*?"([a-z-]+)"/g), (m) => m[1]);
    expect(values).toContain("private");

    for (const value of values) {
      expect(css).toContain(`[data-mock-interview="${value}"] {`);
    }
  });
});
