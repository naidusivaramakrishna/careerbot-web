/**
 * Required-field validation tests for /cover-letter/new
 * (src/app/cover-letter/new/page.tsx — CoverLetterStepOneMock).
 *
 * Covers the "Company name / Job title / Location / Signature name are
 * required, Hiring manager stays optional" rule:
 *   - Continue button ("Generate cover letter") stays disabled until all
 *     four required fields are filled (plus resume + job description).
 *   - Hiring manager alone is never a blocker.
 *   - Required fields render a red asterisk; Hiring manager renders
 *     "(optional)" instead.
 *   - handleSubmit blocks and surfaces an inline error if a required field
 *     is somehow empty at submit time (defense in depth beyond the
 *     disabled button).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_RESUME = {
  resume_id: "resume-1",
  source: "parser" as const,
  display_name: "Test Resume",
  parsed_data: {},
};

vi.mock("@/hooks/useHasParsedResume", () => ({
  useHasParsedResume: () => ({
    hasResume: true,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useLatestParsedResume", () => ({
  useLatestParsedResume: () => ({
    resume: MOCK_RESUME,
    resumeSchemaVersion: "2.0",
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDefaultCoverLetterResume", () => ({
  useDefaultCoverLetterResume: () => ({
    defaultResume: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCurrentUserId", () => ({
  useCurrentUserId: () => ({
    userId: "user-1",
    isLoading: false,
    error: null,
  }),
}));

const mockGenerateMutate = vi.fn();
vi.mock("@/hooks/useGenerateCoverLetter", () => ({
  useGenerateCoverLetter: () => ({
    mutate: mockGenerateMutate,
    retry: vi.fn(),
    abort: vi.fn(),
    isLoading: false,
    data: null,
    error: null,
  }),
}));

vi.mock("@/api/coverLetterApi", () => ({
  listCoverLetterResumeOptions: vi.fn().mockResolvedValue({ resumes: [] }),
  setDefaultCoverLetterResume: vi.fn(),
}));

vi.mock("@/components/SignUpModal", () => ({
  default: () => null,
}));

vi.mock("@/app/cover-letter/_components/CoverLetterTemplatePreview", () => ({
  CoverLetterTemplatePreview: () => <div data-testid="template-preview" />,
}));

import CoverLetterNewPage from "@/app/cover-letter/new/page";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_JD =
  "We are hiring a Senior Backend Engineer to design and own our core " +
  "payments platform, working closely with product and infra teams.";

async function renderPage() {
  render(<CoverLetterNewPage />);
  // Wait for the mocked async effects (listCoverLetterResumeOptions, etc.)
  // to settle before interacting.
  return waitFor(() =>
    screen.getByPlaceholderText("Paste the full job description here...")
  );
}

function fillRequiredFieldsExceptOne(omit: "company" | "role" | "location" | "signature" | null = null) {
  if (omit !== "company") {
    fireEvent.change(screen.getByPlaceholderText("e.g. Globex Corporation"), {
      target: { value: "Globex Corporation" },
    });
  }
  if (omit !== "role") {
    fireEvent.change(screen.getByPlaceholderText("e.g. Senior Backend Engineer"), {
      target: { value: "Senior Backend Engineer" },
    });
  }
  if (omit !== "location") {
    fireEvent.change(screen.getByPlaceholderText("e.g. Bengaluru, India"), {
      target: { value: "Bengaluru, India" },
    });
  }
  if (omit !== "signature") {
    fireEvent.change(screen.getByPlaceholderText("e.g. Ananya Rao"), {
      target: { value: "Ananya Rao" },
    });
  }
}

function fillJobDescription() {
  fireEvent.change(
    screen.getByPlaceholderText("Paste the full job description here..."),
    { target: { value: VALID_JD } }
  );
}

function getContinueButton() {
  return screen.getByRole("button", { name: /Generate cover letter/i });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("/cover-letter/new — required field validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps Continue disabled when the job description is missing, even with all detail fields filled", async () => {
    await renderPage();
    fillRequiredFieldsExceptOne();

    expect(getContinueButton()).toBeDisabled();
  });

  it("keeps Continue disabled when company name is empty", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne("company");

    expect(getContinueButton()).toBeDisabled();
  });

  it("keeps Continue disabled when job title is empty", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne("role");

    expect(getContinueButton()).toBeDisabled();
  });

  it("keeps Continue disabled when location is empty", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne("location");

    expect(getContinueButton()).toBeDisabled();
  });

  it("keeps Continue disabled when signature name is empty", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne("signature");

    expect(getContinueButton()).toBeDisabled();
  });

  it("enables Continue once resume, JD, and all four required fields are filled — hiring manager left blank", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne();

    // Hiring manager is intentionally never filled in this test.
    expect(screen.getByPlaceholderText("e.g. Priya Sharma")).toHaveValue("");
    expect(getContinueButton()).toBeEnabled();
    expect(
      screen.getByText("Ready to generate your cover letter.")
    ).toBeInTheDocument();
  });

  it("does not treat whitespace-only input as a filled required field", async () => {
    await renderPage();
    fillJobDescription();
    fillRequiredFieldsExceptOne();
    fireEvent.change(screen.getByPlaceholderText("e.g. Globex Corporation"), {
      target: { value: "   " },
    });

    expect(getContinueButton()).toBeDisabled();
  });

  it("shows the missing-details hint while required fields are incomplete", async () => {
    await renderPage();
    fillJobDescription();

    expect(
      screen.getByText(
        "Fill in company name, job title, location, and signature name to continue."
      )
    ).toBeInTheDocument();
  });

  it("marks Company name, Job title, Location, and Signature name as required with a red asterisk", async () => {
    await renderPage();

    for (const label of ["Company name", "Job title", "Location", "Signature name"]) {
      const el = screen.getByText(label, { exact: false, selector: "label" });
      expect(el.textContent).toContain("*");
      expect(el.textContent).not.toContain("(optional)");
    }
  });

  it("marks Hiring manager as optional, not required", async () => {
    await renderPage();

    const el = screen.getByText("Hiring manager", { exact: false, selector: "label" });
    expect(el.textContent).toContain("(optional)");
  });

  it("does not call the generate mutation when Continue is clicked while disabled", async () => {
    await renderPage();
    fillRequiredFieldsExceptOne("signature");
    fillJobDescription();

    fireEvent.click(getContinueButton());

    expect(mockGenerateMutate).not.toHaveBeenCalled();
  });
});
