import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ATSScanReport from "@/app/(resume)/atslogin/_components/ATSScanReport";
import { buildAtsReport } from "@/app/(resume)/atslogin/report/atsReportModel";

const payload = {
  ats_display: {
    score: 61.4,
    sections: [
      { name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false,
        fixes: [{ id: "contact_issue_0", fix_type: "manual", impact: "low", rank: 5, penalty_pts: 1.4, reason: "Missing LinkedIn profile" }] },
      { name: "Summary", score_pct: 40, weighted_pts: 2.8, max_pts: 7, is_not_applicable: false,
        fixes: [{ penalty_pts: 4.2, reason: "Your summary names no role." },
                { id: "suggested_summary_0", fix_type: "auto", impact: "medium", rank: 1, penalty_pts: 4.2,
                  before_example: "Hard working student.", after_example: "CS graduate building Python APIs." }] },
      { name: "Experience", score_pct: 0, weighted_pts: 0, max_pts: 0, is_not_applicable: true, fixes: [] },
      { name: "Education", score_pct: 100, weighted_pts: 8, max_pts: 8, is_not_applicable: false, fixes: [] },
      { name: "ATS Compatibility", score_pct: 70, weighted_pts: 2.8, max_pts: 4, is_not_applicable: false,
        fixes: [{ id: "ats_tables", fix_type: "info", impact: "low", rank: 6, penalty_pts: 1.2, reason: "The file uses tables" }] },
    ],
    completeness: { score_pct: 90, missing_fields: ["LinkedIn"] },
  },
};

const renderReport = (over: Partial<React.ComponentProps<typeof ATSScanReport>> = {}) => {
  const props = {
    model: buildAtsReport(payload)!,
    fixReady: true,
    preparing: false,
    setupError: null,
    onRetrySetup: vi.fn(),
    onFix: vi.fn(),
    onScanAnother: vi.fn(),
    ...over,
  };
  render(<ATSScanReport {...props} />);
  return props;
};

// The suggestions are listed by impact, in a panel per level that opens and closes.
const panel = (impact: string) =>
  screen.getAllByTestId("impact-panel").find((p) => p.getAttribute("data-impact") === impact) as HTMLElement;
const panelButton = (impact: string) => within(panel(impact)).getAllByRole("button")[0];
const openPanel = (impact: string) => {
  if (panelButton(impact).getAttribute("aria-expanded") !== "true") fireEvent.click(panelButton(impact));
  return panel(impact);
};

// A scan with all three levels, to show the grouping.
const mixedPayload = {
  ats_display: {
    score: 55,
    sections: [
      { name: "Summary", score_pct: 30, weighted_pts: 2, max_pts: 7, is_not_applicable: false,
        fixes: [{ id: "suggested_summary_0", fix_type: "auto", impact: "high", rank: 1, penalty_pts: 6.2, before_example: "Student.", after_example: "Python developer." }] },
      { name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false,
        fixes: [
          { id: "skills_missing", fix_type: "manual", impact: "high", rank: 2, penalty_pts: 5.4, reason: "No technical skills listed." },
          { id: "soft_skills_missing", fix_type: "manual", impact: "medium", rank: 4, penalty_pts: 2.5, reason: "No soft skills listed." },
        ] },
      { name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false,
        fixes: [{ id: "contact_issue_0", fix_type: "manual", impact: "low", rank: 7, penalty_pts: 1.4, reason: "Missing LinkedIn profile" }] },
    ],
  },
};

describe("ATSScanReport", () => {
  it("shows the score, its band and how many suggestions there are", () => {
    renderReport();
    expect(screen.getByTestId("ats-score").textContent).toBe("61");
    expect(screen.getByTestId("ats-band").textContent).toBe("Fair");
    expect(screen.getByText(/3 suggestions to improve your resume/)).toBeTruthy();
    expect(screen.getByText(/could raise your score to about/)).toBeTruthy();
  });

  it("does not show resume completeness, even when the scan sends it", () => {
    renderReport();                                                                    // the payload carries a completeness block

    expect(screen.queryByTestId("completeness-card")).toBeNull();
    expect(screen.queryByText(/completeness/i)).toBeNull();
    expect(screen.queryByText(/Add them in the enhancer/)).toBeNull();
    expect(screen.queryByText("LinkedIn")).toBeNull();
  });

  it("lists what was fixed automatically, with before and after, and says Undo is in the enhancer", () => {
    const model = buildAtsReport({
      ...payload,
      applied_fixes: [{
        suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true,
        suggestion: { id: "suggested_summary_0", section: "Summary", penalty_pts: 2.5,
                      before_example: "Hard working student.", after_example: "Backend developer building Python APIs." },
      }],
    })!;
    renderReport({ model });

    const card = screen.getByTestId("auto-fixed");
    expect(within(card).getByText("Fixed automatically (1)")).toBeTruthy();
    expect(within(card).getByText("Rewrite your summary")).toBeTruthy();
    expect(within(card).getByText("Hard working student.")).toBeTruthy();
    expect(within(card).getByText("Backend developer building Python APIs.")).toBeTruthy();
    expect(within(card).getByText("+3 pts")).toBeTruthy();
    expect(within(card).getByText(/undo any of them in the enhancer/)).toBeTruthy();
  });

  it("counts automatic fixes the scan could not describe instead of hiding them", () => {
    const model = buildAtsReport({
      ...payload,
      applied_fixes: [
        { suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true,
          suggestion: { id: "suggested_summary_0", section: "Summary", before_example: "Old.", after_example: "New." } },
        { suggestion_id: "project_1_sentence_weak_0", status: "applied", undo_available: true, auto: true },
        { suggestion_id: "project_2_sentence_weak_0", status: "applied", undo_available: true, auto: true },
      ],
    })!;
    renderReport({ model });
    const card = screen.getByTestId("auto-fixed");
    expect(within(card).getByText("Fixed automatically (3)")).toBeTruthy();
    expect(within(card).getAllByTestId("auto-fixed-item")).toHaveLength(1);
    expect(within(card).getByText(/2 more changes are not described here/)).toBeTruthy();
  });

  it("says which changes 'View all' lists when some could not be described", () => {
    const described = Array.from({ length: 4 }, (_, i) => ({
      suggestion_id: `experience_1_sentence_weak_${i}`, status: "applied", undo_available: true, auto: true,
      suggestion: { id: `experience_1_sentence_weak_${i}`, section: "Experience", before_example: `old ${i}`, after_example: `new ${i}` },
    }));
    const model = buildAtsReport({ ...payload, applied_fixes: [...described,
      { suggestion_id: "project_1_sentence_weak_0", status: "applied", undo_available: true, auto: true }] })!;
    renderReport({ model });
    const card = screen.getByTestId("auto-fixed");
    expect(within(card).getByText("Fixed automatically (5)")).toBeTruthy();
    expect(within(card).getByRole("button", { name: "View all 4 described changes" })).toBeTruthy();
  });

  it("shows the card when no automatic fix could be described", () => {
    const model = buildAtsReport({
      ...payload,
      applied_fixes: [{ suggestion_id: "project_1_sentence_weak_0", status: "applied", undo_available: true, auto: true }],
    })!;
    renderReport({ model });
    const card = screen.getByTestId("auto-fixed");
    expect(within(card).getByText("Fixed automatically (1)")).toBeTruthy();
    expect(within(card).queryAllByTestId("auto-fixed-item")).toHaveLength(0);
    expect(within(card).getByText(/1 more change is not described here/)).toBeTruthy();
  });

  it("shows the automatic fix's old text on blue and its new text on green, both in white", () => {
    const model = buildAtsReport({
      ...payload,
      applied_fixes: [{
        suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true,
        suggestion: { id: "suggested_summary_0", section: "Summary", before_example: "Hard working student.", after_example: "CS graduate building Python APIs." },
      }],
    })!;
    renderReport({ model });
    const card = screen.getByTestId("auto-fixed");
    const before = within(card).getByTestId("fix-before");
    const after = within(card).getByTestId("fix-after");
    expect(before.className).toContain("bg-[#2557a7]");
    expect(before.className).toContain("text-white");
    expect(after.className).toContain("bg-green-700");
    expect(after.className).toContain("text-white");
  });

  it("shows no 'fixed automatically' card when nothing was applied", () => {
    renderReport();
    expect(screen.queryByTestId("auto-fixed")).toBeNull();
  });

  it("is a report only: no resume preview, no editor, no apply-all", () => {
    renderReport();
    expect(screen.queryByTestId("preview-panel")).toBeNull();
    expect(screen.queryByTestId("resume-side")).toBeNull();
    expect(screen.queryByText(/apply all/i)).toBeNull();
  });

  it("lists each section with its score and bar: the ones with suggestions inside their impact tabs", () => {
    renderReport();
    expect(screen.queryAllByTestId("ats-section")).toHaveLength(0);                      // Education has nothing to fix
    fireEvent.click(within(screen.getByTestId("no-issues-panel")).getByTestId("no-issues-heading"));
    expect(within(screen.getByTestId("no-issues-panel")).getAllByTestId("no-issues-section").map((row) => row.textContent)).toEqual(["Education100%"]);
    expect(screen.getByText(/Not applicable for your profile: Experience/)).toBeTruthy();

    const medium = within(openPanel("medium")).getAllByTestId("impact-section");
    expect(medium.map((s) => s.getAttribute("aria-label"))).toEqual(["Summary"]);
    expect(within(medium[0]).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
    const low = within(openPanel("low")).getAllByTestId("impact-section");
    expect(low.map((s) => s.getAttribute("aria-label"))).toEqual(["Contact", "ATS Compatibility"]);
    expect(within(low[0]).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("80");
  });

  it("explains each suggestion with its title, kind and whole points, with no example to open", () => {
    renderReport();
    const summary = within(openPanel("medium")).getByTestId("impact-section");
    expect(within(summary).getByText("Your summary names no role.")).toBeTruthy();   // why the section lost points, kept with it
    const card = within(summary).getByTestId("ats-suggestion");
    expect(within(card).getByText("Rewrite your summary")).toBeTruthy();
    expect(within(card).queryByText(/impact/)).toBeNull();                       // no internal impact chip
    expect(within(card).getByText("+4 pts")).toBeTruthy();                       // 4.2 reads as 4
    expect(within(card).getByText("Quick fix")).toBeTruthy();
    expect(within(card).queryByRole("button")).toBeNull();                       // nothing to open on a suggestion

    const contact = within(openPanel("low")).getAllByTestId("ats-suggestion")[0];
    expect(within(contact).getByText("You need to add this")).toBeTruthy();
    expect(within(contact).getByText("Missing LinkedIn profile")).toBeTruthy();
  });

  it("shows how many fixes are quick and how many need the user", () => {
    renderReport();
    expect(screen.getByTestId("ats-breakdown").textContent).toBe("1 quick fix · 1 needs your input");
  });

  it("has one Fix button per section, which opens the enhancer on that section", () => {
    const props = renderReport();
    openPanel("medium");
    fireEvent.click(screen.getByRole("button", { name: "Fix this section: Summary" }));
    expect(props.onFix).toHaveBeenCalledWith("Summary");
    expect(screen.getAllByRole("button", { name: /^Fix this section/ })).toHaveLength(1);   // none per suggestion

    openPanel("low");
    fireEvent.click(screen.getByRole("button", { name: "Fix this section: Contact" }));
    expect(props.onFix).toHaveBeenLastCalledWith("Contact");
    expect(screen.getAllByRole("button", { name: /^Fix this section/ })).toHaveLength(1);
  });

  it("opens the enhancer without a section from the main button", () => {
    const props = renderReport();
    fireEvent.click(screen.getByRole("button", { name: /Enhance my resume/ }));
    expect(screen.queryByText(/Fix my resume in the enhancer/)).toBeNull();
    expect(props.onFix).toHaveBeenCalledWith();
  });

  it("shows no 'Your resume now' or 'Suggested' boxes on a suggestion, and no 'See example' button", () => {
    renderReport();
    openPanel("medium");
    openPanel("low");

    expect(screen.queryByRole("button", { name: /example/i })).toBeNull();
    expect(screen.queryByTestId("fix-before")).toBeNull();
    expect(screen.queryByTestId("fix-after")).toBeNull();
    expect(screen.queryByText("Your resume now")).toBeNull();
    expect(screen.queryByText(/^Suggested$|Example of what to add/)).toBeNull();
    // the text of the example is not shown anywhere, not even hidden
    expect(screen.queryByText("Hard working student.")).toBeNull();
    expect(screen.queryByText("CS graduate building Python APIs.")).toBeNull();
  });

  it("has no Edit in enhancer button on Career Progression: it only explains the score", () => {
    const model = buildAtsReport({ ats_display: { score: 70, sections: [
      { name: "Career Progression", score_pct: 60, weighted_pts: 3, max_pts: 5, is_not_applicable: false,
        fixes: [{ id: "careerprogression_score_gap", fix_type: "manual", ui_action: "review_content", impact: "low", rank: 3,
                  penalty_pts: 2, reason: "Your latest role shows little scope." }] },
    ] } })!;
    renderReport({ model });
    const section = within(openPanel("low")).getByTestId("impact-section");
    expect(within(section).queryByRole("button")).toBeNull();                          // no Fix on the section
    const items = within(openPanel("low")).getByTestId("impact-items");
    expect(within(items).getByText("Your latest role shows little scope.")).toBeTruthy();
    expect(within(items).queryByRole("button")).toBeNull();                            // and none on the suggestion
    expect(screen.queryByText(/Edit in enhancer/)).toBeNull();
  });

  it("offers no Fix for a document-format finding: it only explains", () => {
    renderReport();
    const items = within(openPanel("low")).getByTestId("impact-items");
    const ats = within(items).getAllByTestId("ats-suggestion")[1];
    expect(within(ats).getByText("Fix a document format issue")).toBeTruthy();
    expect(within(ats).getByText("Good to know")).toBeTruthy();
    expect(within(ats).queryByRole("button")).toBeNull();
  });

  it("lists every suggestion of an impact level in its panel, with no 'Show more'", () => {
    const fixes = Array.from({ length: 5 }, (_, i) => ({
      id: `projects_1_sentence_weak_${i}`, fix_type: "auto", impact: "low", rank: i + 1, penalty_pts: 1, reason: `Bullet ${i + 1} is weak`,
    }));
    const model = buildAtsReport({ ats_display: { score: 70, sections: [
      { name: "Projects", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false, fixes },
    ] } })!;
    renderReport({ model });
    openPanel("low");
    expect(screen.getAllByTestId("ats-suggestion")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: /^Show \d+ more$/ })).toBeNull();
  });

  it("puts a section with nothing to fix in the No issues panel, not in a full-width row of its own", () => {
    renderReport();

    expect(screen.queryByText("Nothing to fix here.")).toBeNull();
    expect(screen.queryAllByTestId("ats-section")).toHaveLength(0);
    const noIssues = screen.getByTestId("no-issues-panel");
    expect(within(noIssues).getByTestId("no-issues-count").textContent).toBe("1 section");
    expect(within(noIssues).queryByTestId("no-issues-section")).toBeNull();               // closed: only the heading shows
  });

  it("keeps the card of a low-scoring section that lists no suggestion, instead of calling it fine", () => {
    const model = buildAtsReport({ ats_display: { score: 70, sections: [
      { name: "Projects", score_pct: 35, weighted_pts: 3.5, max_pts: 10, is_not_applicable: false, fixes: [] },
    ] } })!;
    renderReport({ model });
    const section = screen.getByTestId("ats-section");
    expect(within(section).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("35");
    expect(within(section).getByText("No specific suggestions for this section.")).toBeTruthy();
    expect(within(section).queryByText("Nothing to fix here.")).toBeNull();
  });

  it("lists the first three automatic fixes and the rest on request", () => {
    const applied = Array.from({ length: 5 }, (_, i) => ({
      suggestion_id: `experience_1_sentence_weak_${i}`, status: "applied", undo_available: true, auto: true,
      suggestion: { id: `experience_1_sentence_weak_${i}`, section: "Experience", penalty_pts: 1, before_example: `old ${i}`, after_example: `new ${i}` },
    }));
    renderReport({ model: buildAtsReport({ ...payload, applied_fixes: applied })! });
    const card = screen.getByTestId("auto-fixed");
    expect(within(card).getByText("Fixed automatically (5)")).toBeTruthy();
    expect(within(card).getAllByTestId("auto-fixed-item")).toHaveLength(3);
    fireEvent.click(within(card).getByRole("button", { name: "View all 5 changes" }));
    expect(within(card).getAllByTestId("auto-fixed-item")).toHaveLength(5);
  });

  it("disables every Fix while the enhancer is being prepared", () => {
    renderReport({ fixReady: false, preparing: true });
    expect(screen.getByRole("status").textContent).toContain("Getting the enhancer ready");
    openPanel("medium");
    openPanel("low");
    for (const button of screen.getAllByRole("button", { name: /^Fix/ })) expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows why the enhancer could not be prepared and lets the user retry", () => {
    const props = renderReport({ fixReady: false, setupError: "Could not prepare the enhancer." });
    expect(screen.getByRole("alert").textContent).toContain("Could not prepare the enhancer.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(props.onRetrySetup).toHaveBeenCalledTimes(1);
  });

  it("scans another resume", () => {
    const props = renderReport();
    fireEvent.click(screen.getByRole("button", { name: /Scan another resume/ }));
    expect(props.onScanAnother).toHaveBeenCalledTimes(1);
  });

  describe("suggestions listed by impact, in dropdown panels", () => {
    it("has one panel per impact level, High first, then Medium, then Low", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      const panels = screen.getAllByTestId("impact-panel");
      expect(panels.map((p) => p.getAttribute("data-impact"))).toEqual(["high", "medium", "low"]);
      expect(panels.map((p) => p.getAttribute("aria-label"))).toEqual(["High impact", "Medium impact", "Low impact"]);
    });

    it("says how many suggestions each level holds and how many points they recover", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      expect(within(panel("high")).getByTestId("impact-count").textContent).toBe("2 suggestions");
      expect(within(panel("medium")).getByTestId("impact-count").textContent).toBe("1 suggestion");
      expect(within(panel("low")).getByTestId("impact-count").textContent).toBe("1 suggestion");
      expect(within(panel("high")).getByTestId("impact-points").textContent).toBe("+12 pts");   // 6.2 + 5.4
      expect(within(panel("medium")).getByTestId("impact-points").textContent).toBe("+3 pts");   // 2.5
    });

    it("gives every panel heading a gray background, open or closed", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      for (const impact of ["high", "medium", "low"]) {
        const heading = within(panel(impact)).getByTestId("impact-heading");
        expect(heading.className).toContain("bg-gray-100");
        expect(heading.className).toContain("hover:bg-gray-200");
      }
      // the body under an open heading stays white, so the heading reads as a tab
      expect(within(panel("high")).getByTestId("impact-items").className).not.toContain("bg-gray");
    });

    it("opens High by default and keeps Medium and Low closed", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      expect(panelButton("high").getAttribute("aria-expanded")).toBe("true");
      expect(panelButton("medium").getAttribute("aria-expanded")).toBe("false");
      expect(panelButton("low").getAttribute("aria-expanded")).toBe("false");
      expect(within(panel("high")).getAllByTestId("ats-suggestion")).toHaveLength(2);
      expect(within(panel("medium")).queryByTestId("ats-suggestion")).toBeNull();
      expect(within(panel("low")).queryByTestId("ats-suggestion")).toBeNull();
    });

    it("opens a tab from its heading, and closes it when its heading is pressed again", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      fireEvent.click(panelButton("medium"));
      expect(panelButton("medium").getAttribute("aria-expanded")).toBe("true");
      expect(within(panel("medium")).getByText("No soft skills listed.")).toBeTruthy();
      expect(panelButton("medium").getAttribute("aria-controls")).toBe(within(panel("medium")).getByTestId("impact-items").id);

      fireEvent.click(panelButton("medium"));
      expect(panelButton("medium").getAttribute("aria-expanded")).toBe("false");
      expect(within(panel("medium")).queryByTestId("ats-suggestion")).toBeNull();
    });

    it("keeps one tab open at a time: opening another closes the open one", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });
      const open = () => ["high", "medium", "low"].filter((impact) => panelButton(impact).getAttribute("aria-expanded") === "true");

      expect(open()).toEqual(["high"]);                                                // High is open when the report loads

      fireEvent.click(panelButton("low"));
      expect(open()).toEqual(["low"]);
      expect(within(panel("high")).queryByTestId("ats-suggestion")).toBeNull();        // High closed by itself
      expect(within(panel("low")).getAllByTestId("ats-suggestion")).toHaveLength(1);

      fireEvent.click(panelButton("medium"));
      expect(open()).toEqual(["medium"]);
      expect(within(panel("low")).queryByTestId("ats-suggestion")).toBeNull();

      fireEvent.click(panelButton("medium"));                                          // the open one can be closed: none is open
      expect(open()).toEqual([]);

      fireEvent.click(panelButton("high"));
      expect(open()).toEqual(["high"]);
    });

    it("opens nothing by itself when there is no High impact suggestion", () => {
      renderReport();                                                                    // the default scan has Medium and Low only

      expect(screen.getAllByTestId("impact-panel").map((p) => p.getAttribute("data-impact"))).toEqual(["medium", "low"]);
      for (const impact of ["medium", "low"]) expect(panelButton(impact).getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByTestId("ats-suggestion")).toBeNull();
    });

    it("has no panel for a level without suggestions", () => {
      const onlyLow = buildAtsReport({ ats_display: { score: 70, sections: [
        { name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false,
          fixes: [{ id: "contact_issue_0", fix_type: "manual", impact: "low", rank: 1, penalty_pts: 1.4, reason: "Missing LinkedIn profile" }] },
      ] } })!;
      renderReport({ model: onlyLow });

      expect(screen.getAllByTestId("impact-panel").map((p) => p.getAttribute("data-impact"))).toEqual(["low"]);
      expect(screen.queryByRole("button", { name: /High impact/ })).toBeNull();
    });

    it("shows only the No issues panel when there is nothing to fix", () => {
      const clean = buildAtsReport({ ats_display: { score: 96, sections: [
        { name: "Contact", score_pct: 100, weighted_pts: 7, max_pts: 7, is_not_applicable: false, fixes: [] }] } })!;
      renderReport({ model: clean });

      expect(screen.queryByTestId("impact-panel")).toBeNull();
      expect(within(screen.getByTestId("no-issues-panel")).getByTestId("no-issues-count").textContent).toBe("1 section");
    });

    it("lists the suggestions under the section they belong to, inside the panel", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      const groups = within(panel("high")).getAllByTestId("impact-section");
      expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual(["Summary", "Skills"]);
      expect(within(groups[0]).getAllByTestId("ats-suggestion")).toHaveLength(1);
      expect(within(groups[0]).getByText("Rewrite your summary")).toBeTruthy();
      expect(within(groups[1]).getByText("Add your technical skills")).toBeTruthy();
    });

    it("lists the most urgent suggestion first inside a panel, across sections", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      const titles = within(panel("high")).getAllByRole("heading", { level: 5 }).map((h) => h.textContent);
      expect(titles).toEqual(["Rewrite your summary", "Add your technical skills"]);   // rank 1 then rank 2
    });

    it("shows a section in each tab that holds some of its suggestions, with only the suggestions of that impact", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });
      const skillsIn = (impact: string) =>
        within(panel(impact)).getAllByTestId("impact-section").find((g) => g.getAttribute("aria-label") === "Skills") as HTMLElement;

      const inHigh = skillsIn("high");                                                 // High is open when the report loads
      expect(within(inHigh).getAllByTestId("ats-suggestion")).toHaveLength(1);
      expect(within(inHigh).getByText("No technical skills listed.")).toBeTruthy();
      expect(within(inHigh).queryByText("No soft skills listed.")).toBeNull();
      expect(within(inHigh).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");   // the section's own score

      openPanel("medium");                                                             // closes High
      const inMedium = skillsIn("medium");
      expect(within(inMedium).getAllByTestId("ats-suggestion")).toHaveLength(1);
      expect(within(inMedium).getByText("No soft skills listed.")).toBeTruthy();
      expect(within(inMedium).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
    });

    it("has a Fix this section button inside the panel, which opens the enhancer on that section", () => {
      const props = renderReport({ model: buildAtsReport(mixedPayload)! });

      fireEvent.click(within(panel("high")).getByRole("button", { name: "Fix this section: Skills" }));

      expect(props.onFix).toHaveBeenCalledWith("Skills");
    });

    it("leaves no card outside the panels for a section that has suggestions", () => {
      renderReport({ model: buildAtsReport(mixedPayload)! });

      expect(screen.queryAllByTestId("ats-section")).toHaveLength(0);                    // Summary, Skills and Contact are all in panels
      expect(screen.queryByText(/listed above by impact/)).toBeNull();
    });

    it("lists a section's explanation rows once, in the first tab it appears in", () => {
      const model = buildAtsReport({ ats_display: { score: 50, sections: [
        { name: "Summary", score_pct: 30, weighted_pts: 2, max_pts: 7, is_not_applicable: false, fixes: [
          { penalty_pts: 4.2, reason: "Your summary names no role." },
          { id: "suggested_summary_0", fix_type: "auto", impact: "high", rank: 1, penalty_pts: 6, reason: "Rewrite it." },
          { id: "headline_missing", fix_type: "manual", impact: "low", rank: 5, penalty_pts: 1, reason: "Add a headline." },
        ] },
      ] } })!;
      renderReport({ model });

      expect(within(panel("high")).getAllByText("Your summary names no role.")).toHaveLength(1);   // High is open
      openPanel("low");
      expect(screen.queryByText("Your summary names no role.")).toBeNull();                        // not repeated in Low
    });

    it("keeps a section outside, as a card, when it has no suggestion but is not fine: a low score or an explanation", () => {
      const model = buildAtsReport({ ats_display: { score: 60, sections: [
        { name: "Education", score_pct: 100, weighted_pts: 8, max_pts: 8, is_not_applicable: false, fixes: [] },
        { name: "Projects", score_pct: 35, weighted_pts: 3.5, max_pts: 10, is_not_applicable: false, fixes: [] },
        { name: "Summary", score_pct: 40, weighted_pts: 2.8, max_pts: 7, is_not_applicable: false, fixes: [{ penalty_pts: 4, reason: "Your summary names no role." }] },
        { name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false,
          fixes: [{ id: "skills_missing", fix_type: "manual", impact: "high", rank: 1, penalty_pts: 6, reason: "No technical skills listed." }] },
      ] } })!;
      renderReport({ model });

      expect(screen.getAllByTestId("ats-section").map((s) => s.getAttribute("aria-label"))).toEqual(["Projects", "Summary"]);
      expect(within(panel("high")).getAllByTestId("impact-section").map((s) => s.getAttribute("aria-label"))).toEqual(["Skills"]);
      fireEvent.click(within(screen.getByTestId("no-issues-panel")).getByTestId("no-issues-heading"));
      expect(within(screen.getByTestId("no-issues-panel")).getAllByTestId("no-issues-section").map((row) => row.textContent)).toEqual(["Education100%"]);
    });

    describe("the No issues panel", () => {
      const withQuietSections = () => buildAtsReport({
        ats_display: {
          ...mixedPayload.ats_display,
          sections: [
            ...mixedPayload.ats_display.sections,
            { name: "Education", score_pct: 100, weighted_pts: 8, max_pts: 8, is_not_applicable: false, fixes: [] },
            { name: "ATS Compatibility", score_pct: 90, weighted_pts: 3.6, max_pts: 4, is_not_applicable: false, fixes: [] },
            { name: "Experience", score_pct: 0, weighted_pts: 0, max_pts: 0, is_not_applicable: true, fixes: [] },
            { name: "Headline", score_pct: 0, weighted_pts: 0, max_pts: 0, is_not_applicable: true, fixes: [] },
          ],
        },
      })!;
      const noIssues = () => screen.getByTestId("no-issues-panel");
      const noIssuesHeading = () => within(noIssues()).getByTestId("no-issues-heading");

      it("comes last, after High, Medium and Low", () => {
        const { container } = render(<ATSScanReport model={withQuietSections()} fixReady preparing={false} setupError={null} onRetrySetup={vi.fn()} onFix={vi.fn()} onScanAnother={vi.fn()} />);

        const order = Array.from(container.querySelectorAll('[data-testid="impact-panel"], [data-testid="no-issues-panel"]'))
          .map((el) => el.getAttribute("data-impact") ?? "no-issues");
        expect(order).toEqual(["high", "medium", "low", "no-issues"]);
      });

      it("has a gray heading and a green dot, and says how many sections have no issues", () => {
        renderReport({ model: withQuietSections() });

        expect(noIssuesHeading().className).toContain("bg-gray-100");
        expect(noIssuesHeading().className).toContain("hover:bg-gray-200");
        expect(noIssuesHeading().querySelector(".bg-green-500")).not.toBeNull();
        expect(within(noIssues()).getByTestId("no-issues-count").textContent).toBe("2 sections");
        expect(noIssuesHeading().textContent).toContain("No issues");
      });

      it("is closed when the report loads, and opens and closes from its heading", () => {
        renderReport({ model: withQuietSections() });

        expect(noIssuesHeading().getAttribute("aria-expanded")).toBe("false");
        expect(within(noIssues()).queryByTestId("no-issues-section")).toBeNull();

        fireEvent.click(noIssuesHeading());
        expect(noIssuesHeading().getAttribute("aria-expanded")).toBe("true");
        expect(noIssuesHeading().getAttribute("aria-controls")).toBe(within(noIssues()).getByTestId("no-issues-items").id);
        expect(within(noIssues()).getAllByTestId("no-issues-section").map((row) => row.textContent)).toEqual(["Education100%", "ATS Compatibility90%"]);

        fireEvent.click(noIssuesHeading());
        expect(noIssuesHeading().getAttribute("aria-expanded")).toBe("false");
        expect(within(noIssues()).queryByTestId("no-issues-section")).toBeNull();
      });

      it("takes part in the same accordion: opening it closes the open tab, and opening a tab closes it", () => {
        renderReport({ model: withQuietSections() });
        expect(panelButton("high").getAttribute("aria-expanded")).toBe("true");

        fireEvent.click(noIssuesHeading());
        expect(noIssuesHeading().getAttribute("aria-expanded")).toBe("true");
        for (const impact of ["high", "medium", "low"]) expect(panelButton(impact).getAttribute("aria-expanded")).toBe("false");

        fireEvent.click(panelButton("medium"));
        expect(panelButton("medium").getAttribute("aria-expanded")).toBe("true");
        expect(noIssuesHeading().getAttribute("aria-expanded")).toBe("false");
        expect(within(noIssues()).queryByTestId("no-issues-section")).toBeNull();
      });

      it("names the sections the profile does not need inside the panel, not below the report", () => {
        renderReport({ model: withQuietSections() });
        expect(screen.queryByText(/Not applicable for your profile/)).toBeNull();      // closed: not shown anywhere

        fireEvent.click(noIssuesHeading());

        expect(within(noIssues()).getByTestId("not-applicable").textContent).toBe("Not applicable for your profile: Experience, Headline.");
        expect(screen.getAllByText(/Not applicable for your profile/)).toHaveLength(1);
      });

      it("keeps the 'not applicable' note below the report when no section is in the panel", () => {
        const model = buildAtsReport({ ats_display: { score: 55, sections: [
          { name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false,
            fixes: [{ id: "skills_missing", fix_type: "manual", impact: "high", rank: 1, penalty_pts: 6, reason: "No technical skills listed." }] },
          { name: "Experience", score_pct: 0, weighted_pts: 0, max_pts: 0, is_not_applicable: true, fixes: [] },
        ] } })!;
        renderReport({ model });

        expect(screen.queryByTestId("no-issues-panel")).toBeNull();
        expect(screen.getByText("Not applicable for your profile: Experience.")).toBeTruthy();
      });

      it("has no No issues panel when every section has something to improve", () => {
        renderReport({ model: buildAtsReport(mixedPayload)! });

        expect(screen.queryByTestId("no-issues-panel")).toBeNull();
      });

      it("does not hold a section that is low or only has an explanation: that is not 'no issues'", () => {
        const model = buildAtsReport({ ats_display: { score: 60, sections: [
          { name: "Education", score_pct: 100, weighted_pts: 8, max_pts: 8, is_not_applicable: false, fixes: [] },
          { name: "Projects", score_pct: 79, weighted_pts: 7.9, max_pts: 10, is_not_applicable: false, fixes: [] },
          { name: "Summary", score_pct: 95, weighted_pts: 6.6, max_pts: 7, is_not_applicable: false, fixes: [{ penalty_pts: 0.4, reason: "Your summary is short." }] },
        ] } })!;
        renderReport({ model });

        expect(within(noIssues()).getByTestId("no-issues-count").textContent).toBe("1 section");
        expect(screen.getAllByTestId("ats-section").map((c) => c.getAttribute("aria-label"))).toEqual(["Projects", "Summary"]);
      });

      it("counts a section with 80% as fine, and one with 79% as not", () => {
        const model = buildAtsReport({ ats_display: { score: 80, sections: [
          { name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false, fixes: [] },
          { name: "Skills", score_pct: 79, weighted_pts: 7.9, max_pts: 10, is_not_applicable: false, fixes: [] },
        ] } })!;
        renderReport({ model });

        fireEvent.click(noIssuesHeading());
        expect(within(noIssues()).getAllByTestId("no-issues-section").map((row) => row.textContent)).toEqual(["Contact80%"]);
        expect(screen.getAllByTestId("ats-section").map((c) => c.getAttribute("aria-label"))).toEqual(["Skills"]);
      });
    });

    describe("after a re-scan gives the report a new model", () => {
      const props = (model: ReturnType<typeof buildAtsReport>) => ({
        model: model!, fixReady: true, preparing: false, setupError: null, onRetrySetup: vi.fn(), onFix: vi.fn(), onScanAnother: vi.fn(),
      });
      // The levels whose tab is open, among the tabs the report has.
      const open = () => screen.getAllByTestId("impact-heading")
        .filter((heading) => heading.getAttribute("aria-expanded") === "true")
        .map((heading) => heading.closest("[data-impact]")?.getAttribute("data-impact"));
      const onlyHigh = () => buildAtsReport({ ats_display: { score: 70, sections: [
        { name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false,
          fixes: [{ id: "skills_missing", fix_type: "manual", impact: "high", rank: 1, penalty_pts: 6, reason: "No technical skills listed." }] },
      ] } });

      it("keeps the tab the user opened when the new report still has it", () => {
        const { rerender } = render(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);
        fireEvent.click(panelButton("medium"));

        rerender(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);

        expect(open()).toEqual(["medium"]);
      });

      it("keeps every tab closed when the user closed them all", () => {
        const { rerender } = render(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);
        fireEvent.click(panelButton("high"));                                          // closes High: none is open

        rerender(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);

        expect(open()).toEqual([]);
      });

      it("opens High again when the tab the user had open is gone from the new report", () => {
        const { rerender } = render(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);
        fireEvent.click(panelButton("low"));
        expect(open()).toEqual(["low"]);

        rerender(<ATSScanReport {...props(onlyHigh())} />);                            // Low no longer exists

        expect(open()).toEqual(["high"]);
      });

      it("opens High when a re-scan newly has a High suggestion and the user has not chosen a tab", () => {
        const noHigh = buildAtsReport(payload);                                        // Medium and Low only: nothing open
        const { rerender } = render(<ATSScanReport {...props(noHigh)} />);
        expect(screen.getAllByTestId("impact-panel").map((p) => p.getAttribute("data-impact"))).toEqual(["medium", "low"]);
        expect(open()).toEqual([]);

        rerender(<ATSScanReport {...props(buildAtsReport(mixedPayload))} />);

        expect(open()).toEqual(["high"]);
      });
    });

    it("counts a suggestion once: in its tab, not in both places", () => {
      const model = buildAtsReport(mixedPayload)!;
      renderReport({ model });

      const perTab = ["high", "medium", "low"].map((impact) => within(openPanel(impact)).getAllByTestId("ats-suggestion").length);

      expect(perTab).toEqual([2, 1, 1]);
      expect(perTab.reduce((sum, n) => sum + n, 0)).toBe(model.issueCount);             // 4 suggestions, 4 cards in all
    });

  });

  it("congratulates a resume with nothing left to fix", () => {
    const clean = buildAtsReport({ ats_display: { score: 96, sections: [
      { name: "Contact", score_pct: 100, weighted_pts: 7, max_pts: 7, is_not_applicable: false, fixes: [] }] } })!;
    renderReport({ model: clean });
    expect(screen.getByText(/No suggestions right now/)).toBeTruthy();
    expect(screen.getByTestId("ats-band").textContent).toBe("Strong");
  });
});
