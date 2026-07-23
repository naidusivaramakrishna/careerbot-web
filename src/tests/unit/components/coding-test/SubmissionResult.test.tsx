import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GradingResult from '@/components/coding-test/GradingResult';
import type { SubmitSolutionResponse } from '@/types/codingTest';

// Self-containment proof: no useRouter mock set up here.

function makeResult(overrides: Partial<SubmitSolutionResponse> = {}): SubmitSolutionResponse {
  return {
    submission_id: 'sub-001',
    problem_slug: 'two-sum',
    language: 'python',
    score: null,
    grading_result: null,
    error: null,
    submitted_at: new Date().toISOString(),
    ...overrides,
  };
}

const fullGradingResult = {
  total_score: 85,
  breakdown: {
    correctness: { name: 'correctness', weight: 25, score: 22, feedback: 'Correct output.', suggestions: [] },
    efficiency:  { name: 'efficiency',  weight: 25, score: 20, feedback: 'O(n) achieved.',  suggestions: [] },
    code_quality:{ name: 'code_quality',weight: 25, score: 21, feedback: 'Clean code.',     suggestions: [] },
    edge_cases:  { name: 'edge_cases',  weight: 25, score: 22, feedback: 'All handled.',    suggestions: [] },
  },
  summary: 'Well done overall.',
  suggestions: ['Consider adding docstrings.', 'Variable names could be clearer.'],
};

describe('GradingResult', () => {
  describe('failed / ungraded state', () => {
    it('shows "Not graded" when grading_result is null', () => {
      render(<GradingResult result={makeResult()} />);
      expect(screen.getByText('Not graded')).toBeInTheDocument();
    });

    it('shows the default fallback message when error is also null', () => {
      render(<GradingResult result={makeResult()} />);
      expect(
        screen.getByText('We could not grade this submission. Please try again.'),
      ).toBeInTheDocument();
    });

    it('shows the specific error message when provided', () => {
      render(
        <GradingResult result={makeResult({ error: 'Prompt injection detected.' })} />,
      );
      expect(screen.getByText('Prompt injection detected.')).toBeInTheDocument();
    });

    it('renders as an alert role when not graded', () => {
      render(<GradingResult result={makeResult()} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('successful grading — score display', () => {
    it('displays the total score from result.score', () => {
      render(
        <GradingResult
          result={makeResult({ score: 85, grading_result: fullGradingResult })}
        />,
      );
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('falls back to grading_result.total_score when result.score is null', () => {
      render(
        <GradingResult
          result={makeResult({ score: null, grading_result: fullGradingResult })}
        />,
      );
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('clamps score to 0 when both scores are null', () => {
      render(
        <GradingResult
          result={makeResult({
            score: null,
            grading_result: { ...fullGradingResult, total_score: NaN },
          })}
        />,
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('score label (UX spec colours)', () => {
    it('shows "Excellent" for score >= 90', () => {
      render(
        <GradingResult
          result={makeResult({ score: 95, grading_result: { ...fullGradingResult, total_score: 95 } })}
        />,
      );
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('shows "Good" for score >= 70 and < 90', () => {
      render(
        <GradingResult
          result={makeResult({ score: 75, grading_result: { ...fullGradingResult, total_score: 75 } })}
        />,
      );
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('shows "Needs work" for score >= 50 and < 70', () => {
      render(
        <GradingResult
          result={makeResult({ score: 60, grading_result: { ...fullGradingResult, total_score: 60 } })}
        />,
      );
      expect(screen.getByText('Needs work')).toBeInTheDocument();
    });

    it('shows review message for score < 50', () => {
      render(
        <GradingResult
          result={makeResult({ score: 30, grading_result: { ...fullGradingResult, total_score: 30 } })}
        />,
      );
      expect(screen.getByText('Review the problem and try again')).toBeInTheDocument();
    });
  });

  describe('score breakdown', () => {
    it('renders all four criteria labels', () => {
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
      );
      expect(screen.getByText('Correctness')).toBeInTheDocument();
      expect(screen.getByText('Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Code Quality')).toBeInTheDocument();
      expect(screen.getByText('Edge Cases')).toBeInTheDocument();
    });

    it('renders criterion score as "score / weight"', () => {
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
      );
      expect(screen.getAllByText('22 / 25').length).toBeGreaterThanOrEqual(1);
    });

    it('renders criterion feedback text', () => {
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
      );
      expect(screen.getByText('Correct output.')).toBeInTheDocument();
    });
  });

  describe('suggestions', () => {
    it('renders each suggestion', () => {
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
      );
      expect(screen.getByText('Consider adding docstrings.')).toBeInTheDocument();
      expect(screen.getByText('Variable names could be clearer.')).toBeInTheDocument();
    });

    it('renders the summary text', () => {
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
      );
      expect(screen.getByText('Well done overall.')).toBeInTheDocument();
    });

    it('renders nothing for suggestions when list is empty', () => {
      const noSuggestions = { ...fullGradingResult, suggestions: [], summary: '' };
      render(
        <GradingResult result={makeResult({ score: 85, grading_result: noSuggestions })} />,
      );
      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('self-containment', () => {
    it('renders with hardcoded props without throwing', () => {
      expect(() =>
        render(
          <GradingResult result={makeResult({ score: 85, grading_result: fullGradingResult })} />,
        ),
      ).not.toThrow();
    });
  });
});
