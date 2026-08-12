/**
 * Component tests for CoverLetterEmpty.tsx
 *
 * Tests:
 *   - hasLetters=false (default): "no saved letters" empty state,
 *     "Create your first cover letter" heading + "New letter" CTA
 *   - hasLetters=true: "preview mode" state, "Select a cover letter"
 *     heading, no CTA
 *   - Both headings use font-bold (700), not font-black (900)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CoverLetterEmpty from "@/components/cover-letter/CoverLetterEmpty";

describe("CoverLetterEmpty", () => {
  describe("hasLetters = false (no saved letters yet)", () => {
    it("defaults to the no-letters state when the prop is omitted", () => {
      render(<CoverLetterEmpty />);
      expect(screen.getByText("No saved letters")).toBeInTheDocument();
    });

    it("renders the 'Create your first cover letter' heading", () => {
      render(<CoverLetterEmpty hasLetters={false} />);
      expect(
        screen.getByRole("heading", { name: "Create your first cover letter" })
      ).toBeInTheDocument();
    });

    it("renders a New letter CTA linking to /cover-letter/new", () => {
      render(<CoverLetterEmpty hasLetters={false} />);
      const link = screen.getByRole("link", { name: /New letter/i });
      expect(link).toHaveAttribute("href", "/cover-letter/new");
    });

    it("does not render the preview-mode copy", () => {
      render(<CoverLetterEmpty hasLetters={false} />);
      expect(screen.queryByText("Preview mode")).not.toBeInTheDocument();
      expect(screen.queryByText("Select a cover letter")).not.toBeInTheDocument();
    });
  });

  describe("hasLetters = true (letters exist, none selected)", () => {
    it("renders the 'Select a cover letter' heading", () => {
      render(<CoverLetterEmpty hasLetters />);
      expect(
        screen.getByRole("heading", { name: "Select a cover letter" })
      ).toBeInTheDocument();
    });

    it("renders the preview-mode eyebrow copy", () => {
      render(<CoverLetterEmpty hasLetters />);
      expect(screen.getByText("Preview mode")).toBeInTheDocument();
    });

    it("does not render a CTA link (no /cover-letter/new action here)", () => {
      render(<CoverLetterEmpty hasLetters />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render the no-letters copy", () => {
      render(<CoverLetterEmpty hasLetters />);
      expect(screen.queryByText("No saved letters")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Create your first cover letter")
      ).not.toBeInTheDocument();
    });
  });

  it("uses font-bold (700) on both headings, not font-black (900)", () => {
    const { rerender } = render(<CoverLetterEmpty hasLetters={false} />);
    let heading = screen.getByRole("heading", {
      name: "Create your first cover letter",
    });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).not.toContain("font-black");

    rerender(<CoverLetterEmpty hasLetters />);
    heading = screen.getByRole("heading", { name: "Select a cover letter" });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).not.toContain("font-black");
  });
});
