// Job Match landing (bottom sections): guards for the redesigned sections that
// JobMatchHomePage renders below the hero: ResumeEditorSection,
// TestimonialsSection, ComparisonTable, FAQSection, FinalCTASection and
// JobMatchFooter.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean }) => {
    const imgProps = { ...props };
    delete imgProps.priority;
    delete imgProps.unoptimized;
    return React.createElement("img", imgProps);
  },
}));

import FinalCTASection from "@/app/(jobs)/jobmatch/_components/landing/FinalCTASection";
import ResumeEditorSection from "@/app/(jobs)/jobmatch/_components/landing/ResumeEditorSection";
import FAQSection from "@/app/(jobs)/jobmatch/_components/landing/FAQSection";
import JobMatchFooter from "@/app/(jobs)/jobmatch/_components/landing/JobMatchFooter";
import { COMPANY_CONFIG } from "@/config/company";

const ROOT = path.resolve(__dirname, "../../../../..");
const COMPONENTS = path.join(ROOT, "src/app/(jobs)/jobmatch/_components");
const LANDING = path.join(COMPONENTS, "landing");
const read = (file: string) => readFileSync(path.join(LANDING, file), "utf8");

describe("jobmatch landing: the page renders the redesigned bottom sections", () => {
  it("JobMatchHomePage imports every redesigned section", () => {
    const page = readFileSync(path.join(COMPONENTS, "JobMatchHomePage.tsx"), "utf8");
    for (const section of ["ResumeEditorSection", "TestimonialsSection", "ComparisonTable", "FAQSection", "FinalCTASection", "JobMatchFooter"]) {
      expect(page).toMatch(new RegExp(`import ${section} from "\\./landing/${section}"`));
      expect(page).toMatch(new RegExp(`<${section}[\\s/>]`));
    }
  });
});

// ---------------------------------------------------------------------------
// Tailwind: every text/bg utility the page shell uses must generate CSS (the
// type scale is a custom @theme; a missing token compiles to nothing).
// ---------------------------------------------------------------------------
describe("jobmatch landing: Tailwind utilities on the page shell", () => {
  it("generates CSS for every text/bg utility in JobMatchHomePage", async () => {
    const { compile } = await import("tailwindcss");
    const loadStylesheet = async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    };
    const cssPath = path.join(ROOT, "src/app/globals.css");
    const compiler = await compile(readFileSync(cssPath, "utf8"), { base: path.dirname(cssPath), loadStylesheet });
    const source = readFileSync(path.join(COMPONENTS, "JobMatchHomePage.tsx"), "utf8");
    const shape = /^(?:[a-z0-9-]+:)*-?(?:text|bg)-[A-Za-z0-9[\]#/.%_()-]+$/;
    const candidates = [...new Set([...source.matchAll(/className="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((t) => shape.test(t)))];
    expect(candidates).toEqual(expect.arrayContaining(["text-label", "text-body-sm", "hover:bg-[#1F4E98]"]));
    const css = compiler.build(candidates);
    const escape = (cls: string) => cls.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
    expect(candidates.filter((cls) => !css.includes(`.${escape(cls)}`))).toEqual([]);
  }, 30_000);
});

// The landing tests must guard what the page renders: a test that imports or
// reads a section JobMatchHomePage no longer renders passes while the live
// page goes unchecked.
describe("jobmatch landing: the tests cover rendered sections only", () => {
  it("every landing section a jobmatch landing test imports or reads is rendered by JobMatchHomePage", () => {
    const page = readFileSync(path.join(COMPONENTS, "JobMatchHomePage.tsx"), "utf8");
    const tests = ["jobmatchLandingTop.test.tsx", "jobmatchLandingBottom.test.tsx"].map((f) => readFileSync(path.join(__dirname, f), "utf8"));
    const referenced = new Set(tests.flatMap((src) => [
      ...[...src.matchAll(/jobmatch\/_components\/landing\/(\w+)"/g)].map((m) => m[1]),
      ...[...src.matchAll(/"(\w+)\.(?:tsx|module\.css)"/g)].map((m) => m[1]),
    ]));
    expect(referenced.size).toBeGreaterThan(0);
    referenced.delete("JobMatchHomePage");
    expect([...referenced].filter((name) => !new RegExp(`<${name}[\\s/>]`).test(page)).sort()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Assets: every /images/... path a live section references must ship in public/.
// ---------------------------------------------------------------------------
describe("jobmatch landing: referenced images exist", () => {
  it.each(["ResumeEditorSection.tsx", "TestimonialsSection.tsx", "ComparisonTable.tsx", "FAQSection.tsx", "FinalCTASection.tsx"])("%s", (file) => {
    const refs = [...new Set([...read(file).matchAll(/"(\/images\/[^"]+)"/g)].map((m) => m[1]))];
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((ref) => !existsSync(path.join(ROOT, "public", ref)))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Fluid type: each section pins px sizes in a breakpoint block and scales with
// cqw above it. A bare min(Ncqw, Mpx) above the block drops BELOW the pinned
// size (e.g. testimonial quotes 14px at 1250px -> 10.4px at 1251px, footer
// links 16px at 1100px -> 11px at 1101px). The fluid rule must floor at the
// pinned size: clamp(pinned, Ncqw, Mpx).
// ---------------------------------------------------------------------------
function evalLength(expr: string, cqw: number): number {
  const s = expr.trim();
  const fn = /^(min|max|clamp)\((.*)\)$/.exec(s);
  if (fn) {
    const args: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of fn[2]) {
      if (ch === "," && depth === 0) { args.push(cur); cur = ""; continue; }
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      cur += ch;
    }
    args.push(cur);
    const v = args.map((a) => evalLength(a, cqw));
    if (fn[1] === "min") return Math.min(...v);
    if (fn[1] === "max") return Math.max(...v);
    return Math.max(v[0], Math.min(v[1], v[2]));
  }
  const num = /^(-?[\d.]+)(px|cqw)$/.exec(s);
  if (!num) throw new Error(`unsupported length: ${s}`);
  return num[2] === "px" ? Number(num[1]) : (Number(num[1]) * cqw) / 100;
}

type Rules = Map<string, Map<string, string>>;
function parseRules(css: string): Rules {
  const rules: Rules = new Map();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of m[1].split(",").map((x) => x.trim())) {
      const decls = rules.get(selector) ?? new Map<string, string>();
      for (const decl of m[2].split(";")) {
        const i = decl.indexOf(":");
        if (i > 0) decls.set(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
      }
      rules.set(selector, decls);
    }
  }
  return rules;
}

function splitBlocks(css: string): { base: string; blocks: Map<string, string> } {
  const blocks = new Map<string, string>();
  let base = "";
  let i = 0;
  const at = /@(?:container|media)([^{]*)\{/g;
  while (i < css.length) {
    at.lastIndex = i;
    const m = at.exec(css);
    if (!m) { base += css.slice(i); break; }
    base += css.slice(i, m.index);
    let depth = 1;
    let j = at.lastIndex;
    while (depth > 0) { if (css[j] === "{") depth++; if (css[j] === "}") depth--; j++; }
    blocks.set(m[1].trim(), css.slice(at.lastIndex, j - 1));
    i = j;
  }
  return { base, blocks };
}

describe("jobmatch landing: no type / icon size step-down above the pinned breakpoint", () => {
  it.each([
    ["ResumeEditorSection.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251],
    ["TestimonialsSection.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251],
    ["ComparisonTable.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251],
    ["FAQSection.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251],
    ["FinalCTASection.module.css", "(max-width: 1100px)", 1101],
    ["JobMatchFooter.module.css", "(max-width: 1100px)", 1101],
  ])("%s", (file, pinnedBlock, above) => {
    const { base, blocks } = splitBlocks(read(file));
    const pinned = parseRules(blocks.get(pinnedBlock) ?? "");
    const fluid = parseRules(base);
    expect(pinned.size).toBeGreaterThan(0);
    const drops: string[] = [];
    let checked = 0;
    for (const [selector, decls] of pinned) {
      for (const prop of ["font-size", "width", "height"]) {
        const value = decls.get(prop);
        if (!value || !/^[\d.]+px$/.test(value)) continue;
        const fluidValue = fluid.get(selector)?.get(prop);
        if (!fluidValue || !fluidValue.includes("cqw")) continue;
        checked++;
        const next = evalLength(fluidValue, above);
        if (next + 0.01 < parseFloat(value)) drops.push(`${selector} ${prop}: ${value} -> ${next.toFixed(1)}px at ${above}px`);
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(drops).toEqual([]);
  });
});

// Control boxes: the final CTA button and the FAQ rows pin a minimum size in
// the same breakpoint blocks. A bare min(Ncqw, Mpx) let them shrink one pixel
// above it (CTA button 270x56 -> 181x37 at 1101px, FAQ row 52 -> 38px at
// 1251px).
// The capability icons are sized by `.icon img` (24px) inside the pinned block
// but by their own classes above it, so the same-selector check above does
// not see them. Each icon's longer side must not drop below 24px at 1251px.
describe("jobmatch landing: capability icons keep their size above 1250px", () => {
  it.each([".improvementIcon", ".skillIcon", ".editingIcon"])("ResumeEditorSection %s", (selector) => {
    const { base, blocks } = splitBlocks(read("ResumeEditorSection.module.css"));
    const pinned = parseRules(blocks.get("(max-width: 1250px) and (min-width: 1000px)") ?? "").get(".icon img");
    const fluid = parseRules(base).get(selector);
    expect(pinned?.get("width")).toBe("24px");
    const longSide = Math.max(evalLength(fluid?.get("width") as string, 1251), evalLength(fluid?.get("height") as string, 1251));
    expect(longSide).toBeGreaterThanOrEqual(24 - 0.01);
  });
});

describe("jobmatch landing: no control size step-down above the pinned breakpoint", () => {
  it.each([
    ["FinalCTASection.module.css", "(max-width: 1100px)", 1101, ".button"],
    ["FAQSection.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251, ".question"],
    ["FAQSection.module.css", "(max-width: 1250px) and (min-width: 1000px)", 1251, ".open .question"],
  ])("%s %s", (file, pinnedBlock, above, selector) => {
    const { base, blocks } = splitBlocks(read(file));
    const pinned = parseRules(blocks.get(pinnedBlock) ?? "").get(selector);
    const fluid = parseRules(base).get(selector);
    let checked = 0;
    for (const prop of ["min-width", "min-height"]) {
      const value = pinned?.get(prop);
      const fluidValue = fluid?.get(prop);
      if (!value || !fluidValue) continue;
      checked++;
      expect(evalLength(fluidValue, above), `${selector} ${prop}`).toBeGreaterThanOrEqual(parseFloat(value) - 0.01);
    }
    expect(checked).toBeGreaterThan(0);
  });
});

// The testimonial scores are absolutely positioned in the card's bottom
// padding: the padding must hold them (bottom offset + number + label) at
// every width where the fluid rules apply.
describe("jobmatch landing: testimonial scores fit the card's bottom padding", () => {
  it.each([1251, 1400, 1600, 1705, 1797, 1920])("at %ipx", (width) => {
    const fluid = parseRules(splitBlocks(read("TestimonialsSection.module.css")).base);
    const padding = fluid.get(".card")?.get("padding") as string;
    const parts: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of padding) {
      if (ch === " " && depth === 0) { if (cur) parts.push(cur); cur = ""; continue; }
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      cur += ch;
    }
    parts.push(cur);
    const paddingBottom = evalLength(parts[2] ?? parts[0], width);
    const bottom = evalLength(fluid.get(".scores")?.get("bottom") as string, width);
    const strong = fluid.get(".scores strong");
    const span = fluid.get(".scores span");
    const height = evalLength(strong?.get("font-size") as string, width) * Number(strong?.get("line-height"))
      + evalLength(span?.get("font-size") as string, width) * Number(span?.get("line-height"));
    expect(bottom + height).toBeLessThanOrEqual(paddingBottom);
  });
});

// ---------------------------------------------------------------------------
// Rendered sections: CTA wiring, FAQ accordion, one support address.
// ---------------------------------------------------------------------------
describe("jobmatch landing: rendered sections", () => {
  it("final CTA and 'Tailor My Resume' call onAnalyzeClick", () => {
    const onAnalyzeClick = vi.fn();
    render(<FinalCTASection onAnalyzeClick={onAnalyzeClick} />);
    fireEvent.click(screen.getByRole("button", { name: /check my resume/i }));
    render(<ResumeEditorSection onAnalyzeClick={onAnalyzeClick} />);
    fireEvent.click(screen.getByRole("button", { name: /tailor my resume/i }));
    expect(onAnalyzeClick).toHaveBeenCalledTimes(2);
  });

  it("FAQ opens one answer at a time and keeps aria-expanded / hidden in sync", () => {
    render(<FAQSection />);
    const first = screen.getByRole("button", { name: /what is careerbot job match/i });
    const second = screen.getByRole("button", { name: /how does the match score work/i });
    const answer = (button: HTMLElement) => document.getElementById(button.getAttribute("aria-controls") as string) as HTMLElement;
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(answer(first)).not.toHaveAttribute("hidden");
    expect(answer(second)).toHaveAttribute("hidden");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(answer(first)).toHaveAttribute("hidden");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(answer(second)).toHaveAttribute("hidden");
  });

  it("the FAQ help card and the footer link the same support address", () => {
    const mailto = `mailto:${COMPANY_CONFIG.supportEmail}`;
    const { unmount } = render(<FAQSection />);
    expect(screen.getByRole("link", { name: /still need help/i })).toHaveAttribute("href", mailto);
    unmount();
    render(<JobMatchFooter />);
    const footerMailtos = screen.getAllByRole("link").map((a) => a.getAttribute("href")).filter((href) => href?.startsWith("mailto:"));
    expect(footerMailtos.length).toBeGreaterThan(0);
    expect(new Set(footerMailtos)).toEqual(new Set([mailto]));
  });
});
