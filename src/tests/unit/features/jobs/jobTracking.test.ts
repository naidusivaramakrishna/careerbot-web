import {
  getSavedJobs,
  getSavedJobsCount,
  isJobSaved,
  toggleJobSaved,
} from "@/utils/jobTracking";

describe("saved job tracking", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = String(value); }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach((key) => delete store[key]); }),
      },
    });
  });

  it("keeps a job visible when it was saved before the user id resolved", () => {
    expect(toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", null)).toBe(true);

    expect(getSavedJobs("user-1")).toEqual([
      expect.objectContaining({ jobId: "job-1", title: "Engineer" }),
    ]);
    expect(getSavedJobsCount("user-1")).toBe(1);
    expect(isJobSaved("job-1", "user-1")).toBe(true);
  });

  it("removes both scoped and pre-user-id copies when unsaving", () => {
    toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", null);
    localStorage.setItem(
      "savedJobs:user-1",
      JSON.stringify([{ jobId: "job-1", title: "Engineer", company: "Acme", location: "Remote", type: "Full-time", savedAt: "2026-01-01" }])
    );

    expect(toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", "user-1")).toBe(false);
    expect(getSavedJobs("user-1")).toEqual([]);
  });

  it("de-duplicates the same saved job across both storage buckets", () => {
    const saved = { jobId: "job-1", title: "Engineer", company: "Acme", location: "Remote", type: "Full-time", savedAt: "2026-01-01" };
    localStorage.setItem("savedJobs", JSON.stringify([saved]));
    localStorage.setItem("savedJobs:user-1", JSON.stringify([saved]));

    expect(getSavedJobs("user-1")).toHaveLength(1);
  });
});
