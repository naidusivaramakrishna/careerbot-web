import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ImprovementGroups } from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

const { resumeState } = vi.hoisted(() => ({
  resumeState: { resumeData: { skills: { technical: ["Python"] } } as Record<string, unknown>, setResumeData: vi.fn(), resumeId: "r-1" },
}));
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({ useResume: () => resumeState }));

const suggestion = { id: "s1", section: "Skills", message: "Add a skill", fix_type: "manual", status: "pending" } as never;

describe("ImprovementGroups", () => {
  // the fixed list is kept per resume: each test is its own resume
  let n = 0;
  beforeEach(() => { resumeState.resumeId = `r-${++n}`; });

  it("keeps the green Undo bar when the last suggestion is fixed", () => {
    const onFixNow = vi.fn();
    const { rerender } = render(<ImprovementGroups suggestions={[suggestion]} onFixNow={onFixNow} />);
    fireEvent.click(screen.getByRole("button", { name: /Skills/ }));
    fireEvent.click(screen.getByRole("button", { name: /Manually fix: Add a skill/ }));
    // the editor fixed it: nothing is pending any more
    rerender(<ImprovementGroups suggestions={[]} onFixNow={onFixNow} />);
    expect(screen.getByText(/Fix applied/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Undo fix: Add a skill/ })).toBeInTheDocument();
  });

  it("says nothing is pending only when there is nothing pending and nothing fixed", () => {
    render(<ImprovementGroups suggestions={[]} />);
    expect(screen.getByText(/No improvements pending/)).toBeInTheDocument();
  });

  it("keeps fixes across the Score tab being closed and reopened", () => {
    const onFixNow = vi.fn();
    const first = render(<ImprovementGroups suggestions={[suggestion]} onFixNow={onFixNow} />);
    fireEvent.click(screen.getByRole("button", { name: /Skills/ }));
    fireEvent.click(screen.getByRole("button", { name: /Manually fix: Add a skill/ }));
    first.unmount(); // the user went to the Editor tab to make the fix
    render(<ImprovementGroups suggestions={[]} onFixNow={onFixNow} />); // and came back: it is fixed now
    fireEvent.click(screen.getByRole("button", { name: /Skills/ }));
    expect(screen.getByText(/Fix applied/)).toBeInTheDocument();
  });
});
