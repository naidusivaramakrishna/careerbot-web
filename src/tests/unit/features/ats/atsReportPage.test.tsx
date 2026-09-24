import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
  default: () => <div data-testid="resume-side" />,
}));
vi.mock("@/app/(resume)/builder/creation/_components/PreviewPanel", () => ({
  default: () => <div data-testid="preview-panel" />,
}));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplatesTab", () => ({
  default: () => <div data-testid="templates-tab" />,
}));
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  ResumeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
});
