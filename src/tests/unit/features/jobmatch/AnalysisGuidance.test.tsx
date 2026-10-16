import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import AnalysisTour from "@/app/(jobs)/jobmatch/_components/analysis/AnalysisTour";
import AnalysisHelp from "@/app/(jobs)/jobmatch/_components/analysis/AnalysisHelp";
import ScoreBreakdown from "@/app/(jobs)/jobmatch/_components/analysis/ScoreBreakdown";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function TourHost() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  return <div ref={ref}>
    <button onClick={() => setOpen(true)}>Guide me</button>
    {["score", "resume", "sections", "all", "download"].map(id => <section key={id} data-jobmatch-tour={id}>{id}</section>)}
    {open && <AnalysisTour scopeRef={ref} onClose={() => setOpen(false)} />}
  </div>;
}

function startTour() {
  const button = screen.getByRole("button", { name: "Guide me" });
  button.focus();
  fireEvent.click(button);
  return button;
}

describe("Job Match guidance", () => {
  it("starts only on request, supports back/next/finish, and restores focus", () => {
    render(<TourHost />);
    expect(screen.queryByRole("dialog")).toBeNull();
    const trigger = startTour();
    expect(screen.getByRole("dialog", { name: "Understand your match" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Review your resume" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Review and download" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("can be skipped, replayed from the beginning, and dismissed by native Escape cancellation", () => {
    render(<TourHost />);
    startTour();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    startTour();
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains the estimate on demand and dismisses help with Escape or an outside click", () => {
    render(<AnalysisHelp trigger="Potential Match Score" label="About the potential match score">An estimate, not a guaranteed score.</AnalysisHelp>);
    const trigger = screen.getByRole("button", { name: "About the potential match score" });
    fireEvent.click(trigger);
    expect(screen.getByRole("tooltip").textContent).toContain("not a guaranteed score");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("Score availability", () => {
  it.each([null, undefined, "unavailable", Infinity])("does not turn an unavailable score (%s) into zero", score => {
    render(<ScoreBreakdown matchResult={{ Technical_Skills_Check: { match_score: score } }} />);
    const card = screen.getByText("Hard Skills").closest("[data-analysis-section]") as HTMLElement;
    expect(within(card).getByText("Not evaluated")).toBeTruthy();
    expect(within(card).getByText("N/A")).toBeTruthy();
    expect(within(card).queryByText("0%")).toBeNull();
    expect(within(card).queryByText("High Impact")).toBeNull();
  });

  it("keeps a valid zero score and explains the section when expanded", () => {
    render(<ScoreBreakdown matchResult={{ Technical_Skills_Check: { match_score: 0, missing_critical_skills: [{ skill: "Python" }] } }} />);
    const card = screen.getByText("Hard Skills").closest("[data-analysis-section]") as HTMLElement;
    expect(within(card).getByText("0%")).toBeTruthy();
    expect(within(card).queryByText("Not evaluated")).toBeNull();
    // The first section card renders expanded by default (defaultExpanded), so the guidance is already visible.
    expect(within(card).getByText(/High impact: prioritize this gap/)).toBeTruthy();
  });

  it("treats an explicitly failed check as unavailable even if it includes a number", () => {
    render(<ScoreBreakdown matchResult={{ Technical_Skills_Check: { match_score: 0, execution_failed: true } }} />);
    const card = screen.getByText("Hard Skills").closest("[data-analysis-section]") as HTMLElement;
    expect(within(card).getByText("N/A")).toBeTruthy();
  });
});
