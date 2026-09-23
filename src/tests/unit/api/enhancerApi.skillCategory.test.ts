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

describe("enhanced skill category paths", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps slash-containing categories routable across every mutation", async () => {
    mockHttpClient.post.mockResolvedValueOnce(response({ id: "skill-1" }));
    mockHttpClient.delete.mockResolvedValue(response({ success: true }));

    await addSkillToEnhancedResume("enhanced-1", "CI/CD & Delivery", "Jenkins Basics");
    await deleteSkillFromEnhancedResume("enhanced-1", "CI/CD & Delivery", "skill/1");
    await deleteSkillCategoryFromEnhancedResume("enhanced-1", "CI/CD & Delivery");

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/resume/enhance/enhanced-1/skills/CI/CD%20%26%20Delivery",
      { name: "Jenkins Basics" },
    );
    expect(mockHttpClient.delete).toHaveBeenNthCalledWith(
      1,
      "/resume/enhance/enhanced-1/skills/CI/CD%20%26%20Delivery/skill%2F1",
    );
    expect(mockHttpClient.delete).toHaveBeenNthCalledWith(
      2,
      "/resume/enhance/enhanced-1/skills/categories/CI/CD%20%26%20Delivery",
    );
  });
});