import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheBuilderResume, rememberEnhancedResumeId } from "@/app/(resume)/atslogin/report/atsReportCache";

const quotaError = () => new DOMException("The quota has been exceeded.", "QuotaExceededError");

describe("ATS report cache helpers", () => {
  beforeEach(() => {
    vi.mocked(window.localStorage.setItem).mockReset();
    vi.mocked(window.localStorage.getItem).mockReset();
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
  });

  it("does not throw when localStorage quota is exceeded while caching the builder resume", () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw quotaError(); });
    expect(() => cacheBuilderResume("enh-1", { contact: { name: "Avery" } })).not.toThrow();
  });

  it("does not throw when localStorage quota is exceeded while remembering the enhanced id", () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw quotaError(); });
    expect(() => rememberEnhancedResumeId("enh-1")).not.toThrow();
  });

  it("tolerates a corrupted enhanced_resume_ids value", () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue("{not json");
    expect(() => rememberEnhancedResumeId("enh-1")).not.toThrow();
    expect(window.localStorage.setItem).toHaveBeenCalledWith("current_resume_id", "enh-1");
  });

  it("strips embedded images before caching server data", () => {
    const photo = "data:image/png;base64," + "A".repeat(4096);
    cacheBuilderResume("enh-1", { contact: { name: "Avery", profile_picture: photo } });

    const call = vi.mocked(window.localStorage.setItem).mock.calls.find(([key]) => key === "cached_resume_data");
    expect(call).toBeTruthy();
    expect(call![1]).not.toContain("data:image/");
    expect(call![1]).toContain("Avery");
  });
});
