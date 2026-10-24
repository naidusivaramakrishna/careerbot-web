/**
 * Component tests for WarningBanner.tsx
 *
 * Tests:
 *   - Renders nothing when the warnings array is empty
 *   - Maps warning codes to human-readable messages via warningMessage()
 *   - Pluralizes "item" / "items" based on the number of distinct messages
 *   - Collapses repeated messages into one line
 *   - Accessibility: role="alert", aria-labelledby
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WarningBanner from "@/app/cover-letter/_components/WarningBanner";
import * as messages from "@/lib/coverLetterMessages";
import type { CoverLetterWarning } from "@/types/coverLetter";

vi.mock("@/lib/coverLetterMessages", async () => {
  const actual = await vi.importActual("@/lib/coverLetterMessages");
  return {
    ...actual,
    warningMessage: vi.fn((code: string) => {
      const map = {
        W_COVER_LETTER_LOW_JD_MATCH: "JD match is moderate, not strong.",
        W_COVER_LETTER_THIN_RESUME: "Limited evidence from your resume for this JD.",
        W_COVER_LETTER_UNBACKED_CLAIM: "Removed a claim that couldn't be supported.",
      };
      return (map as Record<string, string>)[code] ?? "Unknown warning";
    }),
  };
});

const lowMatch: CoverLetterWarning = {
  code: "W_COVER_LETTER_LOW_JD_MATCH",
  severity: "warning",
  message: "JD match below 15%",
};
const thinResume: CoverLetterWarning = {
  code: "W_COVER_LETTER_THIN_RESUME",
  severity: "warning",
  message: "Thin resume",
};
const unbacked: CoverLetterWarning = {
  code: "W_COVER_LETTER_UNBACKED_CLAIM",
  severity: "error",
  message: "Unbacked claim removed",
};

describe("WarningBanner", () => {
  it("renders nothing when warnings array is empty", () => {
    const { container } = render(<WarningBanner warnings={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders an alert labelled by the heading", () => {
    render(<WarningBanner warnings={[lowMatch]} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-labelledby", "warning-banner-heading");
    expect(screen.getByText("Review before export")).toHaveAttribute("id", "warning-banner-heading");
  });

  it("uses the singular 'item' for one warning", () => {
    render(<WarningBanner warnings={[lowMatch]} />);
    expect(screen.getByText(/found 1 item\s+worth checking first/)).toBeInTheDocument();
  });

  it("uses the plural 'items' for several warnings", () => {
    render(<WarningBanner warnings={[lowMatch, thinResume, unbacked]} />);
    expect(screen.getByText(/found 3 items\s+worth checking first/)).toBeInTheDocument();
  });

  it("renders the mapped message for each warning code", () => {
    render(<WarningBanner warnings={[lowMatch, thinResume]} />);
    expect(screen.getByText("JD match is moderate, not strong.")).toBeInTheDocument();
    expect(screen.getByText("Limited evidence from your resume for this JD.")).toBeInTheDocument();
    expect(messages.warningMessage).toHaveBeenCalledWith("W_COVER_LETTER_LOW_JD_MATCH");
    expect(messages.warningMessage).toHaveBeenCalledWith("W_COVER_LETTER_THIN_RESUME");
  });

  it("collapses warnings that resolve to the same message", () => {
    render(
      <WarningBanner
        warnings={[
          { code: "W_UNKNOWN_A", severity: "warning", message: "a" },
          { code: "W_UNKNOWN_B", severity: "warning", message: "b" },
        ]}
      />,
    );
    expect(screen.getAllByText("Unknown warning")).toHaveLength(1);
    expect(screen.getByText(/found 1 item\s+worth checking first/)).toBeInTheDocument();
  });
});
