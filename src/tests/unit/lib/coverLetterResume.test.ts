/**
 * Unit tests for src/lib/coverLetterResume.ts
 *
 * Covers:
 *   - getCoverLetterParsedResumeId() — null/undefined guards, explicit parser
 *     ID priority chain, fallback to builder id with parsed_data guard,
 *     whitespace trimming, empty string rejection
 *   - hasCoverLetterUsableResume() — truthy/falsy delegation
 */

import {
  getCoverLetterParsedResumeId,
  hasCoverLetterUsableResume,
  type CoverLetterResumeCandidate,
} from "@/lib/coverLetterResume";

// ── getCoverLetterParsedResumeId() ─────────────────────────────────────────

describe("getCoverLetterParsedResumeId()", () => {
  it("returns null for null input", () => {
    expect(getCoverLetterParsedResumeId(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getCoverLetterParsedResumeId(undefined)).toBeNull();
  });

  it("returns null for an empty object with no parsed_data", () => {
    expect(getCoverLetterParsedResumeId({})).toBeNull();
  });

  // ── Explicit parser ID priority chain ───────────────────────────────────

  it("returns parsed_resume_id when present", () => {
    const resume: CoverLetterResumeCandidate = { parsed_resume_id: "pid-001" };
    expect(getCoverLetterParsedResumeId(resume)).toBe("pid-001");
  });

  it("returns resume_id when parsed_resume_id is absent", () => {
    const resume: CoverLetterResumeCandidate = { resume_id: "rid-002" };
    expect(getCoverLetterParsedResumeId(resume)).toBe("rid-002");
  });

  it("returns parser_resume_id when parsed_resume_id and resume_id are absent", () => {
    const resume: CoverLetterResumeCandidate = { parser_resume_id: "prid-003" };
    expect(getCoverLetterParsedResumeId(resume)).toBe("prid-003");
  });

  it("returns resume_parser_id when the first three are absent", () => {
    const resume: CoverLetterResumeCandidate = { resume_parser_id: "rpid-004" };
    expect(getCoverLetterParsedResumeId(resume)).toBe("rpid-004");
  });

  it("prefers parsed_resume_id over resume_id when both present", () => {
    const resume: CoverLetterResumeCandidate = {
      parsed_resume_id: "first",
      resume_id: "second",
    };
    expect(getCoverLetterParsedResumeId(resume)).toBe("first");
  });

  // ── Fallback to builder id with parsed_data guard ───────────────────────

  it("returns id when parsed_data is present and non-empty", () => {
    const resume: CoverLetterResumeCandidate = {
      id: "builder-id-123",
      parsed_data: { name: "Jane" },
    };
    expect(getCoverLetterParsedResumeId(resume)).toBe("builder-id-123");
  });

  it("returns _id when id is absent but _id and parsed_data are present", () => {
    const resume: CoverLetterResumeCandidate = {
      _id: "mongo-id-456",
      parsed_data: { name: "Jane" },
    };
    expect(getCoverLetterParsedResumeId(resume)).toBe("mongo-id-456");
  });

  it("returns null when only id is present but parsed_data is absent", () => {
    const resume: CoverLetterResumeCandidate = { id: "builder-only" };
    expect(getCoverLetterParsedResumeId(resume)).toBeNull();
  });

  it("returns null when parsed_data is an empty object", () => {
    const resume: CoverLetterResumeCandidate = {
      id: "builder-id",
      parsed_data: {},
    };
    expect(getCoverLetterParsedResumeId(resume)).toBeNull();
  });

  it("returns null when parsed_data is null", () => {
    const resume: CoverLetterResumeCandidate = {
      id: "builder-id",
      parsed_data: null,
    };
    expect(getCoverLetterParsedResumeId(resume)).toBeNull();
  });

  it("returns null when parsed_data is a non-object (number)", () => {
    const resume: CoverLetterResumeCandidate = {
      id: "builder-id",
      parsed_data: 42,
    };
    expect(getCoverLetterParsedResumeId(resume)).toBeNull();
  });

  // ── Whitespace trimming ──────────────────────────────────────────────────

  it("trims whitespace from parsed_resume_id", () => {
    const resume: CoverLetterResumeCandidate = {
      parsed_resume_id: "  pid-whitespace  ",
    };
    expect(getCoverLetterParsedResumeId(resume)).toBe("pid-whitespace");
  });

  it("returns null for parsed_resume_id that is all whitespace", () => {
    const resume: CoverLetterResumeCandidate = {
      parsed_resume_id: "   ",
      parsed_data: { name: "Jane" },
      id: "fallback-id",
    };
    // All-whitespace explicit IDs are rejected; falls through to builder id.
    expect(getCoverLetterParsedResumeId(resume)).toBe("fallback-id");
  });

  it("returns null for an empty string parsed_resume_id (falls through)", () => {
    const resume: CoverLetterResumeCandidate = {
      parsed_resume_id: "",
      id: "fallback-id",
      parsed_data: { name: "Jane" },
    };
    expect(getCoverLetterParsedResumeId(resume)).toBe("fallback-id");
  });

  it("returns null when all IDs are empty strings and parsed_data is absent", () => {
    const resume: CoverLetterResumeCandidate = {
      parsed_resume_id: "",
      resume_id: "",
      parser_resume_id: "",
      resume_parser_id: "",
      id: "",
      _id: "",
    };
    expect(getCoverLetterParsedResumeId(resume)).toBeNull();
  });
});

// ── hasCoverLetterUsableResume() ───────────────────────────────────────────

describe("hasCoverLetterUsableResume()", () => {
  it("returns true when resume has a usable parsed ID", () => {
    const resume: CoverLetterResumeCandidate = { parsed_resume_id: "pid-001" };
    expect(hasCoverLetterUsableResume(resume)).toBe(true);
  });

  it("returns true when resume has builder id + non-empty parsed_data", () => {
    const resume: CoverLetterResumeCandidate = {
      id: "builder-id",
      parsed_data: { name: "Jane" },
    };
    expect(hasCoverLetterUsableResume(resume)).toBe(true);
  });

  it("returns false when resume has no usable ID", () => {
    expect(hasCoverLetterUsableResume({})).toBe(false);
  });

  it("returns false for null", () => {
    expect(hasCoverLetterUsableResume(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(hasCoverLetterUsableResume(undefined)).toBe(false);
  });

  it("returns false when builder id present but parsed_data is empty", () => {
    const resume: CoverLetterResumeCandidate = { id: "builder-id", parsed_data: {} };
    expect(hasCoverLetterUsableResume(resume)).toBe(false);
  });
});
