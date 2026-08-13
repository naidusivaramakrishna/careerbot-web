import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeJobmatchSessionSnapshot } from "@/utils/jobmatchSession";

const KEYS = ["jm_matchResults", "jm_parsedResumeData", "jm_parsedJDData", "jm_jdText"];

describe("writeJobmatchSessionSnapshot", () => {
  let store: Record<string, string>;

  const installSessionStorage = (setItem: (key: string, value: string) => void) => {
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
        setItem: vi.fn(setItem),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
      },
    });
  };

  beforeEach(() => {
    store = {};
    installSessionStorage((key, value) => { store[key] = String(value); });
  });

  const snapshot = (suffix: string) => ({
    matchResults: { id: `match-${suffix}` },
    parsedResumeData: { id: `resume-${suffix}` },
    parsedJDData: { id: `jd-${suffix}` },
    jdText: `jd text ${suffix}`,
  });

  it("writes all four keys and reports success", () => {
    expect(writeJobmatchSessionSnapshot(snapshot("1"))).toBe(true);

    expect(JSON.parse(store.jm_matchResults)).toEqual({ id: "match-1" });
    expect(JSON.parse(store.jm_parsedResumeData)).toEqual({ id: "resume-1" });
    expect(JSON.parse(store.jm_parsedJDData)).toEqual({ id: "jd-1" });
    expect(store.jm_jdText).toBe("jd text 1");
  });

  it("restores the previous run's values when a later key fails to write", () => {
    // Run 1 lands cleanly.
    expect(writeJobmatchSessionSnapshot(snapshot("1"))).toBe(true);
    const runOne = { ...store };

    // Run 2 fails on the third key (quota exceeded), after two writes landed.
    installSessionStorage((key, value) => {
      if (key === "jm_parsedJDData") throw new DOMException("QuotaExceededError");
      store[key] = String(value);
    });

    expect(writeJobmatchSessionSnapshot(snapshot("2"))).toBe(false);

    // Every key must still hold run 1's values — the two that run 2 overwrote
    // are rolled back, and the two it never reached were never touched. A
    // half-written state here is what silently pairs one run's results with
    // another run's resume/JD for the rest of the tab's lifetime.
    KEYS.forEach((key) => expect(store[key]).toBe(runOne[key]));
  });

  it("removes keys that had no prior value when the write fails", () => {
    // Nothing in storage — a first-ever analysis that fails partway.
    installSessionStorage((key, value) => {
      if (key === "jm_parsedJDData") throw new DOMException("QuotaExceededError");
      store[key] = String(value);
    });

    expect(writeJobmatchSessionSnapshot(snapshot("1"))).toBe(false);

    // Rolled back to absent rather than left holding a partial snapshot.
    KEYS.forEach((key) => expect(store[key]).toBeUndefined());
  });

  it("reports failure when the very first key cannot be written", () => {
    installSessionStorage(() => { throw new DOMException("QuotaExceededError"); });

    expect(writeJobmatchSessionSnapshot(snapshot("1"))).toBe(false);
    KEYS.forEach((key) => expect(store[key]).toBeUndefined());
  });
});
