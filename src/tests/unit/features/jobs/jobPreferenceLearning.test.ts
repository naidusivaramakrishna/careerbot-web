import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDailyShortlist,
  getJobQualitySignal,
  recordJobPreferenceSignal,
} from "@/utils/jobPreferenceLearning";

describe("job preference learning", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.mocked(localStorage.getItem).mockImplementation((key) => store.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => { store.set(key, value); });
    vi.mocked(localStorage.removeItem).mockImplementation((key) => { store.delete(key); });
    vi.mocked(localStorage.clear).mockImplementation(() => { store.clear(); });
  });

  it("prioritizes jobs similar to a saved role", () => {
    recordJobPreferenceSignal("saved", {
      id: "saved-react",
      title: "React Engineer",
      skills: "React TypeScript",
    });

    const shortlist = buildDailyShortlist([
      { id: "java", title: "Java Engineer", skills: "Java Spring", matchScore: 70 },
      { id: "react", title: "React Developer", skills: "React TypeScript", matchScore: 70 },
    ]);

    expect(shortlist[0].id).toBe("react");
  });

  it("removes dismissed jobs from the daily shortlist", () => {
    const dismissed = { id: "dismissed", title: "Old role", matchScore: 90 };
    recordJobPreferenceSignal("dismissed", dismissed);
    recordJobPreferenceSignal("dismissed", dismissed);

    const shortlist = buildDailyShortlist([
      dismissed,
      { id: "kept", title: "Relevant role", matchScore: 70 },
    ]);

    expect(shortlist.map((job) => job.id)).toEqual(["kept"]);
  });

  it("reports transparent listing-quality evidence", () => {
    const quality = getJobQualitySignal({
      id: "quality",
      company: "Acme",
      location: "Remote",
      source: "Company site",
      url: "https://example.com/job",
      posted_date: new Date().toISOString(),
      description: "A".repeat(240),
    });

    expect(quality.label).toBe("High confidence");
    expect(quality.reasons).toContain("Application link available");
    expect(quality.reasons).toContain("Detailed description");
  });
});
