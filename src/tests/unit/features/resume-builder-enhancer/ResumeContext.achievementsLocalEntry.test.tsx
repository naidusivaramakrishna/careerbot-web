/**
 * Companion to ResumeContext.achievementsNoDuplicate.test.tsx.
 *
 * That test pins the duplication half of the report: an unrelated Save must
 * not re-append the resume's own already-saved achievements. This one pins the
 * other half, which the same reconciliation path owns: an achievement the user
 * has typed but NOT saved yet must survive an unrelated Save too.
 *
 * Both sections come back from the parser/AI service as plain strings, so
 * resumeMappers.ts maps every entry — saved or not — to an id-less object.
 * "Drop the whole section and take the server copy" therefore loses the
 * not-yet-saved entry, and "keep every id-less local entry" duplicates the
 * saved ones. The reconciliation has to tell them apart by content.
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
  getSectionOrder: vi.fn(() => ["Personal Info", "Professional Summary", "Achievements", "Languages"]),
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

const serverAchievements = [
  "Won April Code Challenge by NXT Wave for innovative coding solutions.",
  "Developed an award-winning VR Project in NXT Wave's Hackathon.",
];
const serverLanguages = ["English", "Telugu"];

const echoSave = () =>
  mockHttp.patch.mockResolvedValueOnce({
    status: 200,
    headers: {},
    data: {
      ats_score: { final_score: 80, section_breakdown: {} },
      enhanced_resume: {
        enhanced_data: {
          ...baseData,
          achievements: serverAchievements,
          languages: serverLanguages,
        },
      },
    },
  });

describe("ResumeContext — a not-yet-saved achievement/language survives an unrelated Save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getEnhancedResume).mockResolvedValue({
      id: "enhanced-1",
      enhanced_data: {
        ...baseData,
        achievements: serverAchievements,
        languages: serverLanguages,
      },
    } as never);
  });

  it("keeps the locally added entries and does not duplicate the saved ones", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Veni");
    expect(latest.resumeData.achievements).toHaveLength(2);
    expect(latest.resumeData.languages).toHaveLength(2);

    // The user types a new achievement and a new language, and does NOT save.
    await act(async () => {
      latest.setResumeData((previous) => ({
        ...previous,
        achievements: [
          ...(previous.achievements ?? []),
          { title: "Typed but not saved yet", date: "", description: "" },
        ],
        languages: [...(previous.languages ?? []), { name: "Hindi", proficiency: "" }],
      }));
    });
    expect(latest.resumeData.achievements).toHaveLength(3);
    expect(latest.resumeData.languages).toHaveLength(3);

    // Now Professional Summary is saved. Its response echoes only the server's
    // own achievements/languages back — it knows nothing about the new entries.
    echoSave();
    await act(async () => {
      await updateEnhancedResume("enhanced-1", {
        enhanced_sections: { professionalSummary: baseData.professionalSummary },
      });
    });
    await waitFor(() => expect(latest.enhancedDataVersion).toBeGreaterThan(0));

    expect(latest.resumeData.achievements?.map((a) => a.title)).toEqual([
      ...serverAchievements,
      "Typed but not saved yet",
    ]);
    expect(latest.resumeData.languages?.map((l) => l.name)).toEqual([
      ...serverLanguages,
      "Hindi",
    ]);
  });
});
