// Status colour tokens (src/styles/status-colors.css, imported by globals.css).
// Compiled with tailwindcss's own compiler, the way @tailwindcss/postcss
// compiles globals.css.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../../../..");
const STATUS_CSS = path.join(ROOT, "src/styles/status-colors.css");

async function compileCss(source: string, from: string) {
  const { compile } = await import("tailwindcss");
  const loadStylesheet = async (id: string, base: string) => {
    const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
    return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
  };
  return compile(source, { base: path.dirname(from), loadStylesheet });
}

const globals = () => {
  const cssPath = path.join(ROOT, "src/app/globals.css");
  return compileCss(readFileSync(cssPath, "utf8"), cssPath);
};
const tailwindDefaults = () => compileCss('@import "tailwindcss";', path.join(ROOT, "src/app/x.css"));
const themeValue = (css: string, name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1].trim();

// Shared Tailwind scales used by ~285 files outside Job Match (resume builder,
// cover letter, payments, ...). The status palette must not recolour them.
const SHARED = ["green", "emerald", "red", "rose"].flatMap((hue) => [50, 200, 500, 700, 950].map((step) => `${hue}-${step}`));

describe("status colours: Tailwind utilities", () => {
  it("generates CSS for the status and brand utilities the Job Match sections use", async () => {
    const compiler = await globals();
    const classes = [
      "bg-success-50", "border-success-200", "text-success-700", "bg-success-700",
      "bg-error-50", "text-error-700", "bg-error-700",
      "bg-warning-50", "border-warning-200", "text-warning-700", "bg-warning-700",
      "bg-info-50", "text-info-700", "bg-info-700",
      "text-jm-brand-600", "bg-jm-brand-600", "bg-jm-brand-700",
    ];
    const css = compiler.build(classes);
    expect(classes.filter((cls) => !css.includes(`.${cls}`))).toEqual([]);
    expect(themeValue(css, "color-success-700")).toBe("#067647");
    expect(themeValue(css, "color-jm-brand-600")).toBe("#155EEF");
  }, 30_000);

  it("leaves the app-wide green / emerald / red / rose scales at Tailwind's defaults", async () => {
    const [app, defaults] = await Promise.all([globals(), tailwindDefaults()]);
    const classes = SHARED.map((c) => `bg-${c}`);
    const appCss = app.build(classes);
    const defaultCss = defaults.build(classes);
    const changed = SHARED.filter((c) => themeValue(appCss, `color-${c}`) !== themeValue(defaultCss, `color-${c}`));
    expect(changed).toEqual([]);
  }, 30_000);

  it("adds new scale names only: no Tailwind default is overridden and nothing outside @theme", async () => {
    const css = readFileSync(STATUS_CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    // One @theme block and nothing else: no :root, toast or other selector rules.
    expect(css).toMatch(/^@theme\s*\{[^{}]*\}$/);
    const names = [...css.matchAll(/(--color-[a-z]+(?:-[a-z]+)*-\d+)\s*:/g)].map((m) => m[1]);
    expect(names).toEqual(expect.arrayContaining(["--color-success-700", "--color-jm-brand-600"]));
    const defaults = (await tailwindDefaults()).build(names.map((n) => `bg-${n.slice("--color-".length)}`));
    expect(names.filter((n) => new RegExp(`${n}:`).test(defaults))).toEqual([]);
  }, 30_000);

  it("its scale names are not already used as classes outside Job Match", () => {
    // A name some other page already uses (e.g. brand-* in the resume builder
    // v2 route) would switch that page's classes on: a visual change outside
    // Job Match. Job Match files may use the scales.
    const css = readFileSync(STATUS_CSS, "utf8");
    const scales = [...new Set([...css.matchAll(/--color-([a-z-]+)-\d+\s*:/g)].map((m) => m[1]))];
    expect(scales).toEqual(expect.arrayContaining(["success", "error", "warning", "info", "jm-brand"]));
    const usage = new RegExp(`(?:^|[\\s"'\`:])-?[a-z]+(?:-[a-z]+)*-(?:${scales.join("|")})-\\d{2,3}\\b`);
    const jobMatch = [/^src\/app\/\(jobs\)\/jobmatch\//, /^src\/lib\/job-match\//, /^src\/app\/\(resume\)\/builder\/creation\/_components\/job\//, /^src\/tests\//];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.(tsx?|jsx?)$/.test(entry.name) && !jobMatch.some((re) => re.test(rel)) && usage.test(readFileSync(path.join(ROOT, rel), "utf8"))) offenders.push(rel);
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});
