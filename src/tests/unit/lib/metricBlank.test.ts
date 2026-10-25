/**
 * Which suggested rewrites still ask the user for a number (n%, n+, $n)?
 */
import { describe, it, expect } from "vitest";
import { hasMetricBlank } from "@/lib/job-match/metricBlank";

describe("hasMetricBlank", () => {
  it.each([
    "Collected records to produce data analysis with n% greater reporting coverage.",
    "improving data quality by n%.",
    "Designed backend logic to handle n+ concurrent connections",
    "Cut cloud spend by $n per month",
    "n% faster",
    "Cut load time by N%.",
    "Handle N+ concurrent users",
    "Saved $N per month",
  ])("finds the blank in %s", (text) => {
    expect(hasMetricBlank(text)).toBe(true);
  });

  it.each([
    "Designed an interactive Power BI dashboard with filters and trend views.",
    "Improved reliability by 25% across 3 releases.",
    "Built a REST API with Django and PostgreSQL",
    "Handled an inbox with n-gram search",
    "Ran 20+ concurrent tests",
    "",
  ])("finds no blank in %s", (text) => {
    expect(hasMetricBlank(text)).toBe(false);
  });

  it("is false for anything that is not text", () => {
    expect(hasMetricBlank(undefined)).toBe(false);
    expect(hasMetricBlank(null)).toBe(false);
    expect(hasMetricBlank(42)).toBe(false);
  });
});
