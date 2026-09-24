/**
 * Component tests for JDMatchMatrix.tsx
 *
 * Tests (positive + negative scenarios):
 *   - Renders nothing when entries is empty (negative/edge case)
 *   - Renders the summary counts (matched/partial/missing) correctly
 *   - Renders every requirement row with its status pill
 *   - Shows "Used" when used_in_letter is true
 *   - Shows "Implied" when used_in_letter is false but
 *     implied_via_broader_claim is true (new field)
 *   - Shows a plain dash when neither flag is true (negative case)
 *   - "Used" takes priority over "Implied" when both flags are true
 *     (defensive — shouldn't happen from the AI, but must not crash/confuse)
 *   - Collapsed by default; expands and collapses on click
 *   - defaultOpen=true renders expanded immediately
 *   - Long requirement text truncates with a title tooltip
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import JDMatchMatrix from "@/app/cover-letter/_components/JDMatchMatrix";
import type { JdMatchMatrixEntry } from "@/types/coverLetter";

function entry(overrides: Partial<JdMatchMatrixEntry> = {}): JdMatchMatrixEntry {
  return {
    requirement: "HTML",
    status: "met",
    supporting_claim_ids: [],
    used_in_letter: false,
    ...overrides,
  };
}

describe("JDMatchMatrix", () => {
  describe("empty state (negative case)", () => {
    it("renders nothing when entries is an empty array", () => {
      const { container } = render(<JDMatchMatrix entries={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("summary counts", () => {
    const entries: JdMatchMatrixEntry[] = [
      entry({ requirement: "HTML", status: "met" }),
      entry({ requirement: "CSS", status: "met" }),
      entry({ requirement: "Python", status: "partial" }),
      entry({ requirement: "Git", status: "not_found" }),
      entry({ requirement: "Figma", status: "not_addressed" }),
    ];

    it("shows the matched/total header count", () => {
      render(<JDMatchMatrix entries={entries} />);
      expect(screen.getByText("2/5 matched")).toBeInTheDocument();
    });

    it("shows matched, partial, and missing tallies", () => {
      render(<JDMatchMatrix entries={entries} />);
      // matched=2, partial=1, missing = total - matched - partial = 2
      // (matched and missing are both "2", so scope to the summary-stats
      // row to count occurrences rather than asserting a single unique node)
      expect(screen.getAllByText("2")).toHaveLength(2);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("per-row rendering", () => {
    it("renders each requirement's name", () => {
      render(
        <JDMatchMatrix
          entries={[entry({ requirement: "HTML" }), entry({ requirement: "CSS" })]}
          defaultOpen
        />
      );
      expect(screen.getByText("HTML")).toBeInTheDocument();
      expect(screen.getByText("CSS")).toBeInTheDocument();
    });

    it("renders MATCHED status pill for status='met'", () => {
      render(<JDMatchMatrix entries={[entry({ status: "met" })]} defaultOpen />);
      // "Matched" also appears in the summary-stats row above the row
      // list, so scope the query to the row list itself.
      expect(within(screen.getByRole("list")).getByText("Matched")).toBeInTheDocument();
    });

    it("renders PARTIAL status pill for status='partial'", () => {
      render(<JDMatchMatrix entries={[entry({ status: "partial" })]} defaultOpen />);
      expect(within(screen.getByRole("list")).getByText("Partial")).toBeInTheDocument();
    });

    it("renders MISSING status pill for status='not_found'", () => {
      render(<JDMatchMatrix entries={[entry({ status: "not_found" })]} defaultOpen />);
      expect(within(screen.getByRole("list")).getByText("Missing")).toBeInTheDocument();
    });

    it("renders 'Not used' pill for status='not_addressed'", () => {
      render(<JDMatchMatrix entries={[entry({ status: "not_addressed" })]} defaultOpen />);
      expect(within(screen.getByRole("list")).getByText("Not used")).toBeInTheDocument();
    });
  });

  describe("used_in_letter / implied_via_broader_claim indicators", () => {
    it("shows 'Used' when used_in_letter is true", () => {
      render(
        <JDMatchMatrix
          entries={[entry({ used_in_letter: true, implied_via_broader_claim: false })]}
          defaultOpen
        />
      );
      expect(screen.getByLabelText("Used in letter")).toHaveTextContent("Used");
    });

    it("shows 'Implied' when used_in_letter is false and implied_via_broader_claim is true", () => {
      render(
        <JDMatchMatrix
          entries={[entry({ used_in_letter: false, implied_via_broader_claim: true })]}
          defaultOpen
        />
      );
      expect(
        screen.getByLabelText("Represented via a broader mention in the letter")
      ).toHaveTextContent("Implied");
    });

    it("shows a plain dash when neither used_in_letter nor implied_via_broader_claim is true (negative case)", () => {
      render(
        <JDMatchMatrix
          entries={[entry({ used_in_letter: false, implied_via_broader_claim: false })]}
          defaultOpen
        />
      );
      expect(screen.queryByLabelText("Used in letter")).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Represented via a broader mention in the letter")
      ).not.toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("prefers 'Used' over 'Implied' when both flags are true (defensive/negative case)", () => {
      render(
        <JDMatchMatrix
          entries={[entry({ used_in_letter: true, implied_via_broader_claim: true })]}
          defaultOpen
        />
      );
      expect(screen.getByLabelText("Used in letter")).toHaveTextContent("Used");
      expect(
        screen.queryByLabelText("Represented via a broader mention in the letter")
      ).not.toBeInTheDocument();
    });

    it("treats implied_via_broader_claim as false when undefined (older/incomplete AI response)", () => {
      const legacyEntry: JdMatchMatrixEntry = {
        requirement: "Legacy field",
        status: "not_found",
        supporting_claim_ids: [],
        used_in_letter: false,
      };
      render(<JDMatchMatrix entries={[legacyEntry]} defaultOpen />);
      expect(
        screen.queryByLabelText("Represented via a broader mention in the letter")
      ).not.toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("expand/collapse behavior", () => {
    it("is collapsed by default (row list not rendered)", () => {
      render(<JDMatchMatrix entries={[entry({ requirement: "HTML" })]} />);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("renders expanded immediately when defaultOpen is true", () => {
      render(<JDMatchMatrix entries={[entry({ requirement: "HTML" })]} defaultOpen />);
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("expands the row list when the header is clicked", () => {
      render(<JDMatchMatrix entries={[entry({ requirement: "HTML" })]} />);
      fireEvent.click(screen.getByRole("button", { name: /JD match/i }));
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("collapses again on a second click", () => {
      render(<JDMatchMatrix entries={[entry({ requirement: "HTML" })]} />);
      const toggle = screen.getByRole("button", { name: /JD match/i });
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("sets aria-expanded to reflect open state", () => {
      render(<JDMatchMatrix entries={[entry({ requirement: "HTML" })]} />);
      const toggle = screen.getByRole("button", { name: /JD match/i });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("long requirement text (layout edge case)", () => {
    it("renders a title tooltip with the full requirement text for truncation", () => {
      const longRequirement =
        "Strong understanding of Operating Systems and Computer Networks fundamentals";
      render(<JDMatchMatrix entries={[entry({ requirement: longRequirement })]} defaultOpen />);
      expect(screen.getByText(longRequirement)).toHaveAttribute("title", longRequirement);
    });
  });
});
