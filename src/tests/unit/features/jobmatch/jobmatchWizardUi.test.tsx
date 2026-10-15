// Job Match start card + wizard redesign: analysis notice copy, minimum text
// size in the wizard / start-card styles, and the Tailwind utilities the
// shared ui primitives use.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoadingAnimation from "@/app/(jobs)/jobmatch/_components/ui/LoadingAnimation";
import Tab from "@/app/(jobs)/jobmatch/_components/ui/Tab";
import WizardStepJobDescription from "@/app/(jobs)/jobmatch/_components/wizard/WizardStepJobDescription";

const ROOT = path.resolve(__dirname, "../../../../..");
const COMPONENTS = path.join(ROOT, "src/app/(jobs)/jobmatch/_components");
const read = (file: string) => readFileSync(path.join(COMPONENTS, file), "utf8");

describe("analysis notice (wizard step 4)", () => {
  // The analysis runs in the browser (Overview.tsx awaits resolve resume ->
  // resolve JD -> matchWithRetry) and step 4 has no close, Escape or overlay
  // exit, so the notice must not tell the user they can leave.
  it.each(["parsing", "matching", "generating"] as const)("asks the user to keep the window open (%s)", (stage) => {
    render(<LoadingAnimation stage={stage} />);
    expect(screen.getByText(/keep this window open/i)).toBeInTheDocument();
    expect(screen.queryByText(/you can leave/i)).toBeNull();
    expect(screen.queryByText(/notify you/i)).toBeNull();
  });
});

// The uploaded-JD row says "Text extracted" only when extraction succeeded:
// Overview.handleJDFileUpload keeps the file and sets `error` when
// parseJDFile throws, so the row must not claim success next to that error.
describe("uploaded JD status (wizard step 2)", () => {
  const jd = () => new File(["%PDF"], "jd.pdf", { type: "application/pdf" });
  const props = { jdText: "", onTextChange: () => undefined, onFileSelected: () => undefined, onClear: () => undefined };

  it("does not say the text was extracted when extraction failed", () => {
    render(<WizardStepJobDescription {...props} jdFile={jd()} isExtractingJd={false}
      error="Failed to extract text from this file. You can still continue — it will be parsed during analysis." />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to extract/i);
    expect(screen.queryByText(/text extracted/i)).toBeNull();
  });

  it("says the text was extracted after a successful upload (control)", () => {
    render(<WizardStepJobDescription {...props} jdFile={jd()} isExtractingJd={false} error={null} />);
    expect(screen.getByText(/text extracted/i)).toBeInTheDocument();
  });

  it("shows only the progress text while extracting", () => {
    render(<WizardStepJobDescription {...props} jdFile={jd()} isExtractingJd error={null} />);
    expect(screen.getByText("Extracting text...")).toBeInTheDocument();
    expect(screen.queryByText(/text extracted/i)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Text size: nothing readable below 11px (the size of the dialogs' own labels).
// The only exception is the "PDF" tag drawn inside a file icon.
// ---------------------------------------------------------------------------
function fontSizes(css: string): { selector: string; px: number }[] {
  const out: { selector: string; px: number }[] = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(?:container|media)[^{]*\{/g, "");
  for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const size = /font-size:\s*([\d.]+)(px|rem)/.exec(m[2]);
    if (size) out.push({ selector: m[1].trim(), px: Number(size[1]) * (size[2] === "rem" ? 16 : 1) });
  }
  return out;
}

describe("wizard and start-card styles: minimum text size", () => {
  it.each(["wizard/WizardUpload.module.css", "ui/LoadingAnimation.module.css", "wizard/JobMatchStartCard.module.css"])("%s", (file) => {
    const sizes = fontSizes(read(file));
    expect(sizes.length).toBeGreaterThan(0);
    const tiny = sizes.filter(({ selector, px }) => px < 11 && !/\.pdfTag\b/.test(selector)).map(({ selector, px }) => `${selector}: ${px}px`);
    expect(tiny).toEqual([]);
  });
});

describe("ui primitives: Tailwind utilities", () => {
  it("Tab sets its font size once (text-label), so the result does not depend on CSS order", () => {
    const { container } = render(<Tab label="Resume" active onClick={() => undefined} />);
    const classes = (container.querySelector("button") as HTMLButtonElement).className.split(/\s+/);
    const fontSize = classes.filter((c) => /^text-(xs|sm|base|lg|xl|label|body|body-sm|h[1-3])$/.test(c));
    expect(fontSize).toEqual(["text-label"]);
  });

  it("generates CSS for the type-scale utilities Card and Tab use", async () => {
    const { compile } = await import("tailwindcss");
    const loadStylesheet = async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    };
    const cssPath = path.join(ROOT, "src/app/globals.css");
    const compiler = await compile(readFileSync(cssPath, "utf8"), { base: path.dirname(cssPath), loadStylesheet });
    const css = compiler.build(["text-h3", "text-label"]);
    expect(css).toMatch(/\.text-h3\s*\{/);
    expect(css).toMatch(/\.text-label\s*\{/);
  }, 30_000);
});

describe("neutral theme (jobmatch/neutral-theme.css)", () => {
  const css = readFileSync(path.join(ROOT, "src/app/(jobs)/jobmatch/neutral-theme.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

  it("only sets variables inside .jobmatchTheme rules", () => {
    const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*--[a-z]/g)].map((m) => m[1].trim());
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((s) => s !== ".jobmatchTheme")).toEqual([]);
  });

  it("recolours the Job Match blue as jm-brand, not brand-* (used by the resume builder v2 route)", () => {
    expect(css).toMatch(/--color-jm-brand-600:\s*#2557A7/);
    expect(css).not.toMatch(/--color-brand-\d/);
  });

  // The theme wraps the whole route (layout.tsx), including the resume
  // templates, so an override must keep each shade distinct and in order:
  // a "bg-blue-500 hover:bg-blue-600" pair must still change colour on hover,
  // and text-gray-800 must stay lighter than text-gray-900.
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const scales = new Map<string, { step: number; hex: string }[]>();
  for (const m of css.matchAll(/--color-(gray|slate|zinc|neutral|blue)-(\d+):\s*(#[0-9a-fA-F]{6})/g)) {
    scales.set(m[1], [...(scales.get(m[1]) ?? []), { step: Number(m[2]), hex: m[3].toUpperCase() }]);
  }

  it("overrides the gray, slate, zinc, neutral and blue scales", () => {
    expect([...scales.keys()].sort()).toEqual(["blue", "gray", "neutral", "slate", "zinc"]);
  });

  it.each(["gray", "slate", "zinc", "neutral", "blue"])("keeps every %s step distinct and darker than the one before", (scale) => {
    const steps = [...(scales.get(scale) ?? [])].sort((a, b) => a.step - b.step);
    const out = steps.slice(1).map((s, i) => [steps[i], s] as const)
      .filter(([prev, s]) => !(luminance(s.hex) < luminance(prev.hex)))
      .map(([prev, s]) => `${scale}-${prev.step} ${prev.hex} -> ${scale}-${s.step} ${s.hex}`);
    expect(out).toEqual([]);
  });

  it("keeps the brand anchors (blue-600 = jm-brand-600, gray-900 = body text)", () => {
    expect(scales.get("blue")?.find((s) => s.step === 600)?.hex).toBe("#2557A7");
    expect(scales.get("gray")?.find((s) => s.step === 900)?.hex).toBe("#101828");
  });
});

// ---------------------------------------------------------------------------
// Static assets: every /images/... file the start card and wizard reference
// must exist under public/ (a missing file renders a broken image).
// ---------------------------------------------------------------------------
describe("Job Match start card and wizard: referenced images exist", () => {
  const files = ["wizard/JobMatchStartCard.tsx", "wizard/WizardStepResume.tsx", "wizard/WizardStepJobDescription.tsx", "wizard/WizardStepConfirm.tsx", "wizard/WizardModalShell.tsx"];
  it.each(files)("%s", (file) => {
    const refs = [...read(file).matchAll(/["'(](\/images\/[^"')]+)["')]/g)].map((m) => m[1]);
    const missing = refs.filter((ref) => !existsSync(path.join(ROOT, "public", decodeURI(ref))));
    expect(missing).toEqual([]);
  });

  it("the start-card hero is a referenced image (control)", () => {
    expect(read("wizard/JobMatchStartCard.tsx")).toContain('src="/images/Job match hero image.svg"');
  });
});
