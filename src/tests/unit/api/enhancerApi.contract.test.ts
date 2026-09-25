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

  it("autosaves sections to the autosave endpoint with the sections as the body", async () => {
    mockHttpClient.patch.mockResolvedValueOnce(axiosResponse({}));

    await expect(autoSaveEnhancedResume("enhanced-test-1", { education })).resolves.toBeUndefined();

    expect(mockHttpClient.patch).toHaveBeenCalledWith("/resume/enhance/enhanced-test-1/autosave", { education });
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
    }, undefined);
    expect(mockHttpClient.post).toHaveBeenNthCalledWith(2, "/resume/enhance/delete-fix", {
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0",
    }, undefined);
  });

  it("deletes a section item by its URL-encoded id", async () => {
    mockHttpClient.delete.mockResolvedValueOnce(axiosResponse({}));

    await deleteSectionItemFromEnhancedResume("enhanced-test-1", "education", "edu 1/a");

    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-test-1/sections/education/items/edu%201%2Fa",
    );
  });
});
