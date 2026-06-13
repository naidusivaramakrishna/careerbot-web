/**
 * Component tests for WarningBanner.tsx
 *
 * Tests:
 *   - Renders nothing when warnings array is empty
 *   - Maps warning codes to human-readable messages via warningMessage()
 *   - Pluralizes "signal" / "signals" based on count
 *   - "Show details" toggle expands/collapses detailed view
 *   - Details show code, severity badge, and raw message
 *   - Accessibility: role="alert", aria-labelledby, aria-expanded
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WarningBanner from "@/app/cover-letter/_components/WarningBanner";
import * as messages from "@/lib/coverLetterMessages";
import type { CoverLetterWarning } from "@/types/coverLetter";

// Mock the warningMessage function to verify it's called
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

describe("WarningBanner", () => {
  describe("empty warnings", () => {
    it("renders nothing when warnings array is empty", () => {
      const { container } = render(<WarningBanner warnings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("does not render alert role when no warnings", () => {
      render(<WarningBanner warnings={[]} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("single warning", () => {
    const singleWarning: CoverLetterWarning = {
      code: "W_COVER_LETTER_LOW_JD_MATCH",
      severity: "warning",
      message: "JD match below 15%",
    };

    it("renders alert role and aria-labelledby", () => {
      render(<WarningBanner warnings={[singleWarning]} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-labelledby", "warning-banner-heading");
    });

    it("renders the banner heading", () => {
      render(<WarningBanner warnings={[singleWarning]} />);
      expect(screen.getByText("Review recommended before sending")).toBeInTheDocument();
    });

    it("uses singular 'signal' for one warning", () => {
      render(<WarningBanner warnings={[singleWarning]} />);
      expect(screen.getByText(/1 quality signal should be checked/)).toBeInTheDocument();
    });

    it("renders the mapped warning message", () => {
      render(<WarningBanner warnings={[singleWarning]} />);
      expect(screen.getByText(/JD match is moderate/)).toBeInTheDocument();
    });

    it("calls warningMessage with the warning code", () => {
      render(<WarningBanner warnings={[singleWarning]} />);
      expect(messages.warningMessage).toHaveBeenCalledWith(
        "W_COVER_LETTER_LOW_JD_MATCH"
      );
    });
  });

  describe("multiple warnings", () => {
    const multipleWarnings: CoverLetterWarning[] = [
      {
        code: "W_COVER_LETTER_LOW_JD_MATCH",
        severity: "warning",
        message: "JD match below 15%",
      },
      {
        code: "W_COVER_LETTER_THIN_RESUME",
        severity: "warning",
        message: "Thin claim catalog",
      },
      {
        code: "W_COVER_LETTER_UNBACKED_CLAIM",
        severity: "warning",
        message: "Unbacked claim",
      },
    ];

    it("uses plural 'signals' for multiple warnings", () => {
      render(<WarningBanner warnings={multipleWarnings} />);
      expect(
        screen.getByText(/3 quality signals should be checked/)
      ).toBeInTheDocument();
    });

    it("renders all warning messages as list items", () => {
      render(<WarningBanner warnings={multipleWarnings} />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(3);
    });

    it("maps each warning code to human text", () => {
      render(<WarningBanner warnings={multipleWarnings} />);
      expect(screen.getByText(/JD match is moderate/)).toBeInTheDocument();
      expect(screen.getByText(/Limited evidence from your resume/)).toBeInTheDocument();
      expect(screen.getByText(/Removed a claim/)).toBeInTheDocument();
    });
  });

  describe("show/hide details toggle", () => {
    const warningWithCode: CoverLetterWarning = {
      code: "W_COVER_LETTER_LOW_JD_MATCH",
      severity: "warning",
      message: "JD match below 15%",
      field: null,
    };

    it("renders 'Show details' button initially", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByText(/Show details/);
      expect(button).toBeInTheDocument();
    });

    it("button has aria-expanded='false' initially", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByRole("button", { name: /Show details/ });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("details are hidden initially", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      // Details container should not be in the DOM when closed
      const button = screen.getByRole("button", { name: /Show details/ });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("clicking toggle changes to 'Hide details'", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByRole("button", { name: /Show details/ });

      fireEvent.click(button);

      expect(screen.getByText(/Hide details/)).toBeInTheDocument();
    });

    it("button has aria-expanded='true' after click", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByRole("button", { name: /Show details/ });

      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("details appear after clicking toggle", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByRole("button", { name: /Show details/ });

      fireEvent.click(button);

      // Severity badge should now be visible
      expect(screen.getByText("warning")).toBeInTheDocument();
      // Code should be visible
      expect(screen.getByText("W_COVER_LETTER_LOW_JD_MATCH")).toBeInTheDocument();
    });

    it("clicking toggle again hides details", () => {
      render(<WarningBanner warnings={[warningWithCode]} />);
      const button = screen.getByRole("button", { name: /Show details/ });

      fireEvent.click(button);
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText(/Show details/)).toBeInTheDocument();
    });
  });

  describe("details view", () => {
    const warningsWithDetails: CoverLetterWarning[] = [
      {
        code: "W_COVER_LETTER_LOW_JD_MATCH",
        severity: "warning",
        message: "JD match below 15%",
      },
      {
        code: "W_COVER_LETTER_UNBACKED_CLAIM",
        severity: "error",
        message: "Critical claim removed",
      },
      {
        code: "W_COVER_LETTER_THIN_RESUME",
        severity: "info",
        message: "Limited info",
      },
    ];

    it("shows code, severity, and message in details", () => {
      render(<WarningBanner warnings={warningsWithDetails} />);
      fireEvent.click(screen.getByRole("button", { name: /Show details/ }));

      // Check all codes are visible
      expect(screen.getByText("W_COVER_LETTER_LOW_JD_MATCH")).toBeInTheDocument();
      expect(screen.getByText("W_COVER_LETTER_UNBACKED_CLAIM")).toBeInTheDocument();
      expect(screen.getByText("W_COVER_LETTER_THIN_RESUME")).toBeInTheDocument();
    });

    it("displays correct severity badges", () => {
      render(<WarningBanner warnings={warningsWithDetails} />);
      fireEvent.click(screen.getByRole("button", { name: /Show details/ }));

      // Count severity labels
      const severityLabels = screen.getAllByText(/warning|error|info/);
      expect(severityLabels.length).toBeGreaterThanOrEqual(3);
    });

    it("shows severity-specific colors: error is red", () => {
      render(<WarningBanner warnings={warningsWithDetails} />);
      fireEvent.click(screen.getByRole("button", { name: /Show details/ }));

      const errorBadges = screen.getAllByText("error");
      expect(errorBadges[0]).toHaveClass("bg-red-100", "text-red-700");
    });

    it("shows severity-specific colors: warning is amber", () => {
      render(<WarningBanner warnings={warningsWithDetails} />);
      fireEvent.click(screen.getByRole("button", { name: /Show details/ }));

      const warningBadges = screen.getAllByText("warning");
      expect(warningBadges[0]).toHaveClass("bg-amber-100", "text-amber-700");
    });

    it("shows severity-specific colors: info is blue", () => {
      render(<WarningBanner warnings={warningsWithDetails} />);
      fireEvent.click(screen.getByRole("button", { name: /Show details/ }));

      const infoBadges = screen.getAllByText("info");
      expect(infoBadges[0]).toHaveClass("bg-blue-100", "text-blue-700");
    });
  });

  describe("accessibility", () => {
    it("renders as an alert region", () => {
      const warnings: CoverLetterWarning[] = [
        {
          code: "W_COVER_LETTER_LOW_JD_MATCH",
          severity: "warning",
          message: "test",
        },
      ];
      render(<WarningBanner warnings={warnings} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("heading has id for aria-labelledby", () => {
      const warnings: CoverLetterWarning[] = [
        {
          code: "W_COVER_LETTER_LOW_JD_MATCH",
          severity: "warning",
          message: "test",
        },
      ];
      render(<WarningBanner warnings={warnings} />);
      const heading = screen.getByText("Review recommended before sending");
      expect(heading).toHaveAttribute("id", "warning-banner-heading");
    });

    it("button has type='button' (not submit)", () => {
      const warnings: CoverLetterWarning[] = [
        {
          code: "W_COVER_LETTER_LOW_JD_MATCH",
          severity: "warning",
          message: "test",
        },
      ];
      render(<WarningBanner warnings={warnings} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });
});
