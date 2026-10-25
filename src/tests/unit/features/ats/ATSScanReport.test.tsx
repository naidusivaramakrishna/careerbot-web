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

describe("ATSScanReport", () => {
  it("shows the score, its band and how many suggestions there are", () => {
    renderReport();
    expect(screen.getByTestId("ats-score").textContent).toBe("61");
    expect(screen.getByTestId("ats-band").textContent).toBe("Fair");
    expect(screen.getByText(/3 suggestions to improve your resume/)).toBeTruthy();
    expect(screen.getByText(/could raise your score to about/)).toBeTruthy();
  });

  it("shows how complete the resume is and what it still lacks", () => {
    const props = renderReport();
    const card = screen.getByTestId("completeness-card");
    expect(screen.getByTestId("completeness-pct").textContent).toBe("90%");
    expect(within(card).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("90");
    expect(within(card).getByText("LinkedIn")).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: /Add them in the enhancer/ }));
    expect(props.onFix).toHaveBeenCalledTimes(1);
  });

  it("says so when nothing is missing, and writes field names readably", () => {
    const model = buildAtsReport({ ats_display: { ...payload.ats_display, completeness: { score_pct: 100, missing_fields: [] } } })!;
    const { unmount } = render(<ATSScanReport model={model} fixReady preparing={false} setupError={null} onRetrySetup={vi.fn()} onFix={vi.fn()} onScanAnother={vi.fn()} />);
    expect(screen.getByText("Every detail we look for is on your resume.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add them in the enhancer/ })).toBeNull();
    unmount();

    const lacking = buildAtsReport({ ats_display: { ...payload.ats_display, completeness: { score_pct: 60, missing_fields: ["phone_number"] } } })!;
    render(<ATSScanReport model={lacking} fixReady preparing={false} setupError={null} onRetrySetup={vi.fn()} onFix={vi.fn()} onScanAnother={vi.fn()} />);
    expect(screen.getByText("Phone number")).toBeTruthy();
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

  it("lists each section with its score and bar", () => {
    renderReport();
    const sections = screen.getAllByTestId("ats-section");
    expect(sections.map((s) => s.getAttribute("aria-label"))).toEqual(["Contact", "Summary", "Education", "ATS Compatibility"]);
    expect(within(sections[1]).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
    expect(within(sections[2]).getByText("Nothing to fix here.")).toBeTruthy();
    expect(screen.getByText(/Not applicable for your profile: Experience/)).toBeTruthy();
  });

  it("explains each suggestion with its title, kind and whole points, and shows the example only on request", () => {
    renderReport();
    const summary = screen.getAllByTestId("ats-section")[1];
    expect(within(summary).getByText("Your summary names no role.")).toBeTruthy();
    const card = within(summary).getByTestId("ats-suggestion");
    expect(within(card).getByText("Rewrite your summary")).toBeTruthy();
    expect(within(card).queryByText(/impact/)).toBeNull();                       // no internal impact chip
    expect(within(card).getByText("+4 pts")).toBeTruthy();                       // 4.2 reads as 4
    expect(within(card).getByText("Quick fix")).toBeTruthy();
    expect(within(card).queryByText("Hard working student.")).toBeNull();        // collapsed by default

    fireEvent.click(within(card).getByRole("button", { name: "See example" }));
    expect(within(card).getByText("Hard working student.")).toBeTruthy();
    expect(within(card).getByText("CS graduate building Python APIs.")).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: "Hide example" }));
    expect(within(card).queryByText("Hard working student.")).toBeNull();

    const contact = within(screen.getAllByTestId("ats-section")[0]).getByTestId("ats-suggestion");
    expect(within(contact).getByText("You need to add this")).toBeTruthy();
    expect(within(contact).getByText("Missing LinkedIn profile")).toBeTruthy();
    expect(within(contact).queryByRole("button", { name: /example/i })).toBeNull();   // nothing to show
  });

  it("shows how many fixes are quick and how many need the user", () => {
    renderReport();
    expect(screen.getByTestId("ats-breakdown").textContent).toBe("1 quick fix · 1 needs your input");
  });

  it("has one Fix button per section, which opens the enhancer on that section", () => {
    const props = renderReport();
    fireEvent.click(screen.getByRole("button", { name: "Fix this section: Summary" }));
    expect(props.onFix).toHaveBeenCalledWith("Summary");
    fireEvent.click(screen.getByRole("button", { name: "Fix this section: Contact" }));
    expect(props.onFix).toHaveBeenLastCalledWith("Contact");
    expect(screen.getAllByRole("button", { name: /^Fix this section/ })).toHaveLength(2);   // none per suggestion
  });

  it("opens the enhancer without a section from the main button", () => {
    const props = renderReport();
    fireEvent.click(screen.getByRole("button", { name: /Enhance my resume/ }));
    expect(screen.queryByText(/Fix my resume in the enhancer/)).toBeNull();
    expect(props.onFix).toHaveBeenCalledWith();
  });

  it("shows what the resume says now on blue with white text, and the suggested text on green", () => {
    renderReport();
    const card = within(screen.getAllByTestId("ats-section")[1]).getByTestId("ats-suggestion");
    fireEvent.click(within(card).getByRole("button", { name: "See example" }));
    const before = within(card).getByTestId("fix-before");
    const after = within(card).getByTestId("fix-after");
    expect(before.className).toContain("bg-[#2557a7]");
    expect(before.className).toContain("text-white");
    expect(before.textContent).toContain("Hard working student.");
    expect(after.className).toContain("bg-green-600");
    expect(after.className).toContain("text-white");
    expect(after.textContent).toContain("CS graduate building Python APIs.");
  });

  it("has no Edit in enhancer button on Career Progression: it only explains the score", () => {
    const model = buildAtsReport({ ats_display: { score: 70, sections: [
      { name: "Career Progression", score_pct: 60, weighted_pts: 3, max_pts: 5, is_not_applicable: false,
        fixes: [{ id: "careerprogression_score_gap", fix_type: "manual", ui_action: "review_content", impact: "low", rank: 3,
                  penalty_pts: 2, reason: "Your latest role shows little scope." }] },
    ] } })!;
    renderReport({ model });
    const section = screen.getByTestId("ats-section");
    expect(within(section).getByText("Your latest role shows little scope.")).toBeTruthy();
    expect(within(section).queryByRole("button")).toBeNull();
    expect(screen.queryByText(/Edit in enhancer/)).toBeNull();
  });

  it("offers no Fix for a document-format finding: it only explains", () => {
    renderReport();
    const ats = screen.getAllByTestId("ats-section")[3];
    expect(within(ats).getByText("Fix a document format issue")).toBeTruthy();
    expect(within(ats).getByText("Good to know")).toBeTruthy();
    expect(within(ats).queryByRole("button")).toBeNull();
  });

  it("shows the first three suggestions of a long section and the rest on request", () => {
    const fixes = Array.from({ length: 5 }, (_, i) => ({
      id: `projects_1_sentence_weak_${i}`, fix_type: "auto", impact: "low", rank: i + 1, penalty_pts: 1, reason: `Bullet ${i + 1} is weak`,
    }));
    const model = buildAtsReport({ ats_display: { score: 70, sections: [
      { name: "Projects", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false, fixes },
    ] } })!;
    renderReport({ model });
    expect(screen.getAllByTestId("ats-suggestion")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(screen.getAllByTestId("ats-suggestion")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(screen.getAllByTestId("ats-suggestion")).toHaveLength(3);
  });

  it("shows a section with nothing to fix as one quiet line, not a full card", () => {
    renderReport();
    const education = screen.getAllByTestId("ats-section")[2];
    expect(within(education).getByText("Nothing to fix here.")).toBeTruthy();
    expect(within(education).queryByRole("progressbar")).toBeNull();
    expect(within(education).queryByRole("button")).toBeNull();
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

  it("congratulates a resume with nothing left to fix", () => {
    const clean = buildAtsReport({ ats_display: { score: 96, sections: [
      { name: "Contact", score_pct: 100, weighted_pts: 7, max_pts: 7, is_not_applicable: false, fixes: [] }] } })!;
    renderReport({ model: clean });
    expect(screen.getByText(/No suggestions right now/)).toBeTruthy();
    expect(screen.getByTestId("ats-band").textContent).toBe("Strong");
  });
});
