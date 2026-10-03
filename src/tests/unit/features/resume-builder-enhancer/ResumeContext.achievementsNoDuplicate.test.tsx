/**
 * Regression test for a real report: with only 3 achievements on a resume,
 * saving ANY OTHER section (e.g. professional summary) duplicated them in
 * the live preview -- export stayed correct.
 *
 * Root cause: the AI parser returns achievements as plain strings, so
 * resumeMappers.ts's mapping never attaches an id to them (unlike every
 * other ID_KEYED_ARRAY_SECTIONS entry). mergeSectionPreservingLocalIdLess
 * treats "no id" as "a brand-new, not-yet-saved local entry that must be
 * preserved across an unrelated save" -- so it re-appended every one of the
 * resume's own already-saved achievements onto the freshly re-mapped
 * (identical) server copy, doubling the list. Saving Achievements itself
 * doesn't trigger this (the section IS in that save's `savedSections`, so
 * the merge is skipped), which matches the report exactly. Export reads
 * straight from the backend, bypassing this client-side reconciliation
 * entirely, so it was never affected.
 *
 * This drives the real updateEnhancedResume (only the HTTP client is mocked)
 * into a mounted ResumeProvider, mirroring
 * ResumeContext.explicitSaveNoDuplicate.test.tsx's Projects case.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/http", () => ({ default: mockHttp, httpClient: mockHttp }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn(), api: { request: vi.fn() } },
}));
vi.mock("@/api/resumeApi", () => ({
  getResumeById: vi.fn(),
  getDefaultTemplate: vi.fn(async () => ({ template_id: "modern_blue" })),
}));
vi.mock("@/api/enhancerApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/enhancerApi")>()),
  getEnhancedResume: vi.fn(),
}));
vi.mock("@/app/(resume)/templates/_utils/sectionOrder", () => ({
  getSectionOrder: vi.fn(() => ["Personal Info", "Professional Summary", "Achievements"]),
}));

import { ResumeProvider, useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { getEnhancedResume, updateEnhancedResume } from "@/api/enhancerApi";

type Ctx = ReturnType<typeof useResume>;
let latest: Ctx;
const Consumer = () => {
  latest = useResume();
  return <p>Name: {latest.resumeData.personalInfo.fullname || "empty"}</p>;
};

const baseData = {
  personalInfo: { fullname: "Veni", email: "veni@example.com", phone: "+917671052890", location: "Madanapalli" },
  professionalSummary: { summary: "Full-stack developer", targetRole: "Developer" },
};

const threeAchievements = [
  "Won April Code Challenge by NXT Wave for innovative coding solutions.",
  "Developed an award-winning VR Project in NXT Wave's Hackathon.",
  "Engaged in social service initiatives and actively participated in college hackathons.",
];

describe("ResumeContext — achievements do not duplicate on an unrelated Save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getEnhancedResume).mockResolvedValue({
      id: "enhanced-1",
      enhanced_data: { ...baseData, achievements: threeAchievements },
    } as never);
  });

  it("keeps exactly 3 achievements after saving a different section", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Veni");
    expect(latest.resumeData.achievements).toHaveLength(3);

    // Saving Professional Summary: its response echoes the SAME 3
    // achievements back unchanged (the server is authoritative, not
    // reporting anything new), since this section is not being saved.
    mockHttp.patch.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        ats_score: { final_score: 80, section_breakdown: {} },
        enhanced_resume: {
          enhanced_data: { ...baseData, achievements: threeAchievements },
        },
      },
    });
    await act(async () => {
      await updateEnhancedResume("enhanced-1", {
        enhanced_sections: { professionalSummary: baseData.professionalSummary },
      });
    });

    await waitFor(() => expect(latest.enhancedDataVersion).toBeGreaterThan(0));
    expect(latest.resumeData.achievements).toHaveLength(3);
    expect(latest.resumeData.achievements?.map((a) => a.title)).toEqual(threeAchievements);
  });

  it("still does not duplicate across two consecutive unrelated saves", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Veni");

    for (let i = 0; i < 2; i++) {
      mockHttp.patch.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {
          ats_score: { final_score: 80, section_breakdown: {} },
          enhanced_resume: {
            enhanced_data: { ...baseData, achievements: threeAchievements },
          },
        },
      });
      await act(async () => {
        await updateEnhancedResume("enhanced-1", {
          enhanced_sections: { professionalSummary: baseData.professionalSummary },
        });
      });
      await waitFor(() => expect(latest.enhancedDataVersion).toBeGreaterThan(i));
    }

    expect(latest.resumeData.achievements).toHaveLength(3);
  });
});
