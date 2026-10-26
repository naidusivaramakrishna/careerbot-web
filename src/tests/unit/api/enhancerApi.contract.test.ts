import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHttpClient = vi.hoisted(() => ({
  patch: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/http", () => ({ default: mockHttpClient }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { api: { request: vi.fn() }, debug: vi.fn() },
}));

import {
  ENHANCER_REQUEST_TIMEOUT_MS,
  applyFix,
  autoSaveEnhancedResume,
  deleteFix,
  enhanceResume,
  deleteSectionItemFromEnhancedResume,
  updateEnhancedResume,
} from "@/api/enhancerApi";
import { apiErrorCode, TARGET_ROLE_REQUIRED } from "@/utils/apiErrorCode";
import targetRoleRequiredBody from "@/tests/fixtures/enhancer/__fixtures__/targetRoleRequired.json";
import aiFixtures from "@/tests/fixtures/enhancer/__fixtures__/ai.json";

const axiosResponse = (data: unknown) => ({ data, status: 200, headers: {} });

const education = [{ id: "edu-1", school: "State University", degree: "B.Tech", startDate: "Aug 2021", endDate: "May 2025" }];
const snapshot = { success: true, enhanced_resume_id: "enhanced-test-1", revision: 2, enhanced_data: { education } };

describe("enhancer API mutation contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sends the enhanced section save to its canonical endpoint without changing the payload", async () => {
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse(snapshot));

    await expect(updateEnhancedResume("enhanced-test-1", { enhanced_sections: { education } }))
      .resolves.toEqual(snapshot);

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-test-1",
      { enhanced_sections: { education } },
      undefined,
    );
  });

  it("returns and broadcasts the score of a bulk save that wraps the record in enhanced_resume", async () => {
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse(aiFixtures.bulk));
    const onSync = vi.fn();
    window.addEventListener("enhanced-resume-score-sync", onSync);

    // The editor's section delete and ResumeContext's sync read the score at the top level
    // (EditorTab onDeleteAsync, onEnhancedResumeSync); without it they fall back to a local guess.
    const response = await updateEnhancedResume("enh-1", { enhanced_sections: { education: [] } }) as unknown as Record<string, { score?: unknown }>;
    window.removeEventListener("enhanced-resume-score-sync", onSync);

    expect(response.ats_display?.score).toBe(aiFixtures.bulk.enhanced_resume.score);
    const payload = (onSync.mock.calls[0][0] as CustomEvent).detail.payload;
    expect(payload.ats_display.score).toBe(aiFixtures.bulk.enhanced_resume.score);
  });

  it("autosaves sections to the autosave endpoint with the sections as the body", async () => {
    const snapshot = { revision: 3 };
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse(snapshot));
    const onSync = vi.fn();
    window.addEventListener("enhanced-resume-score-sync", onSync);

    // The server snapshot is returned to the caller and broadcast tagged as an
    // autosave so ResumeContext syncs score/suggestions without replacing resumeData.
    await expect(autoSaveEnhancedResume("enhanced-test-1", { education })).resolves.toEqual(snapshot);
    window.removeEventListener("enhanced-resume-score-sync", onSync);

    expect(mockHttpClient.patch).toHaveBeenCalledWith("/resume/enhance/enhanced-test-1/autosave", { education }, undefined);
    expect(onSync).toHaveBeenCalledTimes(1);
    expect((onSync.mock.calls[0][0] as CustomEvent).detail).toMatchObject({
      enhancedId: "enhanced-test-1",
      origin: "autosave",
    });
  });

  it("propagates an autosave failure to the caller", async () => {
    mockHttpClient.patch.mockRejectedValueOnce(new Error("network down"));

    await expect(autoSaveEnhancedResume("enhanced-test-1", { education })).rejects.toThrow("network down");
  });

  it("keeps apply and undo requests suggestion-specific", async () => {
    mockHttpClient.post
      .mockResolvedValueOnce(axiosResponse(snapshot))
      .mockResolvedValueOnce(axiosResponse({ ...snapshot, revision: 3 }));

    await applyFix({
      enhancer_state: "enhanced-test-1",
      suggestion_id: "education_issue_0",
      fix_type: "manual",
      value: "May 2025",
    });
    await deleteFix({ enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0" });

    expect(mockHttpClient.post).toHaveBeenNthCalledWith(1, "/resume/enhance/apply", {
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0", fix_type: "manual", value: "May 2025",
    }, { timeout: ENHANCER_REQUEST_TIMEOUT_MS });
    expect(mockHttpClient.post).toHaveBeenNthCalledWith(2, "/resume/enhance/delete-fix", {
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0",
    }, { timeout: ENHANCER_REQUEST_TIMEOUT_MS });          // an undo replays later fixes, so it may take as long as an apply
  });

  it("deletes a section item by its URL-encoded id", async () => {
    mockHttpClient.delete.mockResolvedValueOnce(axiosResponse({}));

    await deleteSectionItemFromEnhancedResume("enhanced-test-1", "education", "edu 1/a");

    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-test-1/sections/education/items/edu%201%2Fa",
    );
  });
});

describe("enhancer API long-running calls and AI-layer errors", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("explains a timeout in words instead of showing axios' own text", async () => {
    mockHttpClient.post.mockRejectedValue(Object.assign(new Error("timeout of 330000ms exceeded"), { isAxiosError: true, code: "ECONNABORTED" }));

    await expect(enhanceResume({ resume_id: "resume-1", target_role: "Software Developer" })).rejects.toThrow(/taking longer than usual/);
  });

  it("uses a neutral timeout text for any other call, not the scan wording", async () => {
    mockHttpClient.patch.mockRejectedValue(Object.assign(new Error("timeout of 120000ms exceeded"), { isAxiosError: true, code: "ECONNABORTED" }));

    await expect(autoSaveEnhancedResume("enhanced-test-1", { education })).rejects.toThrow("The request timed out. Please try again.");
  });

  it("waits longer than a scan can take (up to about 190 s of AI plus 100 s of automatic fixes)", async () => {
    expect(ENHANCER_REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(300_000);
  });

  it("waits longer than the AI layer's 180 s request limit for enhance and apply", async () => {
    expect(ENHANCER_REQUEST_TIMEOUT_MS).toBeGreaterThan(180_000);
    mockHttpClient.post.mockResolvedValue(axiosResponse({ success: true }));

    await enhanceResume({ resume_id: "resume-1", target_role: "Software Developer" });
    await applyFix({ enhancer_state: "enhanced-test-1", suggestion_id: "contact_issue_0", fix_type: "manual", value: "x" } as never);

    for (const call of mockHttpClient.post.mock.calls) {
      expect(call[2]).toEqual({ timeout: ENHANCER_REQUEST_TIMEOUT_MS });
    }
  });

  it("tells the user what to add when the enhancement gate rejects a resume", async () => {
    const gate = {
      success: false,
      error: {
        message: "Your resume has no Experience, Internships or Projects section.",
        error_code: "HTTP_422",
        details: {
          error: "no_evidence_section",
          blocking_reason: "no_evidence_section",
          suggestions: ["Add an internship.", "Add 2 projects."],
        },
      },
    };
    mockHttpClient.post.mockRejectedValueOnce(Object.assign(new Error("x"), {
      isAxiosError: true, response: { status: 422, data: gate },
    }));

    await expect(enhanceResume({ resume_id: "resume-1", target_role: "Software Developer" })).rejects.toThrow(
      "Your resume has no Experience, Internships or Projects section. Add an internship. Add 2 projects.",
    );
  });

  it("shows the backend's message and keeps its code when no role can be found", async () => {
    // The 422 the backend really sends for a missing role (shared with the scan-stage test).
    mockHttpClient.post.mockRejectedValueOnce(Object.assign(new Error("x"), {
      isAxiosError: true, response: { status: 422, data: targetRoleRequiredBody },
    }));

    const error = await enhanceResume({ resume_id: "resume-1", target_role: "Software Developer" }).catch((e) => e);

    expect(error.message).toContain("could not tell which role");
    expect(apiErrorCode(error)).toBe(TARGET_ROLE_REQUIRED);   // so the page asks for a role instead of showing an error
  });
});
