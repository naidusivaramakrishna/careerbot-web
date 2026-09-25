import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/http", () => ({ default: mockHttpClient }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { api: { request: vi.fn() }, debug: vi.fn(), warn: vi.fn() },
}));

import {
  addSkillToEnhancedResume,
  deleteSkillCategoryFromEnhancedResume,
  deleteSkillFromEnhancedResume,
} from "@/api/enhancerApi";

const response = (data: unknown) => ({ data, status: 200, headers: {} });

describe("enhanced Skill mutation synchronization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes every successful skill mutation for canonical resume/score refresh", async () => {
    mockHttpClient.post.mockResolvedValueOnce(response({ id: "skill-1" }));
    mockHttpClient.delete
      .mockResolvedValueOnce(response({ success: true }))
      .mockResolvedValueOnce(response({ success: true }));
    const onSync = vi.fn();
    window.addEventListener("enhanced-resume-score-sync", onSync);

    await addSkillToEnhancedResume("enhanced-1", "programming_languages", "Python");
    await deleteSkillFromEnhancedResume("enhanced-1", "programming_languages", "Python");
    await deleteSkillCategoryFromEnhancedResume("enhanced-1", "custom_category");

    expect(onSync).toHaveBeenCalledTimes(3);
    expect(onSync.mock.calls.map(([event]) => event.detail)).toEqual([
      { enhancedId: "enhanced-1", payload: { id: "skill-1" } },
      { enhancedId: "enhanced-1", payload: { success: true } },
      { enhancedId: "enhanced-1", payload: { success: true } },
    ]);
    window.removeEventListener("enhanced-resume-score-sync", onSync);
  });
});
