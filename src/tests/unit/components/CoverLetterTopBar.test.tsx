/**
 * Component tests for CoverLetterTopBar.tsx
 *
 * Tests:
 *   - Renders the "History library" heading and eyebrow/subtitle copy
 *   - "Create new letter" CTA links to /cover-letter/new
 *   - Heading uses font-bold (700), not font-black (900) — see PR
 *     discussion: font-black headings render inconsistently because
 *     the app's self-hosted Inter previously had no 900-weight face.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CoverLetterTopBar from "@/components/cover-letter/CoverLetterTopBar";

describe("CoverLetterTopBar", () => {
  it("renders the History library heading", () => {
    render(<CoverLetterTopBar />);
    expect(
      screen.getByRole("heading", { level: 1, name: "History library" })
    ).toBeInTheDocument();
  });

  it("renders the eyebrow label and subtitle", () => {
    render(<CoverLetterTopBar />);
    expect(screen.getByText("Cover letters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review saved drafts, open any letter for export, or start step 1 for a new role."
      )
    ).toBeInTheDocument();
  });

  it("renders a single Create new letter CTA linking to /cover-letter/new", () => {
    render(<CoverLetterTopBar />);
    const link = screen.getByRole("link", { name: /Create new letter/i });
    expect(link).toHaveAttribute("href", "/cover-letter/new");
  });

  it("uses font-bold (700) on the heading, not font-black (900)", () => {
    render(<CoverLetterTopBar />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).not.toContain("font-black");
  });
});
