/**
 * Unit tests for src/api/interviewPrepApi.ts
 *
 * These 11 endpoints moved off `/mock-interview/*` onto `/interview-prep/*`
 * when mockInterviewApi.ts was split into interviewPrepApi.ts (notes, practice,
 * question generation, feedback rating) and mockInterviewApi.ts (live session
 * only). Nothing previously asserted the new prefix, and no existing test
 * exercised these real functions at all — the prior mock-interview integration
 * test only hit hand-rolled fetch() paths that never corresponded to any real
 * endpoint. If the backend hasn't deployed the `/interview-prep/*` router,
 * every one of these calls 404s silently with no test to catch it.
 *
 * Covers:
 *   - generateNotes(): POSTs /interview-prep/generate-notes with a 180s timeout
 *   - getNotes(): GETs /interview-prep/notes/{resume_id}
 *   - updateNotes(): PUTs /interview-prep/notes/{resume_id} — resume-scoped,
 *       not user-scoped (regression guard: this endpoint used to be keyed by
 *       user_id, which 403'd on a resume-scoped id and silently dropped edits)
 *   - getEnglishEssentials(): GETs /interview-prep/english-essentials
 *   - startPractice(): POSTs /interview-prep/practice/start
 *   - submitPracticeAnswer(): POSTs /interview-prep/practice/answer as multipart/form-data
 *   - getPracticeProgress(): GETs /interview-prep/practice/progress?session_id=
 *   - generateTechnicalQuestions(): POSTs /interview-prep/generate-technical-questions
 *   - generateHrQuestions(): POSTs /interview-prep/generate-hr-questions with num_questions
 *   - generateMrTrQuestions(): POSTs /interview-prep/generate-mr-tr-questions
 *   - rateAnswerFeedback(): POSTs /interview-prep/feedback/rate
 *   - cross-cutting guard: none of the above ever call a /mock-interview/ path
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock httpClient (must come before importing interviewPrepApi) ─────────
// vi.mock() is hoisted, so we define the mock object inline.

vi.mock("@/lib/http", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Import after mocking
import {
  generateNotes,
  getNotes,
  updateNotes,
  getEnglishEssentials,
  startPractice,
  submitPracticeAnswer,
  getPracticeProgress,
  generateTechnicalQuestions,
  generateHrQuestions,
  generateMrTrQuestions,
  rateAnswerFeedback,
} from "@/api/interviewPrepApi";
import { httpClient as mockHttpClient } from "@/lib/http";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── generateNotes ────────────────────────────────────────────────────────────

describe("interviewPrepApi — generateNotes", () => {
  it("POSTs /interview-prep/generate-notes (not /mock-interview/generate-notes)", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { notes: {}, cached: false } });

    await generateNotes({ resume_id: "resume-1" });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/generate-notes",
      expect.objectContaining({ resume_id: "resume-1" }),
      expect.objectContaining({ timeout: 180_000 })
    );
    const calledUrl = mockHttpClient.post.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("/mock-interview/");
  });

  it("returns the generated notes payload", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { notes: { self_introduction: "Hi, I am..." }, cached: false },
    });

    const result = await generateNotes({ resume_id: "resume-1" });

    expect(result.notes.self_introduction).toBe("Hi, I am...");
    expect(result.cached).toBe(false);
  });

  it("re-throws on failure", async () => {
    mockHttpClient.post.mockRejectedValueOnce(new Error("network error"));

    await expect(generateNotes({ resume_id: "resume-1" })).rejects.toThrow("network error");
  });
});

// ─── getNotes ─────────────────────────────────────────────────────────────────

describe("interviewPrepApi — getNotes", () => {
  it("GETs /interview-prep/notes/{resume_id} (not /mock-interview/notes/...)", async () => {
    mockHttpClient.get.mockResolvedValueOnce({
      data: {
        resume_id: "resume-1",
        target_role: "Backend Engineer",
        notes: {},
        updated_at: "2026-01-01T00:00:00Z",
        source: "ai",
      },
    });

    await getNotes("resume-1");

    expect(mockHttpClient.get).toHaveBeenCalledWith("/interview-prep/notes/resume-1");
  });
});

// ─── updateNotes ──────────────────────────────────────────────────────────────

describe("interviewPrepApi — updateNotes", () => {
  it("PUTs /interview-prep/notes/{resume_id} — resume-scoped, not user-scoped", async () => {
    mockHttpClient.put.mockResolvedValueOnce({ data: { updated: true, notes: {} } });

    // Regression guard: this endpoint used to be keyed by user_id, which 403'd
    // whenever a resume-scoped id was passed — the failure was swallowed by an
    // empty .catch(), so edits looked saved and were silently lost on reload.
    await updateNotes("resume-1", { self_introduction: "Updated intro" });

    expect(mockHttpClient.put).toHaveBeenCalledWith(
      "/interview-prep/notes/resume-1",
      { notes: { self_introduction: "Updated intro" } }
    );
  });
});

// ─── getEnglishEssentials ─────────────────────────────────────────────────────

describe("interviewPrepApi — getEnglishEssentials", () => {
  it("GETs /interview-prep/english-essentials", async () => {
    mockHttpClient.get.mockResolvedValueOnce({
      data: { phrases: [], filler_replacements: {}, common_mistakes: [], phrasal_verbs: [] },
    });

    await getEnglishEssentials();

    expect(mockHttpClient.get).toHaveBeenCalledWith("/interview-prep/english-essentials");
  });
});

// ─── startPractice ────────────────────────────────────────────────────────────

describe("interviewPrepApi — startPractice", () => {
  it("POSTs /interview-prep/practice/start", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { session_id: "session-1", questions: [], round_number: 1 },
    });

    await startPractice({ round_number: 1, category: "hr" });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/practice/start",
      expect.objectContaining({ round_number: 1, category: "hr" })
    );
  });
});

// ─── submitPracticeAnswer ─────────────────────────────────────────────────────

describe("interviewPrepApi — submitPracticeAnswer", () => {
  it("POSTs /interview-prep/practice/answer as multipart/form-data", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: {
        transcript: "My answer",
        rule_based: true,
        scores: {
          content_score: 8,
          clarity_score: 8,
          structure_score: 8,
          length_score: 8,
          weighted_score: 8,
        },
        feedback: { good_points: [], improvements: [], improved_answer: "", encouragement: "" },
        rule_scores: {
          filler_count: 0,
          key_points_hit: [],
          key_points_missed: [],
          fillers_detected: [],
          rule_score: 8,
        },
      },
    });

    const formData = new FormData();
    formData.append("question_id", "q-1");

    await submitPracticeAnswer(formData);

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/practice/answer",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
  });
});

// ─── getPracticeProgress ──────────────────────────────────────────────────────

describe("interviewPrepApi — getPracticeProgress", () => {
  it("GETs /interview-prep/practice/progress with session_id param", async () => {
    mockHttpClient.get.mockResolvedValueOnce({
      data: {
        session_id: "session-1",
        total_questions: 5,
        answered: 2,
        avg_score: 7.5,
        round_number: 1,
        scores: [],
      },
    });

    await getPracticeProgress("session-1");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/interview-prep/practice/progress",
      { params: { session_id: "session-1" } }
    );
  });
});

// ─── Question generation ──────────────────────────────────────────────────────

describe("interviewPrepApi — generateTechnicalQuestions", () => {
  it("POSTs /interview-prep/generate-technical-questions", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { questions: [] } });

    await generateTechnicalQuestions({ target_role: "Backend Engineer" });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/generate-technical-questions",
      expect.objectContaining({ target_role: "Backend Engineer" })
    );
  });
});

describe("interviewPrepApi — generateHrQuestions", () => {
  it("POSTs /interview-prep/generate-hr-questions with num_questions", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { session_id: "session-1", questions: [], round_number: 1 },
    });

    await generateHrQuestions(5);

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/generate-hr-questions",
      { num_questions: 5 }
    );
  });

  it("defaults num_questions to 10 when not provided", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { session_id: "session-1", questions: [], round_number: 1 },
    });

    await generateHrQuestions();

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/generate-hr-questions",
      { num_questions: 10 }
    );
  });
});

describe("interviewPrepApi — generateMrTrQuestions", () => {
  it("POSTs /interview-prep/generate-mr-tr-questions", async () => {
    mockHttpClient.post.mockResolvedValueOnce({
      data: { session_id: "session-1", questions: [], round_number: 1 },
    });

    await generateMrTrQuestions({ mode: "MR", target_role: "Engineering Manager" });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/generate-mr-tr-questions",
      expect.objectContaining({ mode: "MR" })
    );
  });
});

// ─── rateAnswerFeedback ────────────────────────────────────────────────────────

describe("interviewPrepApi — rateAnswerFeedback", () => {
  it("POSTs /interview-prep/feedback/rate", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { recorded: true } });

    await rateAnswerFeedback({ answer_id: "answer-1", helpful: true });

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/interview-prep/feedback/rate",
      { answer_id: "answer-1", helpful: true }
    );
  });
});

// ─── Cross-cutting regression guard ───────────────────────────────────────────

describe("interviewPrepApi — no calls leak to the old /mock-interview/* prefix", () => {
  it("none of the 11 interview-prep functions call a /mock-interview/ path", async () => {
    mockHttpClient.get.mockResolvedValue({ data: {} });
    mockHttpClient.post.mockResolvedValue({ data: {} });
    mockHttpClient.put.mockResolvedValue({ data: {} });

    await Promise.allSettled([
      generateNotes({ resume_id: "r1" }),
      getNotes("r1"),
      updateNotes("r1", {}),
      getEnglishEssentials(),
      startPractice({ round_number: 1 }),
      submitPracticeAnswer(new FormData()),
      getPracticeProgress("s1"),
      generateTechnicalQuestions({}),
      generateHrQuestions(1),
      generateMrTrQuestions({ mode: "TR" }),
      rateAnswerFeedback({ answer_id: "a1", helpful: true }),
    ]);

    const allCalledUrls = [
      ...mockHttpClient.get.mock.calls,
      ...mockHttpClient.post.mock.calls,
      ...mockHttpClient.put.mock.calls,
    ].map((call) => call[0] as string);

    expect(allCalledUrls.length).toBe(11);
    for (const url of allCalledUrls) {
      expect(url.startsWith("/interview-prep/")).toBe(true);
    }
  });
});
