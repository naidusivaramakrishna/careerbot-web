/**
 * Regression tests for getTopSuggestions (CoverLetterView.tsx).
 *
 * P1 fixed here: "Use more of your relevant experience"
 * (eligible_evidence_usage_pct < 50) was added AFTER "Improve company
 * alignment" and "Add measurable achievements" in the priority list, but
 * getTopSuggestions keeps only the first 2 results (suggestions.slice(0, 2)).
 * Those two generic checks fire on almost every weak letter — exactly the
 * letters where eligible_evidence_usage_pct is likely under 50 — so they
 * filled both slots before the new suggestion was ever reached. It was
 * reachable only on near-perfect letters that happened to still be missing
 * a full 50%+ of relevant evidence, a near-empty intersection.
 *
 * First fix (P1, commit bf29b7f): moved the eligible_evidence_usage_pct
 * check ahead of "Improve company alignment" / "Add measurable
 * achievements". Every test below (except the P2 block at the bottom) uses
 * a base letter that ALSO triggers both of those, to prove the suggestion
 * wins a slot instead of being crowded out by them.
 *
 * P2 found in review of that fix: safe_suggestions and the keyword-coverage
 * tip run BEFORE the eligible_evidence_usage_pct check too, and are
 * unbounded -- two safe_suggestions (or one plus a missing keyword) still
 * fill both slots before it's ever reached. The P1 fix and its tests never
 * caught this because baseLetter() always used safe_suggestions: []. Fixed
 * by giving eligible_evidence_usage_pct a genuinely reserved slot instead
 * of just higher priority: when its condition is true it is always
 * present, as the second of the two returned suggestions, with the single
 * best-priority other candidate as the first.
 */

import { describe, it, expect } from "vitest";
import { getTopSuggestions } from "@/app/cover-letter/_components/CoverLetterView";
import type { CoverLetterResponse } from "@/types/coverLetter";

function baseLetter(overrides: Partial<CoverLetterResponse> = {}): CoverLetterResponse {
  return {
    letter_id: "test-letter-id",
    created_at: "2026-01-01T00:00:00.000000+00:00",
    status: "ready_to_review",
    cover_letter: null,
    plain_text: null,
    generation_status: {
      status: "ready_to_review",
      requires_user_review: true,
    },
    jd_match_matrix: [],
    // Triggers "Improve company alignment" (matchPct < 90).
    jd_match_summary: { jd_match_pct: 60, total: 5, met: 3, partial: 1, missing: 1 },
    keyword_report: {
      used_keywords: [],
      keyword_coverage_pct: 80,
      coverage_explanation: {},
      keyword_counts: {},
      partial_keywords: [],
      missing_keywords: [],
      evidence_usage_pct: 70,
      eligible_evidence_usage_pct: 100,
      readability_score: 80,
      ats_risk: "low",
      keyword_stuffing_score: 0,
      missing_required: [],
      missing_preferred: [],
      safe_suggestions: [],
    },
    // Triggers "Add measurable achievements" (high_confidence_claims < 3).
    grounding: { high_confidence_claims: 1, coverage_status: "sufficient" },
    metadata: {},
    warnings: [],
    reason: null,
    cache_source: "ai",
    ...overrides,
  } as CoverLetterResponse;
}

describe("getTopSuggestions — eligible_evidence_usage_pct visibility (P1 regression)", () => {
  it("shows 'Use more of your relevant experience' at 49% even when company-alignment and measurable-achievements also fire", () => {
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 49,
      },
    });

    const titles = getTopSuggestions(letter).map((s) => s.title);
    expect(titles).toContain("Use more of your relevant experience");
  });

  it("does NOT show the suggestion at exactly 50% (boundary — condition is strictly < 50)", () => {
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 50,
      },
    });

    const titles = getTopSuggestions(letter).map((s) => s.title);
    expect(titles).not.toContain("Use more of your relevant experience");
  });

  it("does NOT show the suggestion when eligible_evidence_usage_pct is null/absent", () => {
    // Genuinely optional per the type (P2 fix: was wrongly typed as
    // required) — simulates an older/partial AI response, e.g. the real
    // needsReview fixture, which predates careerbot-ai PR #310/311/312
    // and has no eligible_evidence_usage_pct key at all.
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: null,
      },
    });

    const titles = getTopSuggestions(letter).map((s) => s.title);
    expect(titles).not.toContain("Use more of your relevant experience");
  });

  it("keeps the result list capped at 2 suggestions", () => {
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 10,
        missing_required: ["Kubernetes"],
      },
    });

    expect(getTopSuggestions(letter)).toHaveLength(2);
  });
});

describe("getTopSuggestions — reserved slot survives an unbounded safe_suggestions list (P2 regression)", () => {
  it("still shows the tip with 2 safe_suggestions AND a missing keyword all present", () => {
    // The exact starving scenario from the review: two safe_suggestions
    // (unbounded, AI-supplied) plus a missing keyword would, under simple
    // priority ordering, fill both slots on their own before
    // eligible_evidence_usage_pct is ever considered.
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 10,
        missing_required: ["Kubernetes"],
        safe_suggestions: [
          { keyword: "Terraform", message: "Mention Terraform where relevant." },
          { keyword: "CI/CD", message: "Mention CI/CD pipelines where relevant." },
        ],
      },
    });

    const result = getTopSuggestions(letter);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.title)).toContain("Use more of your relevant experience");
  });

  it("puts the reserved evidence tip second, and the single best other candidate first", () => {
    const letter = baseLetter({
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 10,
        safe_suggestions: [
          { keyword: "Terraform", message: "Mention Terraform where relevant." },
          { keyword: "CI/CD", message: "Mention CI/CD pipelines where relevant." },
        ],
      },
    });

    const result = getTopSuggestions(letter);
    expect(result.map((s) => s.title)).toEqual([
      'Add "Terraform"',
      "Use more of your relevant experience",
    ]);
  });

  it("does not duplicate the evidence tip into both slots when it is also the only other candidate", () => {
    // No safe_suggestions, no missing keywords, no company/achievements
    // triggers -- the evidence tip is the ONLY candidate. It must appear
    // once, not twice.
    const letter = baseLetter({
      jd_match_summary: { jd_match_pct: 95, total: 5, met: 5, partial: 0, missing: 0 },
      grounding: { high_confidence_claims: 5, coverage_status: "sufficient" },
      keyword_report: {
        ...baseLetter().keyword_report!,
        eligible_evidence_usage_pct: 10,
      },
    });

    const result = getTopSuggestions(letter);
    const evidenceTipCount = result.filter((s) => s.title === "Use more of your relevant experience").length;
    expect(evidenceTipCount).toBe(1);
  });
});
