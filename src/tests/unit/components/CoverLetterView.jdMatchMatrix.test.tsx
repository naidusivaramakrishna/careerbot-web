/**
 * Render test for CoverLetterView's JDMatchMatrix placement (P2 regression).
 *
 * JDMatchMatrix existed in the codebase before this PR but was never
 * imported anywhere else (confirmed: at the base commit, `git grep
 * JDMatchMatrix -- src/app` only matches the component's own file) — it
 * was dead code. This PR is the first to render it on the cover-letter
 * review page, above the export button. That's a real, user-visible
 * product change (a whole new panel appears), not just the "Implied"
 * status tweak described in the PR title, and until now nothing verified
 * it actually renders.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CoverLetterView from "@/app/cover-letter/_components/CoverLetterView";
import { CL_FIXTURES } from "@/tests/mocks/coverLetter/fixtures";

vi.mock("@/hooks/useCoverLetterTemplates", () => ({
  useCoverLetterTemplates: () => ({
    templates: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDefaultCoverLetterTemplate", () => ({
  useDefaultCoverLetterTemplate: () => ({
    defaultTemplate: null,
    isLoading: false,
    isSaving: false,
    error: null,
    refetch: vi.fn(),
    setDefault: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDownloadCoverLetter", () => ({
  useDownloadCoverLetter: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/useUpdateCoverLetter", () => ({
  useUpdateCoverLetter: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("CoverLetterView — JDMatchMatrix placement (P2 regression)", () => {
  it("renders the JD match matrix panel for a ready-to-review letter with entries", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    expect(screen.getByText("JD match")).toBeInTheDocument();
  });

  it("does not render a JD match matrix panel when jd_match_matrix is empty", () => {
    const letter = { ...CL_FIXTURES.readyToReview, jd_match_matrix: [] };
    render(<CoverLetterView letter={letter} />);
    expect(screen.queryByText("JD match")).not.toBeInTheDocument();
  });
});
