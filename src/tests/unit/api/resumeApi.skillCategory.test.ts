import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/http", () => ({ httpClient: mockHttpClient }));
vi.mock("@/lib/logger", () => ({
  default: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import {
  addSkillToCategory,
  deleteSkillById,
  deleteSkillCategory,
} from "@/api/resumeApi";

describe("builder skill category paths", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps slash-containing categories routable across every mutation", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { id: "skill-1" } });
    mockHttpClient.delete.mockResolvedValue({ data: { success: true } });

    await addSkillToCategory("resume-1", "CI/CD & Delivery", "Jenkins Basics");
    await deleteSkillById("resume-1", "CI/CD & Delivery", "skill/1");
    await deleteSkillCategory("resume-1", "CI/CD & Delivery");

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/resumes/resume-1/skills/CI/CD%20%26%20Delivery",
      { name: "Jenkins Basics" },
    );
    expect(mockHttpClient.delete).toHaveBeenNthCalledWith(
      1,
      "/resumes/resume-1/skills/CI/CD%20%26%20Delivery/skill%2F1",
    );
    expect(mockHttpClient.delete).toHaveBeenNthCalledWith(
      2,
      "/resumes/resume-1/skills/categories/CI/CD%20%26%20Delivery",
    );
  });
});