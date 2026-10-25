import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const nav = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  params: new URLSearchParams("resume_id=src-1"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  useSearchParams: () => nav.params,
}));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: vi.fn(), getEnhancedResume: vi.fn() }));
const clearStored = vi.hoisted(() => vi.fn());
vi.mock("@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage", () => ({
  clearStoredFixedSuggestions: clearStored,
  clearStoredFixedText: vi.fn(),
}));

import { enhanceResume, getEnhancedResume } from "@/api/enhancerApi";
import ATSLoginReportPage from "@/app/(resume)/atslogin/report/page";

const photo = "data:image/png;base64," + "A".repeat(4096);
const report = (extra: Record<string, unknown> = {}) => ({
  resume_id: "src-1",
  target_role: "Software Developer",          // the role the scan was made for; a re-scan sends it
  enhanced_resume_id: null,
  ats_score: { final_score: 60 },
  enhanced_resume: { contact: { name: "Avery" } },
  ...extra,
});

// What a scan stores: careerbot-ai's sections with their fixes.
const display = (score: number, fixes: Array<Record<string, unknown>> = []) => ({
  score,
  sections: [
    { name: "Contact", score_pct: 80, weighted_pts: 5.6, max_pts: 7, is_not_applicable: false,
      fixes: [{ id: "contact_issue_0", fix_type: "manual", impact: "low", rank: 2, penalty_pts: 1.4, reason: "Missing LinkedIn profile" }] },
    { name: "Summary", score_pct: 40, weighted_pts: 2.8, max_pts: 7, is_not_applicable: false,
      fixes: [{ id: "suggested_summary_0", fix_type: "auto", impact: "medium", rank: 1, penalty_pts: 4.2,
                before_example: "Hard working student.", after_example: "CS graduate building Python APIs." }] },
    ...fixes.length ? [{ name: "Skills", score_pct: 50, weighted_pts: 5, max_pts: 10, is_not_applicable: false, fixes }] : [],
  ],
});

const realLocalSetItem = vi.mocked(window.localStorage.setItem).getMockImplementation()!;

const storedWrites = () => [
  ...vi.mocked(window.localStorage.setItem).mock.calls,
  ...Object.keys(window.sessionStorage).map((key) => [key, window.sessionStorage.getItem(key) ?? ""]),
];

const reportShown = () => waitFor(() => expect(screen.getByTestId("ats-score")).toBeTruthy());

describe("ATS scan report page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(window.localStorage.setItem).mockClear();
    vi.mocked(enhanceResume).mockReset();
    vi.mocked(getEnhancedResume).mockReset();
    nav.router.push.mockClear();
    nav.router.replace.mockClear();
    clearStored.mockClear();
  });
  afterEach(() => {
    vi.mocked(window.localStorage.setItem).mockImplementation(realLocalSetItem);
  });

  describe("the report", () => {
    it("shows the score, the sections and every suggestion with its details", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({
        enhanced_resume_id: "enh-1", ats_display: display(61.4),
      })));
      vi.mocked(getEnhancedResume).mockResolvedValue({ id: "enh-1", original_resume_id: "src-1", enhanced_data: {}, applied_fixes: [] } as never);

      render(<ATSLoginReportPage />);
      await reportShown();

      expect(screen.getByTestId("ats-score").textContent).toBe("61");
      expect(screen.getAllByTestId("ats-section").map((s) => s.getAttribute("aria-label"))).toEqual(["Contact", "Summary"]);
      expect(screen.getByText("Rewrite your summary")).toBeTruthy();
      expect(screen.queryByText("Hard working student.")).toBeNull();             // the example opens on request
      fireEvent.click(screen.getByRole("button", { name: "See example" }));
      expect(screen.getByText("Hard working student.")).toBeTruthy();
      expect(screen.getByText("CS graduate building Python APIs.")).toBeTruthy();
      expect(screen.getByText("Missing LinkedIn profile")).toBeTruthy();
    });

    it("has no resume preview or editor: it is only a report", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1", ats_display: display(61) })));
      vi.mocked(getEnhancedResume).mockResolvedValue({ id: "enh-1", original_resume_id: "src-1", enhanced_data: {}, applied_fixes: [] } as never);

      render(<ATSLoginReportPage />);
      await reportShown();

      expect(screen.queryByTestId("preview-panel")).toBeNull();
      expect(screen.queryByTestId("resume-side")).toBeNull();
      expect(screen.queryByRole("dialog", { name: "Resume templates" })).toBeNull();
      expect(nav.router.replace).not.toHaveBeenCalled(); // no more forcing ?source=enhanced on this page
    });

    it("shows the score the server holds now, not the one stored when the scan ran", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1", ats_display: display(55) })));
      vi.mocked(getEnhancedResume).mockResolvedValue({
        id: "enh-1", original_resume_id: "src-1", enhanced_data: {}, applied_fixes: [{ suggestion_id: "suggested_summary_0" }],
        enhancer_state: { ats_display: display(72.5) }, ats_score: { final_score: 72.5 },
      } as never);

      render(<ATSLoginReportPage />);

      await waitFor(() => expect(screen.getByTestId("ats-score").textContent).toBe("73"));
    });
  });

  describe("Fix", () => {
    const open = async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1", ats_display: display(61) })));
      vi.mocked(getEnhancedResume).mockResolvedValue({ id: "enh-1", original_resume_id: "src-1", enhanced_data: {}, applied_fixes: [] } as never);
      render(<ATSLoginReportPage />);
      await reportShown();
      await waitFor(() => expect((screen.getByRole("button", { name: "Fix this section: Summary" }) as HTMLButtonElement).disabled).toBe(false));
    };

    it("opens the enhancer on that suggestion's section", async () => {
      await open();
      fireEvent.click(screen.getByRole("button", { name: "Fix this section: Summary" }));
      expect(nav.router.push).toHaveBeenCalledWith("/builder/creation/enh-1?source=enhanced&from_ats=true&open_section=Summary");
    });

    it("opens the enhancer on the matching section for another suggestion", async () => {
      await open();
      fireEvent.click(screen.getByRole("button", { name: "Fix this section: Contact" }));
      expect(nav.router.push).toHaveBeenCalledWith("/builder/creation/enh-1?source=enhanced&from_ats=true&open_section=Contact");
    });

    it("opens the enhancer from the main button", async () => {
      await open();
      fireEvent.click(screen.getByRole("button", { name: /Enhance my resume/ }));
      expect(nav.router.push).toHaveBeenCalledWith("/builder/creation/enh-1?source=enhanced&from_ats=true");
    });

    it("keeps Fix disabled, and goes nowhere, until the enhancer record is ready", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ ats_display: display(61) })));
      let release: (value: unknown) => void = () => undefined;
      vi.mocked(enhanceResume).mockReturnValue(new Promise((resolve) => { release = resolve; }) as never);

      render(<ATSLoginReportPage />);
      await reportShown();

      const fix = screen.getByRole("button", { name: "Fix this section: Summary" }) as HTMLButtonElement;
      expect(fix.disabled).toBe(true);
      fireEvent.click(fix);
      expect(nav.router.push).not.toHaveBeenCalled();

      release({ success: true, enhanced_resume_id: "enh-9", enhanced_resume: {}, applied_fixes: [] });
      await waitFor(() => expect(fix.disabled).toBe(false));
    });
  });

  it("scans another resume from the header", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1", ats_display: display(61) })));
    vi.mocked(getEnhancedResume).mockResolvedValue({ id: "enh-1", original_resume_id: "src-1", enhanced_data: {}, applied_fixes: [] } as never);
    render(<ATSLoginReportPage />);
    await reportShown();

    fireEvent.click(screen.getByRole("button", { name: /Scan another resume/ }));

    expect(nav.router.push).toHaveBeenCalledWith("/atslogin");
  });

  it("recovers from a corrupted enhanced_resume_ids cache instead of failing setup", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
    window.localStorage.setItem("enhanced_resume_ids", "{not json");
    vi.mocked(enhanceResume).mockResolvedValueOnce({
      success: true,
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery" } },
    } as never);

    render(<ATSLoginReportPage />);

    await reportShown();
    await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends the credit-charging enhance request once under a StrictMode double mount", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
    vi.mocked(enhanceResume).mockResolvedValue({
      success: true,
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery" } },
    } as never);

    render(<React.StrictMode><ATSLoginReportPage /></React.StrictMode>);

    await reportShown();
    await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(1));
  });

  it("does not write embedded images from a pre-existing cached report back into browser storage", async () => {
    // Reports cached before this change were stored unstripped.
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery", profile_picture: photo } },
    })));
    vi.mocked(window.localStorage.setItem).mockClear();

    render(<ATSLoginReportPage />);

    await reportShown();
    const writes = storedWrites().filter(([key]) => String(key).startsWith("atsAnalysis"));
    expect(writes.length).toBeGreaterThan(0);
    for (const [, value] of writes) expect(String(value)).not.toContain("data:image/");
  });

  it("drops a stale localStorage report when the fresh write fails, so the newer sessionStorage copy is read", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
    vi.mocked(window.localStorage.setItem).mockImplementation((key: string, value: string) => {
      if (key.startsWith("atsAnalysis")) throw new DOMException("quota", "QuotaExceededError");
      realLocalSetItem(key, value);
    });
    vi.mocked(enhanceResume).mockResolvedValueOnce({
      success: true,
      enhanced_resume_id: "enh-2",
      enhanced_resume: { contact: { name: "Avery" } },
    } as never);

    render(<ATSLoginReportPage />);

    await reportShown();
    await waitFor(() => {
      const readBack = window.localStorage.getItem("atsAnalysis_src-1") ?? window.sessionStorage.getItem("atsAnalysis_src-1");
      expect(JSON.parse(readBack!).enhanced_resume_id).toBe("enh-2");
    });
  });

  it("still shows the whole report when the enhancer cannot be prepared, and lets the user retry", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ finalWeightedScore: 64, ats_display: display(64) })));
    vi.mocked(enhanceResume).mockRejectedValueOnce(new Error("Service unavailable"));

    render(<ATSLoginReportPage />);

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Service unavailable"));
    expect(screen.getByTestId("ats-score").textContent).toBe("64");
    expect((screen.getByRole("button", { name: "Fix this section: Summary" }) as HTMLButtonElement).disabled).toBe(true);

    vi.mocked(enhanceResume).mockResolvedValueOnce({ success: true, enhanced_resume_id: "enh-3", enhanced_resume: {}, applied_fixes: [] } as never);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Fix this section: Summary" }) as HTMLButtonElement).disabled).toBe(false));
  });

  describe("blocked browser storage", () => {
    const realLocalGetItem = vi.mocked(window.localStorage.getItem).getMockImplementation()!;
    const blocked = () => { throw new DOMException("The operation is insecure.", "SecurityError"); };
    let sessionGetItem: { mockRestore: () => void } | undefined;
    afterEach(() => {
      vi.mocked(window.localStorage.getItem).mockImplementation(realLocalGetItem);
      sessionGetItem?.mockRestore();
      sessionGetItem = undefined;
    });

    it("reads the report from sessionStorage when localStorage.getItem throws", async () => {
      window.sessionStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1" })));
      vi.mocked(window.localStorage.getItem).mockImplementation(blocked);

      render(<ATSLoginReportPage />);

      await reportShown();
      expect(enhanceResume).not.toHaveBeenCalled();
    });

    it("shows No Report Found instead of crashing when both storages throw", async () => {
      vi.mocked(window.localStorage.getItem).mockImplementation(blocked);
      sessionGetItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);

      render(<ATSLoginReportPage />);

      await waitFor(() => expect(screen.getByText("No Report Found")).toBeTruthy());
      expect(enhanceResume).not.toHaveBeenCalled();
    });
  });

  describe("fixes already saved on the scanned file", () => {
    it("tells the user when the scanned file already has applied fixes", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true,
        enhanced_resume_id: "enh-1",
        enhanced_resume: { contact: { name: "Avery" } },
        applied_fixes: [{ suggestion_id: "a" }, { suggestion_id: "b" }],
      } as never);

      render(<ATSLoginReportPage />);

      const banner = await screen.findByTestId("prior-fixes-dialog");
      expect(banner.textContent).toContain("2 fixes applied");
      fireEvent.click(screen.getByText("Continue with my changes"));
      expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
      expect(enhanceResume).toHaveBeenCalledTimes(1);
    });

    it("shows no banner for a record with no applied fixes", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true, enhanced_resume_id: "enh-1", enhanced_resume: {}, applied_fixes: [],
      } as never);

      render(<ATSLoginReportPage />);

      await reportShown();
      await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
    });

    it("shows no banner when the only applied fixes are the ones the scan applied itself (mode auto)", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true, enhanced_resume_id: "enh-1", enhanced_resume: {},
        applied_fixes: [
          { suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true },
          { suggestion_id: "project_1_sentence_weak_0", status: "applied", undo_available: true, auto: true },
        ],
      } as never);

      render(<ATSLoginReportPage />);

      await reportShown();
      await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
    });

    it("still asks when the user had applied a fix of their own next to the automatic ones", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true, enhanced_resume_id: "enh-1", enhanced_resume: {},
        applied_fixes: [
          { suggestion_id: "suggested_summary_0", status: "applied", undo_available: true, auto: true },
          { suggestion_id: "education_issue_3_grade", status: "applied", undo_available: true },
        ],
      } as never);

      render(<ATSLoginReportPage />);

      await reportShown();
      expect(await screen.findByTestId("prior-fixes-dialog")).toBeTruthy();
    });

    it("scans the original again only after the user confirms, then clears the banner", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-1", enhanced_resume: {},
          applied_fixes: [{ suggestion_id: "a" }],
        } as never)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-2", enhanced_resume: {}, applied_fixes: [],
        } as never);

      render(<ATSLoginReportPage />);
      await screen.findByTestId("prior-fixes-dialog");

      fireEvent.click(screen.getByText("Start with fresh data"));
      expect(enhanceResume).toHaveBeenCalledTimes(1);          // nothing sent before confirming
      expect(screen.getByTestId("prior-fixes-dialog").textContent).toContain("discards the 1 fix");

      fireEvent.click(screen.getByText("Yes, start fresh"));
      await waitFor(() => expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull());
      expect(enhanceResume).toHaveBeenLastCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Software Developer", force_refresh: true });
      // The fresh record reuses the old ID: what this browser kept for it (green
      // cards, highlights) must be forgotten or the enhancer shows old fixes.
      expect(clearStored).toHaveBeenCalledWith("enh-2");
      expect(clearStored).toHaveBeenCalledWith("enh-1");
    });

    it("keeps the saved fixes when the user cancels the rescan", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true, enhanced_resume_id: "enh-1", enhanced_resume: {}, applied_fixes: [{ suggestion_id: "a" }],
      } as never);

      render(<ATSLoginReportPage />);
      await screen.findByTestId("prior-fixes-dialog");
      fireEvent.click(screen.getByText("Start with fresh data"));
      fireEvent.click(screen.getByText("Cancel"));

      expect(screen.getByTestId("prior-fixes-dialog").textContent).toContain("1 fix applied");
      expect(enhanceResume).toHaveBeenCalledTimes(1);
    });

    it("shows the banner when the report already names its saved record (a re-scan of a known file)", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1" })));
      vi.mocked(getEnhancedResume).mockResolvedValue({
        id: "enh-1", original_resume_id: "src-1", enhanced_data: {},
        applied_fixes: [{ suggestion_id: "a" }, { suggestion_id: "b" }],
      } as never);

      render(<ATSLoginReportPage />);

      const banner = await screen.findByTestId("prior-fixes-dialog");
      expect(banner.textContent).toContain("2 fixes applied");
      expect(enhanceResume).not.toHaveBeenCalled();           // no credit-charging scan just to show a note
    });

    it("shows no banner and still shows the report when the saved record cannot be read", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1" })));
      vi.mocked(getEnhancedResume).mockRejectedValue(new Error("offline"));

      render(<ATSLoginReportPage />);

      await reportShown();
      expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
    });

    it("scans again when the saved record the report names is gone (stale after a re-parse)", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-old" })));
      const notFound = Object.assign(new Error("not found"), { __raw: { detail: { error: "enhanced_resume_not_found" } } });
      vi.mocked(getEnhancedResume).mockRejectedValue(notFound);
      vi.mocked(enhanceResume).mockResolvedValueOnce({
        success: true, enhanced_resume_id: "enh-new", enhanced_resume: { contact: { name: "Avery" } }, applied_fixes: [],
      } as never);

      render(<ATSLoginReportPage />);

      await reportShown();
      await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(1));
      expect(enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Software Developer" });
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("asks again, like the upload dialog, when the service keeps the saved fixes on a fresh scan", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
      vi.mocked(enhanceResume)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-1", enhanced_resume: {}, applied_fixes: [{ suggestion_id: "a" }],
        } as never)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-1", enhanced_resume: {},
          applied_fixes: [{ suggestion_id: "a" }, { suggestion_id: "b" }],
        } as never);

      render(<ATSLoginReportPage />);
      await screen.findByTestId("prior-fixes-dialog");
      fireEvent.click(screen.getByText("Start with fresh data"));
      fireEvent.click(screen.getByText("Yes, start fresh"));

      await waitFor(() => expect(enhanceResume).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.getByText("Yes, start fresh")).not.toBeDisabled());
      expect(screen.getByTestId("prior-fixes-dialog").textContent).toContain("discards the 2 fixes");
      expect(screen.getByTestId("ats-score")).toBeTruthy();
      expect(clearStored).not.toHaveBeenCalled(); // the fixes are still saved: keep the browser's copy

      fireEvent.click(screen.getByText("Cancel"));
      fireEvent.click(screen.getByText("Continue with my changes"));
      expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
    });

    it("ties the fresh scan to the same ATS breakdown the first scan used", async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ ats_breakdown_id: "bd-9" })));
      vi.mocked(enhanceResume)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-1", enhanced_resume: {}, applied_fixes: [{ suggestion_id: "a" }],
        } as never)
        .mockResolvedValueOnce({
          success: true, enhanced_resume_id: "enh-2", enhanced_resume: {}, applied_fixes: [],
        } as never);

      render(<ATSLoginReportPage />);
      await screen.findByTestId("prior-fixes-dialog");
      fireEvent.click(screen.getByText("Start with fresh data"));
      fireEvent.click(screen.getByText("Yes, start fresh"));

      await waitFor(() => expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull());
      expect(enhanceResume).toHaveBeenLastCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Software Developer", force_refresh: true, ats_breakdown: "bd-9" });
    });
  });
});
