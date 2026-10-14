// Resume editor / skills cards restyle: TokenPill class list and the Tailwind
// utilities the restyled resume, skills and highlighter components use.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TokenPill from "@/app/(jobs)/jobmatch/_components/skills/TokenPill";

afterEach(cleanup);

const ROOT = path.resolve(__dirname, "../../../../..");
const COMPONENTS = path.join(ROOT, "src/app/(jobs)/jobmatch/_components");

describe("TokenPill", () => {
  const classes = (name: RegExp) => screen.getByRole("button", { name }).className.split(/\s+/).filter(Boolean);

  it.each([
    [false, /^add react$/i, ["bg-white", "border-[#EAECF0]"]],
    [true, /^added react$/i, ["bg-success-50", "border-success-200"]],
  ])("matched=%s keeps whole class tokens (border width, background, transform)", (matched, name, stateClasses) => {
    render(<TokenPill label="React" matched={matched} onToggle={vi.fn()} onRemove={vi.fn()} />);
    const list = classes(name);
    expect(list).toEqual(expect.arrayContaining(["transform", "border-2", "rounded-full", ...stateClasses]));
    expect(list.filter((c) => c === "text-label")).toHaveLength(1);
    expect(list.filter((c) => c.includes("text-label") && c !== "text-label")).toEqual([]);
  });
});

describe("resume editor restyle: hover feedback", () => {
  it.each(["resume/JobMatchSectionEditor.tsx", "resume/JobMatchTemplateThree.tsx", "resume/ResumeHeader.tsx", "resume/ResumePreview.tsx"])("%s: no hover colour equals its base colour", (file) => {
    const source = readFileSync(path.join(COMPONENTS, file), "utf8");
    const noOps: string[] = [];
    for (const m of source.matchAll(/"([^"\n]*)"/g)) {
      const classes = m[1].split(/\s+/);
      for (const cls of classes) {
        const hover = /^hover:((?:bg|text|border)-.+)$/.exec(cls);
        if (hover && classes.includes(hover[1])) noOps.push(cls);
      }
    }
    expect(noOps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tailwind: every text/bg/border utility in the restyled files must generate
// CSS. success-* / warning-* / jm-brand-* come from src/styles/status-colors.css
// (the status-colors PR, which merges first); until it is on the branch this
// check is skipped.
// ---------------------------------------------------------------------------
const UTILITY_SHAPE = /^(?:[a-z0-9-]+:)*-?(?:text|bg|border|from|to|via|ring)-[A-Za-z0-9[\]#/.%_()-]+$/;
const FILES = [
  "resume/JobMatchSectionEditor.tsx", "resume/JobMatchTemplate.tsx", "resume/JobMatchTemplateThree.tsx",
  "resume/ResumeHeader.tsx", "resume/ResumePreview.tsx", "skills/ListSection.tsx", "skills/MissingSoftSkillsCard.tsx",
  "skills/MissingTechnicalSkillsCard.tsx", "skills/TokenPill.tsx", "highlighter/JDHeader.tsx", "highlighter/JDHighlighter.tsx",
];
const hasStatusColors = existsSync(path.join(ROOT, "src/styles/status-colors.css"));

describe("resume editor restyle: Tailwind utilities", () => {
  it.skipIf(!hasStatusColors)("generates CSS for every text/bg/border utility in the restyled files", async () => {
    const { compile } = await import("tailwindcss");
    const loadStylesheet = async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    };
    const cssPath = path.join(ROOT, "src/app/globals.css");
    const compiler = await compile(readFileSync(cssPath, "utf8"), { base: path.dirname(cssPath), loadStylesheet });
    const escapeClass = (cls: string) => cls.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
    const missing: string[] = [];
    for (const file of FILES) {
      const source = readFileSync(path.join(COMPONENTS, file), "utf8");
      const literals = [...source.matchAll(/"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]);
      const candidates = [...new Set(literals.flatMap((lit) => lit.replace(/\$\{[^}]*\}/g, " ").split(/\s+/)).filter((t) => UTILITY_SHAPE.test(t)))];
      const css = compiler.build(candidates);
      for (const cls of candidates) if (!css.includes(`.${escapeClass(cls)}`)) missing.push(`${file}: ${cls}`);
    }
    expect(missing).toEqual([]);
  }, 60_000);
});
