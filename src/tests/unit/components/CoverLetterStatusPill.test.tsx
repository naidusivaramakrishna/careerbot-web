/**
 * Component tests for CoverLetterStatusPill.tsx
 *
 * Tests:
 *   - All three status variants render with correct label, color, and icon
 *   - Accessibility: role="status", aria-label present
 *   - Custom className is applied
 *   - Dot indicator color matches status
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CoverLetterStatusPill from "@/app/cover-letter/_components/CoverLetterStatusPill";
import type { CoverLetterStatus } from "@/types/coverLetter";

describe("CoverLetterStatusPill", () => {
  describe("ready_to_review status", () => {
    it("renders with 'Ready to review' label", () => {
      render(<CoverLetterStatusPill status="ready_to_review" />);
      expect(screen.getByText("Ready to review")).toBeInTheDocument();
    });

    it("has correct status role and aria-label", () => {
      render(<CoverLetterStatusPill status="ready_to_review" />);
      const pill = screen.getByRole("status");
      expect(pill).toHaveAttribute("aria-label", "Status: Ready to review");
    });

    it("applies emerald color classes", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("bg-emerald-50", "text-emerald-700");
    });

    it("renders emerald dot indicator", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const dot = container.querySelector(".bg-emerald-500");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("h-1.5", "w-1.5", "rounded-full");
    });

    it("hides dot from screen readers", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const dot = container.querySelector("[aria-hidden='true']");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("bg-emerald-500");
    });
  });

  describe("needs_review status", () => {
    it("renders with 'Needs review' label", () => {
      render(<CoverLetterStatusPill status="needs_review" />);
      expect(screen.getByText("Needs review")).toBeInTheDocument();
    });

    it("applies amber color classes", () => {
      const { container } = render(
        <CoverLetterStatusPill status="needs_review" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("bg-amber-50", "text-amber-700");
    });

    it("renders amber dot indicator", () => {
      const { container } = render(
        <CoverLetterStatusPill status="needs_review" />
      );
      const dot = container.querySelector(".bg-amber-500");
      expect(dot).toBeInTheDocument();
    });

    it("has correct aria-label for needs_review", () => {
      render(<CoverLetterStatusPill status="needs_review" />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Status: Needs review"
      );
    });
  });

  describe("failed status", () => {
    it("renders with 'No draft' label", () => {
      render(<CoverLetterStatusPill status="failed" />);
      expect(screen.getByText("No draft")).toBeInTheDocument();
    });

    it("applies red color classes", () => {
      const { container } = render(
        <CoverLetterStatusPill status="failed" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("bg-red-50", "text-red-700");
    });

    it("renders red dot indicator", () => {
      const { container } = render(
        <CoverLetterStatusPill status="failed" />
      );
      const dot = container.querySelector(".bg-red-500");
      expect(dot).toBeInTheDocument();
    });

    it("has correct aria-label for failed", () => {
      render(<CoverLetterStatusPill status="failed" />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Status: No draft"
      );
    });
  });

  describe("custom className prop", () => {
    it("appends custom className to base classes", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" className="ml-4" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("ml-4");
    });

    it("preserves all base classes when custom className is provided", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" className="custom" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass(
        "inline-flex",
        "items-center",
        "px-2.5",
        "py-0.5",
        "custom"
      );
    });

    it("works with multiple custom classes", () => {
      const { container } = render(
        <CoverLetterStatusPill
          status="ready_to_review"
          className="text-lg shadow-md"
        />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("text-lg", "shadow-md");
    });
  });

  describe("structure and layout", () => {
    it("renders as a span element", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span?.tagName).toBe("SPAN");
    });

    it("renders flex layout with gap", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("inline-flex", "items-center", "gap-1.5");
    });

    it("renders with both dot indicator and text", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const span = container.querySelector("span[role='status']");
      const dot = span?.querySelector(".bg-emerald-500");
      expect(dot).toBeInTheDocument();
      expect(span?.textContent).toContain("Ready to review");
    });

    it("applies correct text sizing classes", () => {
      const { container } = render(
        <CoverLetterStatusPill status="ready_to_review" />
      );
      const span = container.querySelector("span[role='status']");
      expect(span).toHaveClass("text-xs", "font-medium");
    });
  });

  describe("all statuses comprehensively", () => {
    const statuses: Array<{ status: CoverLetterStatus; label: string }> = [
      { status: "ready_to_review", label: "Ready to review" },
      { status: "needs_review", label: "Needs review" },
      { status: "failed", label: "No draft" },
    ];

    it.each(statuses)("$status renders correctly", ({ status, label }) => {
      render(<CoverLetterStatusPill status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveAttribute("aria-label");
    });

    it.each(statuses)("$status has a visible dot indicator", ({ status }) => {
      const { container } = render(
        <CoverLetterStatusPill status={status} />
      );
      const dot = container.querySelector("[aria-hidden='true']");
      expect(dot).toBeInTheDocument();
    });
  });
});
