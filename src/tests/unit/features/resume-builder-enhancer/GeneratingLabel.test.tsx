import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeneratingLabel from '@/app/(resume)/builder/creation/_components/editor/GeneratingLabel';

describe('GeneratingLabel', () => {
  it('shows "Generating" with three animated dots', () => {
    render(<GeneratingLabel />);

    expect(screen.getByText('Generating')).toBeInTheDocument();
    const dots = screen.getAllByTestId('generating-dot');
    expect(dots).toHaveLength(3);
    dots.forEach((dot) => expect(dot.className).toContain('ai-generating-dot'));
    // the dots move one after another
    expect(dots.map((d) => (d as HTMLElement).style.animationDelay)).toEqual(['0ms', '150ms', '300ms']);
  });

  it('announces progress to screen readers without reading the dots', () => {
    render(<GeneratingLabel />);

    expect(screen.getByRole('status')).toHaveTextContent('Generating please wait');
    expect(screen.getAllByTestId('generating-dot')[0].parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
