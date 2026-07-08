import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import GradingResultPanel from '@/app/coding-test/_components/GradingResultPanel';
import type { SubmitSolutionResponse } from '@/app/coding-test/_lib/types';

// GradingResultPanel is a pure display component — it needs only a `result`
// prop to render. No routing context, no global state, no async calls.

// ── helpers ──────────────────────────────────────────────────────────────────

function makeResult(
  overrides: Partial<SubmitSolutionResponse> = {},
): SubmitSolutionResponse {
  return {
    submission_id: 'sub-001',
    problem_slug: 'two-sum',
    language: 'python',
    score: 90,
    submitted_at: '2026-07-08T10:00:00Z',
    error: null,
    grading_result: {
      total_score: 90,
      summary: 'Great solution with optimal time complexity.',
      suggestions: ['Consider adding type hints.', 'Add a docstring.'],
      grading_model: 'gpt-4o-mini',
      breakdown: {
        correctness: {
          name: 'Correctness',
          weight: 25,
          score: 25,
          feedback: 'All test cases pass.',
          suggestions: [],
        },
        efficiency: {
          name: 'Efficiency',
          weight: 25,
          score: 23,
          feedback: 'O(n) solution, as expected.',
          suggestions: [],
        },
        code_quality: {
          name: 'Code Quality',
          weight: 25,
          score: 21,
          feedback: 'Clean and readable.',
          suggestions: [],
        },
        edge_cases: {
          name: 'Edge Cases',
          weight: 25,
          score: 21,
          feedback: 'Handles empty input.',
          suggestions: [],
        },
      },
    },
    ...overrides,
  };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('GradingResultPanel', () => {
  it('renders without any routing context (self-containment proof)', () => {
    // All data comes from the `result` prop — no useRouter or page context needed.
    const { container } = render(<GradingResultPanel result={makeResult()} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('displays the total score', () => {
    const { getByText } = render(<GradingResultPanel result={makeResult({ score: 90 })} />);
    // Score renders as a bare number in its own span; "/ 100" is a separate span.
    expect(getByText('90')).toBeTruthy();
  });

  it('renders the AI summary text', () => {
    const { getByText } = render(<GradingResultPanel result={makeResult()} />);
    expect(getByText('Great solution with optimal time complexity.')).toBeTruthy();
  });

  it('renders all four grading criterion labels', () => {
    const { getByText } = render(<GradingResultPanel result={makeResult()} />);
    expect(getByText('Correctness')).toBeTruthy();
    expect(getByText('Efficiency')).toBeTruthy();
    expect(getByText('Code Quality')).toBeTruthy();
    expect(getByText('Edge Cases')).toBeTruthy();
  });

  it('renders per-criterion feedback text', () => {
    const { getByText } = render(<GradingResultPanel result={makeResult()} />);
    expect(getByText('All test cases pass.')).toBeTruthy();
    expect(getByText('O(n) solution, as expected.')).toBeTruthy();
  });

  it('renders the suggestions list', () => {
    const { getByText } = render(<GradingResultPanel result={makeResult()} />);
    expect(getByText('Consider adding type hints.')).toBeTruthy();
    expect(getByText('Add a docstring.')).toBeTruthy();
  });

  it('shows the "Not graded" state when grading_result is null', () => {
    const { getByText } = render(
      <GradingResultPanel
        result={makeResult({
          score: null,
          grading_result: null,
          error: 'Prompt injection detected.',
        })}
      />,
    );
    expect(getByText('Not graded')).toBeTruthy();
    expect(getByText('Prompt injection detected.')).toBeTruthy();
  });

  it('shows the default fallback message when error and grading_result are both null', () => {
    const { getByText } = render(
      <GradingResultPanel
        result={makeResult({ score: null, grading_result: null, error: null })}
      />,
    );
    expect(
      getByText('We could not grade this submission. Please try again.'),
    ).toBeTruthy();
  });

  it('clamps an out-of-range score to 100 (never renders "140 / 100")', () => {
    const { queryByText } = render(
      <GradingResultPanel result={makeResult({ score: 140 })} />,
    );
    // "140" must not appear — it should be clamped to 100 by normalizeScore().
    expect(queryByText('140')).toBeNull();
    // The clamped value "100" should appear in the score span.
    expect(queryByText('100')).toBeTruthy();
  });

  it('renders a score of 0 without crashing', () => {
    const { getByText } = render(
      <GradingResultPanel
        result={makeResult({
          score: 0,
          grading_result: {
            total_score: 0,
            summary: 'No correct cases.',
            suggestions: [],
            grading_model: 'gpt-4o-mini',
            breakdown: {
              correctness:  { name: 'Correctness',  weight: 25, score: 0, feedback: '', suggestions: [] },
              efficiency:   { name: 'Efficiency',   weight: 25, score: 0, feedback: '', suggestions: [] },
              code_quality: { name: 'Code Quality', weight: 25, score: 0, feedback: '', suggestions: [] },
              edge_cases:   { name: 'Edge Cases',   weight: 25, score: 0, feedback: '', suggestions: [] },
            },
          },
        })}
      />,
    );
    expect(getByText('0')).toBeTruthy();
  });
});
