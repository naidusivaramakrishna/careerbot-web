import { describe, expect, it } from "vitest";
import { buildAtsReport, buildEnhancerFixUrl, bandFor, groupByImpact, IMPACT_LABEL, IMPACT_ORDER } from "@/app/(resume)/atslogin/report/atsReportModel";

// Shape the backend stores after a scan (careerbot-ai /enhance/resume, adapted by careerbot-api).
const scan = () => ({
  resume_id: "src-1",
  enhanced_resume_id: "enh-1",
  ats_display: {
    score: 61.4,
    sections: [
      {
        name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false,
        fixes: [{ id: "contact_issue_0", section: "Contact", fix_type: "manual", impact: "low", rank: 5, penalty_pts: 1.4,
                  before_example: null, after_example: null, reason: "Missing LinkedIn profile" }],
      },
      {
        name: "Summary", score_pct: 40, weighted_pts: 2.8, max_pts: 7, is_not_applicable: false,
        fixes: [
          { penalty_pts: 4.2, reason: "Your summary does not say which role you are targeting." },
          { id: "suggested_summary_0", section: "Summary", fix_type: "auto", impact: "medium", rank: 1, penalty_pts: 4.2,
            before_example: "Hard working student.", after_example: "CS graduate building Python APIs.", reason: null },
        ],
      },
      {
        name: "Experience", score_pct: 0, weighted_pts: 0, max_pts: 0, is_not_applicable: true, fixes: [],
      },
      {
        name: "Projects", score_pct: 58, weighted_pts: 8.7, max_pts: 15, is_not_applicable: false,
        fixes: [
          { id: "projects_apply_all", fix_type: "auto", impact: "low", rank: 4, penalty_pts: 3.5, reason: "Applies the 2 fixes" },
          { id: "project_1_tech_stack_missing", section: "Projects", fix_type: "auto", impact: "low", rank: 3, penalty_pts: 2,
            before_example: null, after_example: "Python, FastAPI", reason: "Add the stack" },
          { id: "project_1_sentence_weak_0", section: "Projects", fix_type: "auto", impact: "low", rank: 2, penalty_pts: 1.5,
            before_example: "Worked on a chatbot", after_example: "Built a support chatbot used by n+ users", reason: null },
        ],
      },
      {
        name: "ATS Compatibility", score_pct: 70, weighted_pts: 2.8, max_pts: 4, is_not_applicable: false,
        fixes: [{ id: "ats_tables", section: "ATS Compatibility", fix_type: "info", impact: "low", rank: 6, penalty_pts: 1.2,
                  before_example: null, after_example: null, reason: "The file uses tables" }],
      },
    ],
    completeness: { name: "Completeness", score_pct: 90, missing_fields: ["LinkedIn"], experience_band: "fresher" },
  },
});

describe("buildAtsReport", () => {
  it("returns null when there is no score to report", () => {
    expect(buildAtsReport(null)).toBeNull();
    expect(buildAtsReport({})).toBeNull();
    expect(buildAtsReport({ ats_display: { sections: [] } })).toBeNull();
  });

  it("reads the score, band and the recoverable points, and carries no completeness", () => {
    const model = buildAtsReport(scan())!;
    expect(model.score).toBe(61.4);
    expect(model.band).toEqual({ label: "Fair", tone: "fair" });
    expect(model).not.toHaveProperty("completeness");                 // the scan sends it, the report does not show it
    expect(model.issueCount).toBe(5);
    expect(model.recoverablePoints).toBe(10.3);
    expect(model.potentialScore).toBe(71); // 61.4 + 9.1 the user can fix (not the 1.2-point ATS-format finding), rounded
  });

  it("adds only points the user can fix to the fallback potential score (an ATS-format finding is information only)", () => {
    const base = scan();
    const infoOnly = { ats_display: { score: 70, sections: [{ name: "ATS Compatibility", score_pct: 50, weighted_pts: 2, max_pts: 4,
      is_not_applicable: false, fixes: [{ id: "ats_tables", fix_type: "info", penalty_pts: 5, reason: "The file uses tables" }] }] } };
    expect(buildAtsReport(infoOnly)!.potentialScore).toBeNull();
    expect(buildAtsReport({ ...base })!.potentialScore).toBe(71); // 61.4 + 9.1 fixable (the 1.2-point ats_tables is not)
  });

  it("rounds the server's potential score like the fallback", () => {
    expect(buildAtsReport({ ...scan(), estimated_score_after_fixes: 84.6 })!.potentialScore).toBe(85);
  });

  it("prefers the potential score the server sends", () => {
    const payload = { ...scan(), estimated_score_after_fixes: 88 };
    expect(buildAtsReport(payload)!.potentialScore).toBe(88);
  });

  it("uses the estimate re-read from the saved record, not the one stored at scan time", () => {
    const base = scan();
    const payload = { ...base, estimated_score_after_fixes: 90, ats_display: { ...base.ats_display, estimated_score_after_fixes: 85 } };
    expect(buildAtsReport(payload)!.potentialScore).toBe(85);
  });

  it("gives the band of the score the user sees: 79.6 shows 80 and is Strong", () => {
    const base = scan();
    const model = buildAtsReport({ ...base, ats_display: { ...base.ats_display, score: 79.6 } })!;
    expect(Math.round(model.score)).toBe(80);
    expect(model.band.label).toBe("Strong");
  });

  it("keeps the sections in the server's order and flags the ones that do not apply", () => {
    const model = buildAtsReport(scan())!;
    expect(model.sections.map((s) => s.name)).toEqual(["Contact", "Summary", "Experience", "Projects", "ATS Compatibility"]);
    expect(model.sections.find((s) => s.name === "Experience")!.notApplicable).toBe(true);
  });

  it("separates explanation-only rows (no id) from suggestions", () => {
    const summary = buildAtsReport(scan())!.sections.find((s) => s.name === "Summary")!;
    expect(summary.reasons).toEqual(["Your summary does not say which role you are targeting."]);
    expect(summary.items.map((i) => i.id)).toEqual(["suggested_summary_0"]);
  });

  it("never lists an 'apply all' offer as a suggestion", () => {
    const projects = buildAtsReport(scan())!.sections.find((s) => s.name === "Projects")!;
    expect(projects.items.map((i) => i.id)).not.toContain("projects_apply_all");
    expect(projects.items).toHaveLength(2);
  });

  it("orders suggestions by priority within a section", () => {
    const projects = buildAtsReport(scan())!.sections.find((s) => s.name === "Projects")!;
    expect(projects.items.map((i) => i.id)).toEqual(["project_1_sentence_weak_0", "project_1_tech_stack_missing"]);
  });

  it("gives each suggestion a readable title, its details and its kind", () => {
    const projects = buildAtsReport(scan())!.sections.find((s) => s.name === "Projects")!;
    const weak = projects.items[0];
    expect(weak).toMatchObject({
      title: "Strengthen a weak bullet point", kind: "auto", impact: "low", points: 1.5,
      before: "Worked on a chatbot", after: "Built a support chatbot used by n+ users",
    });
    const contact = buildAtsReport(scan())!.sections[0].items[0];
    expect(contact).toMatchObject({ title: "Complete your contact details", kind: "manual", reason: "Missing LinkedIn profile" });
  });

  it("treats document-format findings as information only", () => {
    const ats = buildAtsReport(scan())!.sections.find((s) => s.name === "ATS Compatibility")!;
    expect(ats.items[0]).toMatchObject({ id: "ats_tables", kind: "info" });
    expect(ats.editorSection).toBeNull(); // nothing to open in the enhancer
  });

  it("points each section at the builder section that edits it", () => {
    const byName = Object.fromEntries(buildAtsReport(scan())!.sections.map((s) => [s.name, s.editorSection]));
    expect(byName).toMatchObject({ Contact: "Personal Info", Summary: "Professional Summary", Projects: "Projects" });
  });

  it("derives impact from the points when the server sends none", () => {
    const payload = { ats_display: { score: 50, sections: [{ name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10,
      is_not_applicable: false, fixes: [{ id: "soft_skills_low", fix_type: "auto", penalty_pts: 6 },
                                         { id: "skills_off_domain", fix_type: "auto", penalty_pts: 3 }] }] } };
    const items = buildAtsReport(payload)!.sections[0].items;
    expect(items.find((i) => i.id === "soft_skills_low")!.impact).toBe("high");
    expect(items.find((i) => i.id === "skills_off_domain")!.impact).toBe("medium");
  });

  it("falls back to action_items when a section has no fixes list", () => {
    const payload = { ats_display: { score: 70,
      sections: [{ name: "Skills", score_pct: 55, weighted_pts: 9, max_pts: 17, is_not_applicable: false }],
      action_items: { Skills: [{ id: "soft_skills_low", fix_type: "auto", penalty_pts: 1.7, after_example: "Problem Solving" }] } } };
    expect(buildAtsReport(payload)!.sections[0].items.map((i) => i.id)).toEqual(["soft_skills_low"]);
  });

  it("still shows section bars for an older scan that stored only the breakdown", () => {
    const payload = { finalWeightedScore: 64, ats_score: { section_breakdown: {
      Contact: { percentage: 100, max_score: 5 }, Skills: { percentage: 40, max_score: 20 } } } };
    const model = buildAtsReport(payload)!;
    expect(model.score).toBe(64);
    expect(model.sections.map((s) => [s.name, s.scorePct, s.items.length])).toEqual([["Contact", 100, 0], ["Skills", 40, 0]]);
  });

  it("lists an older scan's stored suggestions under their sections, not 'no suggestions'", () => {
    // Pre-redesign reports kept the suggestions in ats_score.suggestions (or Suggestions), next to the breakdown.
    const legacy = (key: "suggestions" | "Suggestions") => ({ finalWeightedScore: 64, ats_score: {
      section_breakdown: { Contact: { percentage: 100, max_score: 5 }, Skills: { percentage: 40, max_score: 20 } },
      [key]: [
        { id: "skills_missing", section: "Skills", message: "Add your technical skills", fix_type: "manual", penalty_pts: 3 },
        { id: "skills_apply_all", section: "Skills", message: "Apply all", fix_type: "auto", penalty_pts: 3 },
        { id: "soft_skills_low", section: "skills", message: "Add soft skills", fix_type: "auto", after_example: "Teamwork", penalty_pts: 1 },
      ] } });
    for (const key of ["suggestions", "Suggestions"] as const) {
      const model = buildAtsReport(legacy(key))!;
      const skills = model.sections.find((s) => s.name === "Skills")!;
      expect(skills.items.map((i) => i.id)).toEqual(["skills_missing", "soft_skills_low"]);
      expect(skills.items[0]).toMatchObject({ title: "Add your technical skills", kind: "manual", reason: "Add your technical skills" });
      expect(model.sections.find((s) => s.name === "Contact")!.items).toEqual([]);
      expect(model.issueCount).toBe(2);
    }
  });

  it("lists an older scan's suggestions kept under a nested breakdown (ats_score.breakdown / Breakdown, or a top-level breakdown)", () => {
    // The pre-redesign report also read Suggestions from these containers (develop2 page.tsx transformData).
    const rows = [
      { id: "skills_missing", section: "Skills", message: "Add your technical skills", fix_type: "manual", penalty_pts: 3 },
      { id: "contact_phone", section: "Contact", message: "Add a phone number", fix_type: "manual", penalty_pts: 1 },
    ];
    const section_breakdown = { Contact: { percentage: 80, max_score: 5 }, Skills: { percentage: 40, max_score: 20 } };
    const payloads = [
      { finalWeightedScore: 64, ats_score: { section_breakdown, breakdown: { keywords: 40, Suggestions: rows } } },
      { finalWeightedScore: 64, ats_score: { section_breakdown, Breakdown: { Suggestions: rows } } },
      { finalWeightedScore: 64, ats_score: { section_breakdown }, breakdown: { Suggestions: rows } },
    ];
    for (const payload of payloads) {
      const model = buildAtsReport(payload)!;
      expect(model.sections.map((s) => [s.name, s.items.map((i) => i.id)])).toEqual([["Contact", ["contact_phone"]], ["Skills", ["skills_missing"]]]);
      expect(model.issueCount).toBe(2);
    }
  });

  it("reads an older report whose score sits in a top-level ats_breakdown (as the replaced report did)", () => {
    const model = buildAtsReport({ ats_breakdown: {
      final_score: 58,
      section_breakdown: { Skills: { percentage: 40, max_score: 20 } },
      suggestions: [{ id: "skills_missing", section: "Skills", message: "Add your technical skills", fix_type: "manual", penalty_pts: 3 }] } });
    expect(model?.score).toBe(58);
    expect(model!.sections.map((s) => [s.name, s.items.map((i) => i.id)])).toEqual([["Skills", ["skills_missing"]]]);
  });

  it("still prefers ats_score over a top-level ats_breakdown (control)", () => {
    expect(buildAtsReport({ ats_score: { final_score: 70 }, ats_breakdown: { final_score: 10 } })!.score).toBe(70);
  });

  it("prefers ats_score.suggestions over a nested breakdown list (control: no double listing)", () => {
    const model = buildAtsReport({ finalWeightedScore: 64, ats_score: {
      section_breakdown: { Skills: { percentage: 40 } },
      suggestions: [{ id: "skills_missing", section: "Skills", message: "Add your technical skills", fix_type: "manual", penalty_pts: 3 }],
      breakdown: { Suggestions: [{ id: "skills_old", section: "Skills", message: "Old list", fix_type: "manual", penalty_pts: 3 }] } } })!;
    expect(model.sections[0].items.map((i) => i.id)).toEqual(["skills_missing"]);
  });

  it("lists an older scan's suggestion once even when two breakdown keys differ only in case", () => {
    const model = buildAtsReport({ finalWeightedScore: 64, ats_score: {
      section_breakdown: { Skills: { percentage: 40 }, skills: { percentage: 40 } },
      suggestions: [{ id: "skills_missing", section: "Skills", message: "Add your technical skills", fix_type: "manual", penalty_pts: 3 }] } })!;
    expect(model.issueCount).toBe(1);
  });

  it("reads the score from a bare ats_score (no display)", () => {
    expect(buildAtsReport({ ats_score: { final_score: 60 } })!.score).toBe(60);
  });
});

describe("buildAtsReport: what the scan fixed automatically", () => {
  const ledger = [
    { suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true,
      suggestion: { id: "suggested_summary_0", section: "Summary", fix_type: "auto", penalty_pts: 2.5,
                    before_example: "Hard working student.", after_example: "Backend developer building Python APIs." } },
    { suggestion_id: "experience_1_sentence_weak_0", status: "applied", undo_available: true, auto: true,
      suggestion: { id: "experience_1_sentence_weak_0", section: "Experience", fix_type: "auto", penalty_pts: 1,
                    before_example: "Worked on APIs", after_example: "Built REST APIs in Python.", reason: "Weak bullet" } },
    // a fix the user applied by hand is not "fixed automatically"
    { suggestion_id: "contact_issue_0", status: "applied", undo_available: true },
    // an automatic fix with no recorded suggestion cannot be described, so it is left out
    { suggestion_id: "x", status: "applied", undo_available: true, auto: true },
  ];

  it("lists each automatic fix with what it changed", () => {
    const model = buildAtsReport({ ...scan(), applied_fixes: ledger })!;
    expect(model.autoFixed.map((f) => f.id)).toEqual(["suggested_summary_0", "experience_1_sentence_weak_0"]);
    expect(model.autoFixed[0]).toMatchObject({
      title: "Rewrite your summary", section: "Summary", points: 2.5,
      before: "Hard working student.", after: "Backend developer building Python APIs.",
    });
    expect(model.autoFixed[1].reason).toBe("Weak bullet");
  });

  it("still counts an automatic fix it cannot describe, so 'Fixed automatically (N)' matches the score", () => {
    // careerbot-api adds `suggestion` only when it finds the detail; the fix is applied (and scored) either way.
    const model = buildAtsReport({ ...scan(), applied_fixes: ledger })!;
    expect(model.autoFixedCount).toBe(3);                 // 2 described + "x"; the user's own fix is not counted
    expect(buildAtsReport({ ...scan(), applied_fixes: [] })!.autoFixedCount).toBe(0);
    expect(buildAtsReport(scan())!.autoFixedCount).toBe(0);
  });

  it("is empty when the scan applied nothing, or an older scan has no list", () => {
    expect(buildAtsReport(scan())!.autoFixed).toEqual([]);
    expect(buildAtsReport({ ...scan(), applied_fixes: [] })!.autoFixed).toEqual([]);
    expect(buildAtsReport({ ...scan(), applied_fixes: "nope" })!.autoFixed).toEqual([]);
  });
});

describe("bandFor", () => {
  it.each([[85, "Strong"], [80, "Strong"], [79.9, "Fair"], [60, "Fair"], [59, "Needs work"], [0, "Needs work"]])(
    "%s is %s", (score, label) => expect(bandFor(score).label).toBe(label));
});

describe("buildEnhancerFixUrl", () => {
  it("opens the enhancer for the record, from the ATS scan", () => {
    expect(buildEnhancerFixUrl("enh-1")).toBe("/builder/creation/enh-1?source=enhanced&from_ats=true");
  });

  it("opens it on the section to fix", () => {
    expect(buildEnhancerFixUrl("enh-1", "Career Progression"))
      .toBe("/builder/creation/enh-1?source=enhanced&from_ats=true&open_section=Career+Progression");
  });

  it("encodes the id", () => {
    expect(buildEnhancerFixUrl("a/b")).toContain("/builder/creation/a%2Fb?");
  });
});

describe("groupByImpact: suggestions by the impact careerbot-ai gave them", () => {
  const sections = (list: Array<{ name: string; na?: boolean; fixes: Array<Record<string, unknown>> }>) =>
    buildAtsReport({ ats_display: { score: 50, sections: list.map((s) => ({
      name: s.name, score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: s.na === true, fixes: s.fixes,
    })) } })!.sections;
  const fix = (id: string, impact: string | undefined, rank: number, pts: number) => ({
    id, fix_type: "manual", ...(impact ? { impact } : {}), rank, penalty_pts: pts, reason: `reason of ${id}`,
  });

  it("uses the three levels the AI service defines, in this order", () => {
    expect(IMPACT_ORDER).toEqual(["high", "medium", "low"]);
    expect(IMPACT_LABEL).toEqual({ high: "High impact", medium: "Medium impact", low: "Low impact" });
  });

  it("groups every section's suggestions by impact, High first", () => {
    const groups = groupByImpact(sections([
      { name: "Summary", fixes: [fix("suggested_summary_0", "low", 6, 1), fix("headline_missing", "high", 1, 6)] },
      { name: "Skills", fixes: [fix("skills_missing", "medium", 3, 3), fix("soft_skills_missing", "high", 2, 5.5)] },
    ]));

    expect(groups.map((g) => g.impact)).toEqual(["high", "medium", "low"]);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([
      ["headline_missing", "soft_skills_missing"],
      ["skills_missing"],
      ["suggested_summary_0"],
    ]);
  });

  it("records the section of each suggestion", () => {
    const [high] = groupByImpact(sections([
      { name: "Summary", fixes: [fix("headline_missing", "high", 1, 6)] },
      { name: "Skills", fixes: [fix("skills_missing", "high", 2, 5.5)] },
    ]));

    expect(high.items.map((i) => i.section)).toEqual(["Summary", "Skills"]);
  });

  it("orders a group by priority across sections, not section by section", () => {
    const [high] = groupByImpact(sections([
      { name: "Skills", fixes: [fix("skills_missing", "high", 3, 6)] },
      { name: "Summary", fixes: [fix("headline_missing", "high", 1, 6), fix("suggested_summary_0", "high", 2, 6)] },
    ]));

    expect(high.items.map((i) => i.id)).toEqual(["headline_missing", "suggested_summary_0", "skills_missing"]);
  });

  it("adds up the points of a group", () => {
    const groups = groupByImpact(sections([
      { name: "Skills", fixes: [fix("skills_missing", "high", 1, 6.2), fix("soft_skills_missing", "high", 2, 5.4), fix("cert_1_year", "low", 3, 0.4)] },
    ]));

    expect(groups.map((g) => [g.impact, g.points])).toEqual([["high", 11.6], ["low", 0.4]]);
  });

  it("lists, inside a group, each section with its own suggestions of that level", () => {
    const [high, low] = groupByImpact(sections([
      { name: "Summary", fixes: [fix("headline_missing", "high", 1, 6), fix("suggested_summary_0", "low", 6, 1)] },
      { name: "Skills", fixes: [fix("skills_missing", "high", 2, 5.5), fix("soft_skills_missing", "high", 3, 5.2)] },
    ]));

    expect(high.sections.map((g) => [g.section.name, g.items.map((i) => i.id)])).toEqual([
      ["Summary", ["headline_missing"]],
      ["Skills", ["skills_missing", "soft_skills_missing"]],
    ]);
    expect(low.sections.map((g) => [g.section.name, g.items.map((i) => i.id)])).toEqual([["Summary", ["suggested_summary_0"]]]);
  });

  it("puts first the section that holds the most urgent suggestion of the level", () => {
    const [high] = groupByImpact(sections([
      { name: "Contact", fixes: [fix("contact_issue_0", "high", 4, 6)] },
      { name: "Skills", fixes: [fix("skills_missing", "high", 1, 6)] },
    ]));

    expect(high.sections.map((g) => g.section.name)).toEqual(["Skills", "Contact"]);
  });

  it("hands over the section itself, with its score and explanation rows", () => {
    const [group] = groupByImpact(buildAtsReport({ ats_display: { score: 50, sections: [
      { name: "Summary", score_pct: 40, weighted_pts: 2.8, max_pts: 7, is_not_applicable: false, fixes: [
        { penalty_pts: 4, reason: "Your summary names no role." }, fix("headline_missing", "high", 1, 6)] },
    ] } })!.sections);

    expect(group.sections[0].section).toMatchObject({ name: "Summary", scorePct: 40, reasons: ["Your summary names no role."] });
  });

  it("leaves out a level that has no suggestion", () => {
    const groups = groupByImpact(sections([{ name: "Skills", fixes: [fix("skills_missing", "medium", 1, 3)] }]));

    expect(groups.map((g) => g.impact)).toEqual(["medium"]);
  });

  it("is empty when there is nothing to fix", () => {
    expect(groupByImpact(sections([{ name: "Skills", fixes: [] }]))).toEqual([]);
    expect(groupByImpact([])).toEqual([]);
  });

  it("ignores sections that do not apply to the profile", () => {
    const groups = groupByImpact(sections([
      { name: "Experience", na: true, fixes: [fix("experience_none", "high", 1, 8)] },
      { name: "Skills", fixes: [fix("skills_missing", "low", 2, 1)] },
    ]));

    expect(groups.map((g) => g.impact)).toEqual(["low"]);
  });

  it("derives the level from the points when the AI sends none, as the AI service itself does", () => {
    const groups = groupByImpact(sections([
      { name: "Skills", fixes: [fix("a_big", undefined, 1, 6), fix("a_mid", undefined, 2, 3), fix("a_small", undefined, 3, 1)] },
    ]));

    expect(groups.map((g) => [g.impact, g.items[0].id])).toEqual([["high", "a_big"], ["medium", "a_mid"], ["low", "a_small"]]);
  });

  it("puts every suggestion in exactly one group", () => {
    const model = buildAtsReport(scan())!;
    const groups = groupByImpact(model.sections);

    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(model.issueCount);
  });
});
