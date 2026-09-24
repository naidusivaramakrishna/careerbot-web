import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ResumeCustomizePrompt from '@/app/(jobs)/jobslogin/_components/job-cards/ResumeCustomizePrompt';

function renderPrompt(overrides: Partial<React.ComponentProps<typeof ResumeCustomizePrompt>> = {}) {
  const props = {
    jobTitle: 'Frontend Engineer',
    company: 'Acme',
    matchScore: 55,
    bandColor: '#f59e0b',
    bandLabel: 'Fair',
    missingSkills: ['GraphQL'],
    applyUrl: 'https://careers.example.com/job/1',
    onClose: vi.fn(),
    onApplyWithoutCustomizing: vi.fn(),
    onFixResume: vi.fn(),
    fixingResume: false,
    dontRemindAgain: false,
    onDontRemindAgainChange: vi.fn(),
    ...overrides,
  };
  render(<ResumeCustomizePrompt {...props} />);
  return props;
}

// fireEvent.keyDown returns false when a handler called preventDefault().
// A browser activates a focused <button>/<a> on Enter (and a button/checkbox
// on Space) only if that keydown's default action is NOT cancelled, so a
// `false` here means keyboard users cannot activate the control.
describe('ResumeCustomizePrompt — keyboard activation', () => {
  it('does not cancel Enter/Space on the controls inside the dialog', () => {
    const props = renderPrompt();

    const fixButton = screen.getByText('Fix My Resume Now').closest('button')!;
    const applyLink = screen.getByText('Apply Without Customizing').closest('a')!;
    const checkbox = screen.getByRole('checkbox');

    expect(fireEvent.keyDown(fixButton, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(fixButton, { key: ' ' })).toBe(true);
    expect(fireEvent.keyDown(applyLink, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(checkbox, { key: ' ' })).toBe(true);
    // ...and a keypress inside the dialog must not dismiss it.
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const props = renderPrompt();
    fireEvent.keyDown(screen.getByText('Fix My Resume Now'), { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape while the resume fix is running', () => {
    const props = renderPrompt({ fixingResume: true });
    fireEvent.keyDown(screen.getByText('Preparing your match…'), { key: 'Escape' });
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
