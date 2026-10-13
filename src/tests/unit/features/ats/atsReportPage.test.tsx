import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const nav = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  params: new URLSearchParams("resume_id=src-1&source=enhanced"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  useSearchParams: () => nav.params,
}));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: vi.fn(), getEnhancedResume: vi.fn() }));
vi.mock("@/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide", () => ({
  default: ({ tabRequest, atsFixMode }: { tabRequest?: { tab: string; id: number }; atsFixMode?: boolean }) => (
    <div
      data-testid="resume-side"
      data-requested-tab={tabRequest?.tab ?? ""}
      data-request-id={tabRequest?.id ?? ""}
      data-ats-fix-mode={atsFixMode ? "true" : "false"}
    />
  ),
}));
// Mirrors the real toolbar: PreviewPanel.tsx handleResumeScoreClick and the Templates / Job Match buttons.
// ATS Scan passes hideJobMatch, so — like the real toolbar — the Job Match
// button simply is not rendered; it is not just inert.
vi.mock("@/app/(resume)/builder/creation/_components/PreviewPanel", () => ({
  default: ({ onTabClick, onOpenSidebar, hideJobMatch }: { onTabClick: (tab: string) => void; onOpenSidebar?: (tab: string) => void; hideJobMatch?: boolean }) => (
    <div data-testid="preview-panel">
      <button onClick={() => { onOpenSidebar?.("Score"); onTabClick("Score"); }}>Toolbar Score</button>
      <button onClick={() => onTabClick("Templates")}>Toolbar Templates</button>
      {!hideJobMatch && <button onClick={() => onTabClick("Job Match")}>Toolbar Job Match</button>}
    </div>
  ),
}));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplatesTab", () => ({
  default: () => <div data-testid="templates-tab" />,
}));
const clearStored = vi.hoisted(() => vi.fn());
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({ enhancedAtsScore: null, enhancedSuggestions: [{ id: "a", status: "pending", fix_type: "auto" }] }),
  ResumeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage", () => ({
  clearStoredFixedSuggestions: clearStored,
  clearStoredFixedText: vi.fn(),
}));
vi.mock("@/app/(resume)/builder/creation/_context/ScoreContext", () => ({
  ScoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { enhanceResume, getEnhancedResume } from "@/api/enhancerApi";
import ATSLoginReportPage from "@/app/(resume)/atslogin/report/page";

const photo = "data:image/png;base64," + "A".repeat(4096);
const report = (extra: Record<string, unknown> = {}) => ({
  resume_id: "src-1",
  enhanced_resume_id: null,
  ats_score: { final_score: 60 },
  enhanced_resume: { contact: { name: "Avery" } },
  ...extra,
});

const realLocalSetItem = vi.mocked(window.localStorage.setItem).getMockImplementation()!;

const storedWrites = () => [
  ...vi.mocked(window.localStorage.setItem).mock.calls,
  ...Object.keys(window.sessionStorage).map((key) => [key, window.sessionStorage.getItem(key) ?? ""]),
];

describe("ATS report workspace setup", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(window.localStorage.setItem).mockClear();
    vi.mocked(enhanceResume).mockReset();
    vi.mocked(getEnhancedResume).mockReset();
    clearStored.mockClear();
  });
  afterEach(() => {
    vi.mocked(window.localStorage.setItem).mockImplementation(realLocalSetItem);
  });

  it("recovers from a corrupted enhanced_resume_ids cache instead of failing workspace setup", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
    window.localStorage.setItem("enhanced_resume_ids", "{not json");
    vi.mocked(enhanceResume).mockResolvedValueOnce({
      success: true,
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery" } },
    } as never);

    render(<ATSLoginReportPage />);

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    expect(screen.queryByText("Could not prepare ATS fixes")).toBeNull();
    expect(enhanceResume).toHaveBeenCalledTimes(1);
  });

  it("sends the credit-charging enhance request once under a StrictMode double mount", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report()));
    vi.mocked(enhanceResume).mockResolvedValue({
      success: true,
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery" } },
    } as never);

    render(<React.StrictMode><ATSLoginReportPage /></React.StrictMode>);

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    expect(enhanceResume).toHaveBeenCalledTimes(1);
  });

  it("does not write embedded images from a pre-existing cached report back into browser storage", async () => {
    // Reports cached before this change were stored unstripped.
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({
      enhanced_resume_id: "enh-1",
      enhanced_resume: { contact: { name: "Avery", profile_picture: photo } },
    })));
    vi.mocked(window.localStorage.setItem).mockClear();

    render(<ATSLoginReportPage />);

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
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

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    const readBack = window.localStorage.getItem("atsAnalysis_src-1") ?? window.sessionStorage.getItem("atsAnalysis_src-1");
    expect(JSON.parse(readBack!).enhanced_resume_id).toBe("enh-2");
  });

  it("still shows the scanned ATS score when workspace setup fails", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ finalWeightedScore: 64 })));
    vi.mocked(enhanceResume).mockRejectedValueOnce(new Error("Service unavailable"));

    render(<ATSLoginReportPage />);

    await waitFor(() => expect(screen.getByText("Could not prepare ATS fixes")).toBeTruthy());
    expect(screen.getByTestId("ats-score-fallback").textContent).toMatch(/64\s*\/\s*100/);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
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

      await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
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

  describe("preview toolbar buttons", () => {
    const renderWorkspace = async () => {
      window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1" })));
      render(<ATSLoginReportPage />);
      await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    };

    it("Score asks the ATS sidebar for its Score tab on every click", async () => {
      await renderWorkspace();

      fireEvent.click(screen.getByText("Toolbar Score"));
      const side = screen.getByTestId("resume-side");
      expect(side.getAttribute("data-requested-tab")).toBe("Score");
      const firstId = side.getAttribute("data-request-id");

      fireEvent.click(screen.getByText("Toolbar Score"));
      expect(screen.getByTestId("resume-side").getAttribute("data-request-id")).not.toBe(firstId);
    });

    it("does not offer Job Match — ATS Scan is a report-only, score-fix workspace", async () => {
      await renderWorkspace();

      expect(screen.queryByText("Toolbar Job Match")).toBeNull();
      expect(screen.queryByTestId("job-match-tab")).toBeNull();
    });

    it("puts the ATS sidebar in atsFixMode, so it shows Score only, never the section editor", async () => {
      await renderWorkspace();

      expect(screen.getByTestId("resume-side").getAttribute("data-ats-fix-mode")).toBe("true");
    });

    it("small-screen fix drawer is collapsed by default and toggles accessibly", async () => {
      await renderWorkspace();
      const toggle = screen.getByRole("button", { name: /ATS fixes/ });
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.textContent).toContain("1 left");

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(document.getElementById("ats-fix-panel")?.className).toContain("max-h-[60vh]");

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
    });

    it("Templates still opens the templates panel", async () => {
      await renderWorkspace();

      fireEvent.click(screen.getByText("Toolbar Templates"));

      expect(screen.getByRole("dialog", { name: "Resume templates" })).toBeTruthy();
      expect(screen.getByTestId("templates-tab")).toBeTruthy();
    });
  });

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

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
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
    expect(enhanceResume).toHaveBeenLastCalledWith({ resume_id: "src-1", force_refresh: true });
    // The fresh record reuses the old ID: what this browser kept for it (green
    // cards, highlights) must be forgotten or the new workspace shows old fixes.
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

  it("shows no banner and still opens the workspace when the saved record cannot be read", async () => {
    window.localStorage.setItem("atsAnalysis_src-1", JSON.stringify(report({ enhanced_resume_id: "enh-1" })));
    vi.mocked(getEnhancedResume).mockRejectedValue(new Error("offline"));

    render(<ATSLoginReportPage />);

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
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

    await waitFor(() => expect(screen.getByTestId("resume-side")).toBeTruthy());
    expect(enhanceResume).toHaveBeenCalledTimes(1);
    expect(enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1" });
    expect(screen.queryByText("Could not prepare ATS fixes")).toBeNull();
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
    expect(enhanceResume).toHaveBeenLastCalledWith({ resume_id: "src-1", force_refresh: true, ats_breakdown: "bd-9" });
  });
});
