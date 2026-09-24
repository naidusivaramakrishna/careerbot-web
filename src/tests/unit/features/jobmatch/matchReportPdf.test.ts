import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createMatchReportPdf } from "@/app/(jobs)/jobmatch/_components/analysis/matchReportPdf";

describe("match report PDF", () => {
  it("creates a valid PDF with the existing score and report metadata", async () => {
    const input = {data: {ats_score: 49.5, match_result: {Soft_Skills_Check: {match_score: 66.7, matched_skills: ["Communication"]}}}};
    const before = JSON.stringify(input);
    const report = createMatchReportPdf(input, "Resume.pdf", "Role.txt");
    const bytes = report.output("arraybuffer");
    expect(report.output()).toContain("%PDF-");
    expect(report.output()).toContain("49.5%");
    expect(report.output()).toContain("Communication");
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getTitle()).toBe("CareerBOT Match Report");
    // The breakdown lists every category, so even a minimal report may run onto
    // a second page; what matters is that the footer agrees with the real count.
    const pages = parsed.getPageCount();
    expect(pages).toBeGreaterThanOrEqual(1);
    expect(report.output()).toContain(`Page ${pages} of ${pages}`);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("paginates long skill lists and preserves their final entries", async () => {
    const skills = Array.from({length: 450}, (_, index) => `Required technical skill ${index}`);
    const report = createMatchReportPdf({data: {match_result: {Soft_Skills_Check: {missing_skills: skills}}}}, "Long resume filename ".repeat(20), "Job description");
    const parsed = await PDFDocument.load(report.output("arraybuffer"));
    expect(parsed.getPageCount()).toBeGreaterThan(1);
    expect(report.output()).toContain("449");
    expect(report.output()).toContain(`Page ${parsed.getPageCount()} of ${parsed.getPageCount()}`);
  });
});
