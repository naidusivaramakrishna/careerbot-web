// Results overview + detailed analysis: one score-band definition, readable
// progress values, and every type-scale variable the result views read exists.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnalysisContent from "@/app/(jobs)/jobmatch/_components/analysis/AnalysisContent";
import MatchResultsOverview from "@/app/(jobs)/jobmatch/_components/analysis/MatchResultsOverview";

vi.mock("@/api/parserApi", () => ({ matcherEnhanceApply: vi.fn(), matcherEnhanceRemove: vi.fn(), matcherUpdateSections: vi.fn(), downloadResumePdf: vi.fn() }));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/ResumePreview", () => ({ default: () => <div>Resume document</div> }));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

const ROOT = path.resolve(__dirname, "../../../../..");

describe("type-scale variables", () => {
  it("every var(--text-*) a Job Match CSS module reads is defined in the typography theme", () => {
    const theme = readFileSync(path.join(ROOT, "src/styles/jobmatch-typography.css"), "utf8");
    const defined = new Set([...theme.matchAll(/(--text-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const missing = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (entry.name.endsWith(".module.css")) {
          for (const m of readFileSync(file, "utf8").matchAll(/var\((--text-[a-z0-9-]+)/g)) {
            if (!defined.has(m[1])) missing.add(`${path.relative(ROOT, file)}: ${m[1]}`);
          }
        }
      }
    };
    walk(path.join(ROOT, "src/app/(jobs)/jobmatch/_components"));
    expect([...missing]).toEqual([]);
  });
});

describe("type-scale variables reach the built CSS", () => {
  // Tailwind emits a theme variable only when the scanned sources use it. The
  // results views read --text-overline / --text-score only from .module.css
  // files: the oxide scanner (what @tailwindcss/postcss runs) extracts them
  // from there, and the compiled globals.css then defines them on :root.
  it("the scanner finds them in the CSS modules and the build emits their values", async () => {
    const { Scanner } = await import("@tailwindcss/oxide");
    const analysis = path.join(ROOT, "src/app/(jobs)/jobmatch/_components/analysis");
    const candidates = new Scanner({ sources: [{ base: analysis, pattern: "*.module.css", negated: false }] }).scan();
    expect(candidates).toEqual(expect.arrayContaining(["--text-overline", "--text-overline--font-weight", "--text-score"]));
    const { compile } = await import("tailwindcss");
    const loadStylesheet = async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(ROOT, "node_modules/tailwindcss/index.css") : path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    };
    const cssPath = path.join(ROOT, "src/app/globals.css");
    const compiler = await compile(readFileSync(cssPath, "utf8"), { base: path.dirname(cssPath), loadStylesheet });
    const css = compiler.build(candidates);
    expect(css).toMatch(/--text-overline:\s*12px/);
    expect(css).toMatch(/--text-overline--font-weight:\s*600/);
    expect(css).toMatch(/--text-score:\s*34px/);
  }, 30_000);
});

describe("score bands", () => {
  const overview = (score: number, rows: Record<string, unknown> = {}) => render(
    <MatchResultsOverview matchResults={{ data: { ats_score: score, match_result: rows } }} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={vi.fn()} onBack={vi.fn()} />
  );
  const detailed = (score: number) => render(
    <AnalysisContent
      jdText="A role requiring React."
      onBackToUpload={vi.fn()}
      parsedResumeData={{ id: "resume-test", filename: "Resume.pdf", parsed_data: { contact: { name: "Test Candidate" }, skills: ["React"] } }}
      matchResults={{ data: { id: "match-test", ats_score: score, resume_id: "resume-test", match_result: {} } }}
    />
  );

  it("progress bars announce the band name, not a colour", () => {
    overview(78, { Technical_Skills_Check: { match_score: 85 }, Job_Title_Check: { match_score: 52 }, Education_Check: { execution_failed: true } });
    const valueText = (label: string) => screen.getByRole("progressbar", { name: `${label} match score` }).getAttribute("aria-valuetext");
    expect(valueText("Technical Skills")).toBe("85% - Strong match");
    expect(valueText("Job Title Match")).toBe("52% - Needs work");
    expect(valueText("Education")).toBe("Unavailable");
  });

  it.each([
    [52, "Needs work"],
    [67, "Fair match"],
    [75, "Good match"],
    [90, "Strong match"],
  ])("overview and detailed analysis show the same band for %s", (score, label) => {
    overview(score);
    expect(screen.getByRole("heading", { name: label })).toBeTruthy();
    cleanup();
    detailed(score);
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });
});

describe("report actions", () => {
  it("the overview button says it opens the report (it does not download by itself)", () => {
    render(<MatchResultsOverview matchResults={{ data: { ats_score: 67 } }} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /download report/i })).toBeNull();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    screen.getByRole("button", { name: /view report/i }).click();
    expect(open).toHaveBeenCalledOnce();
    open.mockRestore();
  });

  it("the report preview's Download PDF button saves the PDF export", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const pdf = await import("@/app/(jobs)/jobmatch/_components/analysis/matchReportPdf");
    const create = vi.spyOn(pdf, "createMatchReportPdf").mockReturnValue({ save } as unknown as ReturnType<typeof pdf.createMatchReportPdf>);
    const { openMatchReportPreview } = await import("@/app/(jobs)/jobmatch/_components/analysis/matchReportPrint");
    const doc = document.implementation.createHTMLDocument();
    const preview = { document: doc, print: vi.fn(), focus: vi.fn(), close: vi.fn(), opener: window };
    const open = vi.spyOn(window, "open").mockReturnValue(preview as unknown as Window);
    openMatchReportPreview({ data: { ats_score: 67 } }, "Resume.pdf", "Role.txt");
    const button = doc.getElementById("download-report") as HTMLButtonElement;
    expect(button.textContent).toMatch(/download pdf/i);
    button.click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith("CareerBOT-match-report.pdf", { returnPromise: true }));
    expect(create).toHaveBeenCalledWith({ data: { ats_score: 67 } }, "Resume.pdf", "Role.txt");
    expect(preview.print).not.toHaveBeenCalled();
    open.mockRestore();
    create.mockRestore();
  });

  it("score bars and the band chip carry their colour inline, so they never render blank", () => {
    render(<MatchResultsOverview matchResults={{ data: { ats_score: 90, match_result: { Technical_Skills_Check: { match_score: 52 } } } }} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={vi.fn()} onBack={vi.fn()} />);
    const bar = screen.getByRole("progressbar", { name: "Technical Skills match score" }).firstElementChild as HTMLElement;
    expect(bar.style.backgroundColor).toBe("rgb(180, 35, 24)"); // #B42318, needs work
    const chip = screen.getByRole("heading", { name: "Strong match" });
    expect(chip.style.color).toBe("rgb(6, 118, 71)"); // #067647
    expect(chip.style.backgroundColor).toBe("rgb(236, 253, 243)"); // #ECFDF3
  });

  it("View Detailed Analysis passes no tab; each file card opens its own tab of the detailed analysis", () => {
    const onDetails = vi.fn();
    render(<MatchResultsOverview matchResults={{ data: { ats_score: 67 } }} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={onDetails} onBack={vi.fn()} />);
    screen.getByRole("button", { name: "View Detailed Analysis" }).click();
    screen.getByRole("button", { name: /view your resume in detailed analysis/i }).click();
    screen.getByRole("button", { name: /view job description in detailed analysis/i }).click();
    expect(onDetails.mock.calls).toEqual([[], ["resume"], ["jd"]]);
  });
});

describe("the job description lands on the report page", () => {
  it("the detailed analysis opened on the jd tab shows the job description text", () => {
    const { container } = render(
      <AnalysisContent
        jdText="A role requiring React."
        initialPreviewTab="jd"
        onBackToUpload={vi.fn()}
        parsedResumeData={{ id: "resume-test", filename: "Resume.pdf", parsed_data: { contact: { name: "Test Candidate" }, skills: ["React"] } }}
        matchResults={{ data: { id: "match-test", ats_score: 70, resume_id: "resume-test", match_result: {} } }}
      />
    );
    expect(container.textContent).toContain("A role requiring");
  });
});

describe("routes", () => {
  it("adds no catch-all /jobmatch/app/[...view] page (nothing links to it; it would answer 200 for any path)", () => {
    expect(existsSync(path.join(ROOT, "src/app/(jobs)/jobmatch/app/[...view]/page.tsx"))).toBe(false);
  });
});
