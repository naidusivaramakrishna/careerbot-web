import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { CoverLetterResponse } from "@/types/coverLetter";

const { mockGetCoverLetter } = vi.hoisted(() => ({
  mockGetCoverLetter: vi.fn(),
}));

vi.mock("@/api/coverLetterApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/coverLetterApi")>()),
  getCoverLetter: mockGetCoverLetter,
}));

import { useCoverLetter } from "@/hooks/useCoverLetter";

const cachedLetter = {
  letter_id: "letter-1",
  status: "ready_to_review",
  cover_letter: { greeting: "Dear hiring manager,", opening: "Opening", body: [], closing: "Closing", signature: "Candidate" },
  plain_text: "Letter text",
  generation_status: { status: "ready_to_review", requires_user_review: true },
  jd_match_matrix: [],
  grounding: {},
  metadata: {},
  warnings: [],
  reason: null,
  cache_source: "ai",
  created_at: "2026-10-15T00:00:00Z",
} satisfies CoverLetterResponse;

describe("useCoverLetter", () => {
  it("keeps the completed generation response when its background refresh fails", async () => {
    mockGetCoverLetter.mockRejectedValueOnce(new Error("network unavailable"));

    const { result } = renderHook(() => useCoverLetter("letter-1", cachedLetter));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.letter).toEqual(cachedLetter);
    expect(result.current.error).toBeNull();
  });

  it("clears a previous letter and exposes the error when the requested id changes", async () => {
    mockGetCoverLetter.mockResolvedValueOnce(cachedLetter);
    const { result, rerender } = renderHook(
      ({ letterId }) => useCoverLetter(letterId),
      { initialProps: { letterId: "letter-1" } },
    );

    await waitFor(() => expect(result.current.letter?.letter_id).toBe("letter-1"));
    mockGetCoverLetter.mockRejectedValueOnce(new Error("network unavailable"));
    rerender({ letterId: "letter-2" });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.letter).toBeNull();
    expect(result.current.error?.message).toBe("network unavailable");
  });

});
