/**
 * Regression test for #83 review P1-1: an explicit Save of a brand-new
 * (id-less) entry showed it twice.
 *
 * updateEnhancedResume (the explicit Save path in EditorTab.handleSaveForm)
 * broadcasts its response on "enhanced-resume-score-sync". ResumeProvider's
 * listener then runs syncEnhancedResumeData, whose
 * mergeSectionPreservingLocalIdLess kept every server item AND re-appended
 * every local id-less item. The saved section's response already contains
 * the new entry (now with a server id), so the local id-less copy was kept
 * alongside it -- and the next Save sent that copy, creating a real
 * duplicate on the server.
 *
 * This drives the real updateEnhancedResume (only the HTTP client is mocked)
 * into a mounted ResumeProvider.
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
  getSectionOrder: vi.fn(() => ["Personal Info", "Professional Summary", "Projects"]),
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
  personalInfo: { fullname: "Avery", email: "avery@example.com", phone: "+14155550101", location: "Remote" },
  professionalSummary: { summary: "Summary", targetRole: "Engineer" },
};

const newProject = {
  title: "Brand New Project",
  description: "Built it",
  technologies: [],
  startDate: "",
  endDate: "",
  link: "",
};

describe("ResumeContext — explicit Save of a new entry (P1-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getEnhancedResume).mockResolvedValue({
      id: "enhanced-1",
      enhanced_data: { ...baseData, projects: [] },
    } as never);
  });

  it("keeps exactly one entry, carrying the server id, after Save broadcasts its response", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Avery");

    // The user adds a new project: Projects deliberately leaves it id-less
    // until the server assigns one.
    await act(async () => {
      latest.setResumeData((previous) => ({ ...previous, projects: [newProject] }));
    });
    expect(latest.resumeData.projects).toHaveLength(1);

    // Explicit Save: EditorTab sends the whole section, the server echoes it
    // back with the id it assigned.
    mockHttp.patch.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        // A Save re-scores the resume, so its response carries a score
        // snapshot (without one the listener would also re-GET the resume).
        ats_score: { final_score: 80, section_breakdown: {} },
        enhanced_resume: {
          enhanced_data: {
            ...baseData,
            projects: [{ id: "proj-server-1", name: "Brand New Project", description: "Built it" }],
          },
        },
      },
    });
    await act(async () => {
      await updateEnhancedResume("enhanced-1", {
        enhanced_sections: { projects: latest.resumeData.projects },
      });
    });

    await waitFor(() => expect(latest.enhancedDataVersion).toBeGreaterThan(0));
    expect(latest.resumeData.projects).toHaveLength(1);
    expect(latest.resumeData.projects?.[0]).toEqual(
      expect.objectContaining({ id: "proj-server-1", title: "Brand New Project" }),
    );
  });

  it("still preserves an id-less entry in a section the Save did NOT send", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Avery");

    await act(async () => {
      latest.setResumeData((previous) => ({ ...previous, projects: [newProject] }));
    });

    // Saving a DIFFERENT section: its response knows nothing about the
    // unsaved project, which must survive (the original reason for the
    // re-append).
    mockHttp.patch.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        ats_score: { final_score: 80, section_breakdown: {} },
        enhanced_resume: { enhanced_data: { ...baseData, projects: [] } },
      },
    });
    await act(async () => {
      await updateEnhancedResume("enhanced-1", {
        enhanced_sections: { professionalSummary: baseData.professionalSummary },
      });
    });

    await waitFor(() => expect(latest.enhancedDataVersion).toBeGreaterThan(0));
    expect(latest.resumeData.projects).toEqual([expect.objectContaining({ title: "Brand New Project" })]);
    expect(latest.resumeData.projects?.[0]).not.toHaveProperty("id");
  });
});
