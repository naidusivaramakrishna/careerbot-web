// Job Match landing (top sections): guards for the redesign in
// src/app/(jobs)/jobmatch/_components/landing. JobMatchHomePage renders
// HeroSection, ThreeStepsSection and MatchInsightsSection; the bottom sections
// are covered by jobmatchLandingBottom.test.tsx.
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

// Plain elements instead of framer-motion: the previews then render at once.
vi.mock("framer-motion", () => {
  const MOTION_PROPS = ["initial", "animate", "exit", "transition", "whileInView", "whileHover", "whileTap", "viewport", "layoutId", "layout", "variants"];
  const cache = new Map<string, React.FC<Record<string, unknown>>>();
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        const Comp: React.FC<Record<string, unknown>> = (props) => {
          const rest = { ...props };
          for (const key of MOTION_PROPS) delete rest[key];
          return React.createElement(tag, rest);
        };
        cache.set(tag, Comp);
      }
      return cache.get(tag);
    },
  });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) };
});

import HeroSection from "@/app/(jobs)/jobmatch/_components/landing/HeroSection";

const ROOT = path.resolve(__dirname, "../../../../..");
const LANDING = path.join(ROOT, "src/app/(jobs)/jobmatch/_components/landing");
const read = (file: string) => readFileSync(path.join(LANDING, file), "utf8");

// ---------------------------------------------------------------------------
// Tailwind type scale: text-h1 / text-body-sm / ... are not Tailwind defaults;
// with no @theme for them the classes compile to nothing. The rendered landing
// sections style text with CSS modules; the page shell's utilities are checked
// in jobmatchLandingBottom.test.tsx.
// ---------------------------------------------------------------------------
describe("jobmatch landing: Tailwind type scale", () => {
  it("defines the type-scale tokens the landing uses", async () => {
    // tailwindcss's own compiler (a declared dependency), resolving @import the
    // way @tailwindcss/postcss does for this file.
    const { compile } = await import("tailwindcss");
    const loadStylesheet = async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    };
    const cssPath = path.join(ROOT, "src/app/globals.css");
    const compiler = await compile(readFileSync(cssPath, "utf8"), { base: path.dirname(cssPath), loadStylesheet });
    // The scale itself: text-body-sm is 14px / 20px, text-h2 is bold.
    const css = compiler.build(["text-body-sm", "text-h2"]);
    expect(css).toMatch(/--text-body-sm:\s*14px/);
    expect(css).toMatch(/--text-h2--font-weight:\s*700/);
  }, 30_000);
});

// ---------------------------------------------------------------------------
// Assets: every /images/... path the sections reference must ship in public/.
// They come from the landing-assets PR (#218), which has to merge first.
// ---------------------------------------------------------------------------
describe("jobmatch landing: referenced images exist", () => {
  it.each(["HeroSection.tsx", "ThreeStepsSection.tsx", "MatchInsightsSection.tsx"])("%s", (file) => {
    const refs = [...new Set([...read(file).matchAll(/"(\/images\/[^"]+)"/g)].map((m) => m[1]))];
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((ref) => !existsSync(path.join(ROOT, "public", ref)))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Container-query typography: above 1250px the sizes scale with cqw again, so
// a bare min(Ncqw, Mpx) drops BELOW the size the 1000-1250px rule pins
// (e.g. hero trust items 12px at 1250px -> 10.4px at 1251px).
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

function splitContainerBlocks(css: string): { base: string; blocks: Map<string, string> } {
  const blocks = new Map<string, string>();
  let base = "";
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@container", i);
    if (at < 0) { base += css.slice(i); break; }
    base += css.slice(i, at);
    const open = css.indexOf("{", at);
    let depth = 1;
    let j = open + 1;
    while (depth > 0) { if (css[j] === "{") depth++; if (css[j] === "}") depth--; j++; }
    blocks.set(css.slice(at + "@container".length, open).trim(), css.slice(open + 1, j - 1));
    i = j;
  }
  return { base, blocks };
}

const TYPE_PROPS = ["font-size", "width", "height"];
const PINNED = "(max-width: 1250px) and (min-width: 1000px)";

describe("jobmatch landing: no type-size step-down above 1250px", () => {
  it.each(["HeroSection.module.css", "ThreeStepsSection.module.css", "MatchInsightsSection.module.css"])("%s", (file) => {
    const { base, blocks } = splitContainerBlocks(read(file));
    const pinned = parseRules(blocks.get(PINNED) ?? "");
    const fluid = parseRules(base);
    expect(pinned.size).toBeGreaterThan(0);
    const drops: string[] = [];
    for (const [selector, decls] of pinned) {
      for (const [prop, value] of decls) {
        if (!TYPE_PROPS.includes(prop) || !/^[\d.]+px$/.test(value)) continue;
        if (prop !== "font-size" && !/(img|svg|\.icon|\.number)/.test(selector)) continue;
        const above = fluid.get(selector)?.get(prop);
        if (!above || !above.includes("cqw")) continue;
        const at1251 = evalLength(above, 1251);
        if (at1251 + 0.01 < parseFloat(value)) drops.push(`${selector} ${prop}: ${value} at 1250px -> ${at1251.toFixed(1)}px at 1251px`);
      }
    }
    expect(drops).toEqual([]);
  });

  it("keeps the hero heading at least 32px where the two-column layout starts (1000px)", () => {
    const { base, blocks } = splitContainerBlocks(read("HeroSection.module.css"));
    const heading = parseRules(blocks.get(PINNED) ?? "").get(".heading")?.get("font-size")
      ?? parseRules(base).get(".heading")?.get("font-size");
    expect(heading).toBeDefined();
    expect(evalLength(heading as string, 1000)).toBeGreaterThanOrEqual(32);
    // control: the single-column rule below 1000px already floors at 32px
    expect(evalLength(parseRules(blocks.get("(max-width: 999px)") ?? "").get(".heading")?.get("font-size") as string, 500)).toBe(32);
  });
});

// ---------------------------------------------------------------------------
// Live hero: CTA wiring.
// ---------------------------------------------------------------------------
describe("jobmatch landing: rendered sections", () => {
  it("hero CTA calls onAnalyzeClick and the heading labels the section", () => {
    const onAnalyzeClick = vi.fn();
    render(<HeroSection onAnalyzeClick={onAnalyzeClick} />);
    fireEvent.click(screen.getByRole("button", { name: /check my resume/i }));
    expect(onAnalyzeClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("region", { name: /check your resume/i })).toBeInTheDocument();
  });
});
