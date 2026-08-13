import type * as JobTracking from "@/utils/jobTracking";

describe("saved job tracking", () => {
  let jobTracking: typeof JobTracking;

  beforeEach(async () => {
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
    // jobTracking.ts tracks "did THIS page load write the unscoped bucket"
    // in an in-memory (not persisted) module variable — resetting the module
    // simulates a fresh page load so that state can't leak between tests.
    vi.resetModules();
    jobTracking = await import("@/utils/jobTracking");
  });

  it("keeps a job visible when it was saved before the user id resolved", () => {
    const { toggleJobSaved, getSavedJobs, getSavedJobsCount, isJobSaved } = jobTracking;
    expect(toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", null)).toBe(true);

    expect(getSavedJobs("user-1")).toEqual([
      expect.objectContaining({ jobId: "job-1", title: "Engineer" }),
    ]);
    expect(getSavedJobsCount("user-1")).toBe(1);
    expect(isJobSaved("job-1", "user-1")).toBe(true);
  });

  it("removes both scoped and pre-user-id copies when unsaving", () => {
    const { toggleJobSaved, getSavedJobs } = jobTracking;
    toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", null);
    localStorage.setItem(
      "savedJobs:user-1",
      JSON.stringify([{ jobId: "job-1", title: "Engineer", company: "Acme", location: "Remote", type: "Full-time", savedAt: "2026-01-01" }])
    );

    expect(toggleJobSaved("job-1", "Engineer", "Acme", "Remote", "Full-time", "user-1")).toBe(false);
    expect(getSavedJobs("user-1")).toEqual([]);
  });

  it("migrates a same-load unscoped save into the resolving user's scoped bucket, then clears the shared bucket", () => {
    const { toggleJobSaved, getSavedJobs } = jobTracking;
    localStorage.setItem(
      "savedJobs:user-1",
      JSON.stringify([{ jobId: "job-1", title: "Engineer", company: "Acme", location: "Remote", type: "Full-time", savedAt: "2026-01-01" }])
    );
    // Same load writes a second, different job before the id resolved — this
    // is the only case the migration should fold in.
    toggleJobSaved("job-2", "Designer", "Acme", "Remote", "Full-time", null);

    expect(getSavedJobs("user-1")).toHaveLength(2);
    expect(localStorage.getItem("savedJobs")).toBeNull();
  });

  it("does not leak a leftover unscoped bucket into an account that never wrote it this load", () => {
    const { getSavedJobs, toggleJobSaved } = jobTracking;
    // Simulates a previous account's unscoped write surviving into a new
    // page load — nothing in THIS load wrote the unscoped bucket, so it must
    // not be attributed to whichever account resolves next.
    localStorage.setItem(
      "savedJobs",
      JSON.stringify([{ jobId: "job-1", title: "Engineer", company: "Acme", location: "Remote", type: "Full-time", savedAt: "2026-01-01" }])
    );

    expect(getSavedJobs("user-B")).toEqual([]);

    // User B saving their own job must not persist the foreign record into
    // savedJobs:user-B either.
    toggleJobSaved("job-2", "Designer", "Acme", "Remote", "Full-time", "user-B");
    const persisted = JSON.parse(localStorage.getItem("savedJobs:user-B") || "[]");
    expect(persisted).toHaveLength(1);
    expect(persisted[0].jobId).toBe("job-2");
  });
});
