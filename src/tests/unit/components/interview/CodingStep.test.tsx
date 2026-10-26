import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
// Fast Testing Library selectors and a 60 s test limit for these heavy renders (see the file).
import "@/tests/shared/pageSuiteSetup";
import { CodingStep, type CodingStepProps } from "@/components/interview/CodingStep";

// Monaco does not run in jsdom; a textarea stands in for the editor.
vi.mock("@/app/coding-test/_components/CodeEditor", () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Code editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("@/app/coding-test/_lib/runApi", () => ({ runAsync: vi.fn() }));

// The problem exactly as careerbot-api's coding_round_start frame carries it.
const problem = {
  slug: "two-sum",
  title: "Two Sum",
  difficulty: "medium",
  statement: "Return the indices of the two numbers that add up to target.",
  examples: [{ input: "[2,7,11,15], 9", output: "[0,1]" }],
  constraints: ["2 <= n <= 10^4"],
  starter_code: { python: "def two_sum(nums, target):\n    pass\n", java: "class Solution {}" },
};

function setup(overrides: Partial<CodingStepProps> = {}) {
  const props: CodingStepProps = {
    problem,
    instructions: "Write your solution below.",
    timeLimitS: 1800,
    grade: null,
    followups: [],
    pending: false,
    onSubmitCode: vi.fn(),
    onSubmitFollowup: vi.fn(),
    onFinish: vi.fn(),
    ...overrides,
  };
  const view = render(<CodingStep {...props} />);
  return { props, view };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CodingStep (live interview coding round)", () => {
  it("shows the problem from the frame and its starter code, per language", async () => {
    setup();
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText(/add up to target/)).toBeInTheDocument();
    expect(screen.getByText("Write your solution below.")).toBeInTheDocument();
    const editor = await screen.findByLabelText("Code editor");
    expect(editor).toHaveValue(problem.starter_code.python);
    fireEvent.click(screen.getByRole("button", { name: "Java" }));
    expect(screen.getByLabelText("Code editor")).toHaveValue("class Solution {}");
    // A language with no starter code starts empty, and an empty editor cannot be submitted.
    fireEvent.click(screen.getByRole("button", { name: "C++" }));
    expect(screen.getByLabelText("Code editor")).toHaveValue("");
    expect(screen.getByRole("button", { name: /grade code/i })).toBeDisabled();
  });

  it("submits the editor content once through onSubmitCode", async () => {
    const { props } = setup();
    const editor = await screen.findByLabelText("Code editor");
    fireEvent.change(editor, { target: { value: "def two_sum(n, t): return [0, 1]" } });
    // Re-clicking the current language must not reset the typed code.
    fireEvent.click(screen.getByRole("button", { name: "Python" }));
    expect(screen.getByLabelText("Code editor")).toHaveValue("def two_sum(n, t): return [0, 1]");
    fireEvent.click(screen.getByRole("button", { name: /grade code/i }));
    expect(props.onSubmitCode).toHaveBeenCalledTimes(1);
    expect(props.onSubmitCode).toHaveBeenCalledWith("def two_sum(n, t): return [0, 1]", "python");
  });

  it("shows grading while pending and blocks a second submit", () => {
    const { props } = setup({ pending: true });
    const button = screen.getByRole("button", { name: "Grading…" });
    expect(button).toBeDisabled();
    // The language is locked while the submitted code is being graded.
    expect(screen.getByRole("button", { name: "Java" })).toBeDisabled();
    fireEvent.click(button);
    expect(props.onSubmitCode).not.toHaveBeenCalled();
  });

  it("auto-submits the current code when the time runs out", async () => {
    vi.useFakeTimers();
    const { props } = setup({ timeLimitS: 3 });
    fireEvent.change(screen.getByLabelText("Code editor"), { target: { value: "print(1)" } });
    await act(async () => { vi.advanceTimersByTime(3_000); });
    expect(screen.getByText("Time's up")).toBeInTheDocument();
    expect(props.onSubmitCode).toHaveBeenCalledTimes(1);
    expect(props.onSubmitCode).toHaveBeenCalledWith("print(1)", "python");
    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(props.onSubmitCode).toHaveBeenCalledTimes(1);
  });

  it("keeps the clock running after a submit that was not graded, and stops it on the grade", async () => {
    vi.useFakeTimers();
    const { props, view } = setup({ timeLimitS: 5 });
    fireEvent.change(screen.getByLabelText("Code editor"), { target: { value: "print(1)" } });
    fireEvent.click(screen.getByRole("button", { name: /grade code/i }));
    // The server rejected it (error frame): pending is back to false, no grade.
    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(screen.getByText("Time's up")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish interview" })).toBeInTheDocument();
    expect(props.onSubmitCode).toHaveBeenCalledTimes(1);

    view.unmount();
    const graded = setup({ timeLimitS: 5, grade: { type: "code_graded", score: 50, follow_up_count: 0 } });
    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(screen.queryByText("Time's up")).not.toBeInTheDocument();
    expect(graded.props.onSubmitCode).not.toHaveBeenCalled();
  });

  it("submits nothing at time-up when the editor is empty", async () => {
    vi.useFakeTimers();
    const { props } = setup({ timeLimitS: 2 });
    fireEvent.change(screen.getByLabelText("Code editor"), { target: { value: "   " } });
    await act(async () => { vi.advanceTimersByTime(2_000); });
    expect(props.onSubmitCode).not.toHaveBeenCalled();
    // Time's up is not a dead end: code typed afterwards can still be graded,
    // and the candidate can finish without a grade.
    fireEvent.change(screen.getByLabelText("Code editor"), { target: { value: "print(2)" } });
    fireEvent.click(screen.getByRole("button", { name: /grade code/i }));
    expect(props.onSubmitCode).toHaveBeenCalledWith("print(2)", "python");
    expect(screen.getByRole("button", { name: "Finish interview" })).toBeInTheDocument();
  });

  it("renders code_graded and walks the follow-ups the server counted", async () => {
    const grade = { type: "code_graded" as const, score: 82, summary: "Correct, O(n).", follow_up_count: 2 };
    const { props, view } = setup({ grade });
    expect(screen.getByRole("button", { name: /graded/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Java" })).toBeDisabled();
    expect(screen.getByText("Score: 82/100")).toBeInTheDocument();
    expect(screen.getByText("Correct, O(n).")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit follow-up 1 of 2" }));
    expect(props.onSubmitFollowup).toHaveBeenCalledWith(problem.starter_code.python, 1);

    const first = { type: "followup_graded" as const, attempt_number: 1, score: 70, summary: "Better.", next_followup_available: true };
    view.rerender(<CodingStep {...props} followups={[first]} />);
    expect(screen.getByText(/70\/100/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit follow-up 2 of 2" })).toBeInTheDocument();

    const second = { ...first, attempt_number: 2, next_followup_available: false };
    view.rerender(<CodingStep {...props} followups={[first, second]} />);
    expect(screen.queryByRole("button", { name: /submit follow-up/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finish interview" }));
    expect(props.onFinish).toHaveBeenCalledTimes(1);
  });

  it("offers no follow-up when the server counted none", () => {
    setup({ grade: { type: "code_graded", score: 40, follow_up_count: 0 } });
    expect(screen.queryByRole("button", { name: /submit follow-up/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish interview" })).toBeInTheDocument();
  });
});
