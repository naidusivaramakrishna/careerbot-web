/**
 * Regression test for a real report: in the Professional Summary editor's
 * AI Writer popup, clicking the SAME suggestion card more than once kept
 * appending its text again each time -- eventually pushing the summary
 * past its 2,000-character limit (the trigger for a separate, more severe
 * incident: see resume_builder_service's autosave/get_resume fixes).
 *
 * Root cause: once clicked, a card already renders as "selected" (green
 * background, checkmark, cursor-default) -- but nothing actually stopped a
 * second click from calling onSelect again. The styling implied a one-shot
 * toggle that the click handler never enforced.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AISuggestions from "@/app/(resume)/builder/creation/_components/editor/AISuggestions";

describe("AISuggestions — selecting the same card twice does not duplicate it", () => {
  it("calls onSelect only once for repeated clicks on the same suggestion", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <AISuggestions
        options={["Results-driven Full Stack Developer with 5+ years experience."]}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    const card = screen.getByText(/Results-driven Full Stack Developer/);
    fireEvent.click(card);
    fireEvent.click(card);
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("disables the card once selected, so a real click can never reach the handler again", () => {
    const onSelect = vi.fn();
    render(
      <AISuggestions
        options={["Strategic Product Manager with proven ability to launch features."]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /Strategic Product Manager/ });
    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  // ProfessionalSummary is the only call site that replaces, not appends.
  it('selectionMode="single" lets a DIFFERENT suggestion replace the first', () => {
    // The expected workflow: "only one should need to add, not 5 -- if I try
    // add another, replace with the first one." The caller performs the
    // replace by clearing the editor; this component's job in single mode is
    // that only ONE card is marked at a time, so an earlier one is re-pickable.
    const onSelect = vi.fn();
    render(
      <AISuggestions
        options={[
          "Results-driven Full Stack Developer with 5+ years experience.",
          "Strategic Product Manager with proven ability to launch features.",
        ]}
        selectionMode="single"
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const firstCard = screen.getByRole("button", { name: /Results-driven Full Stack Developer/ });
    const secondCard = screen.getByRole("button", { name: /Strategic Product Manager/ });

    fireEvent.click(firstCard);
    expect(firstCard).toBeDisabled();
    expect(secondCard).not.toBeDisabled();

    fireEvent.click(secondCard);

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, "Results-driven Full Stack Developer with 5+ years experience.");
    expect(onSelect).toHaveBeenNthCalledWith(2, "Strategic Product Manager with proven ability to launch features.");
    // The first card is no longer "selected" -- only one at a time is.
    expect(firstCard).not.toBeDisabled();
    expect(secondCard).toBeDisabled();
  });

  it("default (append) mode never applies the same suggestion twice, even after picking another", () => {
    // Seven of the eight call sites append via appendSuggestionBullet. For
    // those, tracking only the most-recent pick re-opens this file's bug:
    // click A, click B, click A again and A is appended twice, because one
    // selectedIndex no longer remembers A.
    const onSelect = vi.fn();
    render(
      <AISuggestions
        options={["Reduced build times by 40%.", "Led a team of six engineers."]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const firstCard = screen.getByRole("button", { name: /Reduced build times/ });
    const secondCard = screen.getByRole("button", { name: /Led a team of six/ });

    fireEvent.click(firstCard);
    fireEvent.click(secondCard);
    // Both are legitimately added -- multi-add is the point of append mode.
    expect(onSelect).toHaveBeenCalledTimes(2);

    // Going back to the first card must NOT append it a second time.
    expect(firstCard).toBeDisabled();
    fireEvent.click(firstCard);
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(secondCard).toBeDisabled();
  });

  it("resets retired cards when regeneration replaces the options", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <AISuggestions
        options={["Old generated suggestion"]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Old generated suggestion" }));
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(
      <AISuggestions
        options={["Freshly regenerated suggestion"]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    const freshCard = screen.getByRole("button", { name: "Freshly regenerated suggestion" });
    expect(freshCard).not.toBeDisabled();
    fireEvent.click(freshCard);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("never invokes onSelect for a warning row", () => {
    const onSelect = vi.fn();
    render(
      <AISuggestions
        options={["⚠️ Generation failed, please retry."]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    // The warning renders as plain text (a <p>), not a clickable
    // suggestion card -- only the popup's own "×" close button exists.
    const warningText = screen.getByText(/Generation failed, please retry/);
    expect(warningText.closest("button")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
