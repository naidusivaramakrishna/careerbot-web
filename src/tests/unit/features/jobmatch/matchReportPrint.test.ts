import { afterEach, describe, expect, it, vi } from "vitest";
import { matchReportHtml, openMatchReportPreview } from "@/app/(jobs)/jobmatch/_components/analysis/matchReportPrint";

afterEach(() => { vi.restoreAllMocks(); });
const results = {data: {ats_score: 34.5, match_result: {
  Technical_Skills_Check: {match_score: 0, matched_critical_skills: [{skill: "React"}], missing_critical_skills: [{skill: "SQL"}]},
  Soft_Skills_Check: {execution_failed: true, match_score: 0},
}}};

describe("print report preview", () => {
  it("uses actual scores and skills, preserves unavailable results, and escapes report data", () => {
    const html = matchReportHtml(results, '<img src=x onerror="alert(1)">', "Role & Company");
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector("img,script")).toBeNull();
    expect(doc.body.textContent).toContain('Resume: <img src=x onerror="alert(1)">');
    expect(doc.body.textContent).toContain("Role & Company");
    expect(doc.body.textContent).toContain("34.5%");
    const rows = Array.from(doc.querySelectorAll("tr"));
    expect(rows.find(row => row.textContent?.includes("Technical Skills"))?.textContent).toContain("0%");
    expect(rows.find(row => row.textContent?.includes("Soft Skills"))?.textContent).toContain("Not evaluated");
    expect(doc.querySelector(".success")?.parentElement?.textContent).toContain("React");
    expect(doc.querySelector(".missing")?.parentElement?.textContent).toContain("SQL");
    expect(html).toContain("print-color-adjust:exact");
    expect(html).toContain("@page{size:A4 portrait");
  });
  it("opens a preview without printing, prints only on click, and allows closing", () => {
    const doc = document.implementation.createHTMLDocument();
    const preview = {document: doc, print: vi.fn(), focus: vi.fn(), close: vi.fn(), opener: window};
    vi.spyOn(window, "open").mockReturnValue(preview as unknown as Window);
    openMatchReportPreview(results, "Resume.pdf", "Role");
    expect(preview.opener).toBeNull();
    expect(preview.print).not.toHaveBeenCalled();
    doc.getElementById("print-report")?.click();
    expect(preview.print).toHaveBeenCalledOnce();
    doc.getElementById("close-report")?.click();
    expect(preview.close).toHaveBeenCalledOnce();
  });
  it("reports blocked popups so the caller can explain how to retry", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(() => openMatchReportPreview({}, "Resume", "Role")).toThrow("Preview blocked");
  });
});
