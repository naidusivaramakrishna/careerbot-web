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
  applyFix,
  autoSaveEnhancedResume,
  deleteFix,
  deleteSectionItemFromEnhancedResume,
  updateEnhancedResume,
} from "@/api/enhancerApi";
import { fixedEducationSnapshot } from "@/tests/fixtures/enhancer/canonicalSnapshots";

const axiosResponse = (data: unknown) => ({ data, status: 200, headers: {} });

describe("enhancer API mutation contract", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("sends the enhanced section save to its canonical endpoint without changing the payload", async () => {
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse(fixedEducationSnapshot));

    await expect(updateEnhancedResume("enhanced-test-1", {
      enhanced_sections: { education: fixedEducationSnapshot.enhanced_data.education },
    })).resolves.toEqual(fixedEducationSnapshot);

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-test-1",
      { enhanced_sections: { education: fixedEducationSnapshot.enhanced_data.education } },
      undefined,
    );
  });

  it("publishes the complete server snapshot after enhanced autosave", async () => {
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse(fixedEducationSnapshot));
    const onSync = vi.fn();
    window.addEventListener("enhanced-resume-score-sync", onSync);

    await autoSaveEnhancedResume("enhanced-test-1", { education: fixedEducationSnapshot.enhanced_data.education });

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync.mock.calls[0][0]).toMatchObject({
      detail: { enhancedId: "enhanced-test-1", payload: fixedEducationSnapshot },
    });
    window.removeEventListener("enhanced-resume-score-sync", onSync);
  });

  it("keeps apply and undo requests suggestion-specific", async () => {
    mockHttpClient.post
      .mockResolvedValueOnce(axiosResponse(fixedEducationSnapshot))
      .mockResolvedValueOnce(axiosResponse({ ...fixedEducationSnapshot, revision: 3 }));

    await applyFix({
      enhancer_state: "enhanced-test-1",
      suggestion_id: "education_issue_0",
      fix_type: "manual",
      value: "May 2025",
    });
    await deleteFix({ enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0" });

    expect(mockHttpClient.post).toHaveBeenNthCalledWith(1, "/resume/enhance/apply", {
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0", fix_type: "manual", value: "May 2025",
    }, undefined);
    expect(mockHttpClient.post).toHaveBeenNthCalledWith(2, "/resume/enhance/delete-fix", {
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0",
    }, undefined);
  });

  it("publishes the canonical post-delete snapshot for every section item", async () => {
    mockHttpClient.delete.mockResolvedValueOnce(axiosResponse(fixedEducationSnapshot));
    const onSync = vi.fn();
    window.addEventListener("enhanced-resume-score-sync", onSync);

    await deleteSectionItemFromEnhancedResume("enhanced-test-1", "education", "edu-1");

    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-test-1/sections/education/items/edu-1",
    );
    expect(onSync.mock.calls[0][0]).toMatchObject({
      detail: { enhancedId: "enhanced-test-1", payload: fixedEducationSnapshot },
    });
    window.removeEventListener("enhanced-resume-score-sync", onSync);
  });
});
