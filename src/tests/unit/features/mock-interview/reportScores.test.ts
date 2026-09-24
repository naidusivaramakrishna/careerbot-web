import { describe, expect, it } from "vitest";
import type { ReportResponse } from "@/api/mockInterviewApi";
import { isPercentScaleReport, normalizeOverallScore, toPercent } from "@/app/(interview)/mock-interview/_lib/reportScores";

const base = (overrides: Record<string, unknown> = {}) =>
  ({ report_id: "r", session_id: "s", user_id: "u", type: "live_hr", answers: [], pressure_tag: null, created_at: "2026-09-24T00:00:00Z", scores: {}, overall_score: 0, ...overrides }) as unknown as ReportResponse;

describe("toPercent", () => {
  it("multiplies 0-10 values and keeps 0-100 values, by the declared scale, never by the value", () => {
    expect(toPercent(3.7, "tenths")).toBe(37);
    expect(toPercent(8, "tenths")).toBe(80);
    // A low 0-100 score must stay low: 8 out of 100 is 8, not 80.
    expect(toPercent(8, "percent")).toBe(8);
    expect(toPercent(1.8, "percent")).toBe(2);
    expect(toPercent(21.6, "percent")).toBe(22);
  });

  it("clamps to 0-100 and treats missing or invalid values as 0", () => {
    expect(toPercent(140, "percent")).toBe(100);
    expect(toPercent(-5, "percent")).toBe(0);
    expect(toPercent(12, "tenths")).toBe(100);
    expect(toPercent(undefined, "percent")).toBe(0);
    expect(toPercent(Number.NaN, "tenths")).toBe(0);
  });
});

describe("isPercentScaleReport / normalizeOverallScore", () => {
  it("recognises a live realtime report by its markers", () => {
    expect(isPercentScaleReport(base({ scores: { hr_score: 8 } }))).toBe(true);
    expect(isPercentScaleReport(base({ weighted_score: 8 }))).toBe(true);
    expect(isPercentScaleReport(base({ score_source: "openai_realtime_text" }))).toBe(true);
    expect(isPercentScaleReport(base({ scores: { overall: 8.1, hr: 8 } }))).toBe(false);
  });

  it("uses a live report's overall_score as sent, even when it is below 10", () => {
    expect(normalizeOverallScore(base({ overall_score: 8, scores: { hr_score: 8 } }))).toBe(8);
    expect(normalizeOverallScore(base({ overall_score: 21.6, weighted_score: 21.6 }))).toBe(21.6);
  });

  it("keeps the 10-or-less rule only for older reports with no live markers", () => {
    expect(normalizeOverallScore(base({ overall_score: 8.1, scores: { overall: 8.1 } }))).toBe(81);
    expect(normalizeOverallScore(base({ overall_score: 84, scores: { overall: 8.4 } }))).toBe(84);
  });
});
