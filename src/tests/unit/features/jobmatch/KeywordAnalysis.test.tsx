import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import KeywordAnalysis, { keywordRows } from "@/app/(jobs)/jobmatch/_components/analysis/KeywordAnalysis";

afterEach(cleanup);
const result = {
  Technical_Skills_Check: {matched_critical_skills: [{skill: "Python"}], matched_important_skills: ["React"], missing_critical_skills: [{skill: "Kubernetes"}], missing_important_skills: [{skill: "CI/CD"}]},
  Soft_Skills_Check: {matched_skills: ["react"], missing_skills: ["Communication"]},
};
describe("keyword analysis", () => {
  it("deduplicates keywords and preserves reported missing-skill priorities", () => {
    const rows = keywordRows(result);
    expect(rows).toEqual([
      {keyword: "Python", status: "matched", priority: "Low"},
      {keyword: "React", status: "matched", priority: "Low"},
      {keyword: "Kubernetes", status: "missing", priority: "High"},
      {keyword: "CI/CD", status: "missing", priority: "Medium"},
      {keyword: "Communication", status: "missing", priority: "Not provided"},
    ]);
  });
  it("filters the table without changing the summary counts or inventing partial matches", () => {
    render(<KeywordAnalysis matchResult={result}/>);
    expect(screen.getAllByRole("row")).toHaveLength(6);
    fireEvent.change(screen.getByRole("combobox", {name: "Filter keywords"}), {target: {value: "missing"}});
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.queryByRole("rowheader", {name: "Python"})).toBeNull();
    expect(screen.getByText("Showing 3 of 5 keywords")).toBeTruthy();
    expect(within(screen.getByRole("heading", {name: "Matched Keywords"}).parentElement!).getByText("2")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), {target: {value: "partial"}});
    expect(screen.getByText("Partial matches were not reported by this analysis.")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });
  it("handles empty results and the legacy skill keys", () => {
    expect(keywordRows({Technical_Skills: {matched_critical_skills: ["SQL"]}})[0].keyword).toBe("SQL");
    render(<KeywordAnalysis matchResult={{}}/>);
    expect(screen.getByText("No keywords were returned for this analysis.")).toBeTruthy();
    expect(screen.getByText("Showing 0 keywords")).toBeTruthy();
  });
});
