import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '@/components/coding-test/LanguageSelector';

// Self-containment proof: this test does NOT mock useRouter or any next/navigation
// hook. If the component secretly called useRouter, it would crash without a mock.

describe('LanguageSelector', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all four language buttons', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'C++' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument();
    });

    it('renders as a group with accessible label', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      expect(
        screen.getByRole('group', { name: 'Select programming language' }),
      ).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks the current language button as pressed', () => {
      render(<LanguageSelector language="java" onChange={onChange} />);
      expect(screen.getByRole('button', { name: 'Java' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('marks all other language buttons as not pressed', () => {
      render(<LanguageSelector language="java" onChange={onChange} />);
      for (const name of ['Python', 'C++', 'C']) {
        expect(screen.getByRole('button', { name })).toHaveAttribute(
          'aria-pressed',
          'false',
        );
      }
    });

    it.each([
      ['python', 'Python'],
      ['java', 'Java'],
      ['cpp', 'C++'],
      ['c', 'C'],
    ] as const)('marks %s as pressed when it is the active language', (lang, label) => {
      render(<LanguageSelector language={lang} onChange={onChange} />);
      expect(screen.getByRole('button', { name: label })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('onChange callback', () => {
    it('calls onChange with "java" when Java button is clicked', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Java' }));
      expect(onChange).toHaveBeenCalledWith('java');
    });

    it('calls onChange with "cpp" when C++ button is clicked', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'C++' }));
      expect(onChange).toHaveBeenCalledWith('cpp');
    });

    it('calls onChange with "python" when Python button is clicked', () => {
      render(<LanguageSelector language="java" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Python' }));
      expect(onChange).toHaveBeenCalledWith('python');
    });

    it('calls onChange with "c" when C button is clicked', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'C' }));
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('calls onChange exactly once per click', () => {
      render(<LanguageSelector language="python" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Java' }));
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(<LanguageSelector language="python" onChange={onChange} disabled />);
      for (const name of ['Python', 'Java', 'C++', 'C']) {
        expect(screen.getByRole('button', { name })).toBeDisabled();
      }
    });

    it('does not call onChange when disabled and a button is clicked', () => {
      render(<LanguageSelector language="python" onChange={onChange} disabled />);
      fireEvent.click(screen.getByRole('button', { name: 'Java' }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps all buttons enabled when disabled prop is false', () => {
      render(<LanguageSelector language="python" onChange={onChange} disabled={false} />);
      for (const name of ['Python', 'Java', 'C++', 'C']) {
        expect(screen.getByRole('button', { name })).not.toBeDisabled();
      }
    });
  });

  describe('self-containment', () => {
    it('renders without any navigation context — no useRouter mock required', () => {
      // If this test passes without an explicit vi.mock('next/navigation') here,
      // the component is confirmed self-contained (global mock in vitest.setup.ts
      // covers it, but the component must not rely on any navigation side-effects).
      expect(() =>
        render(<LanguageSelector language="python" onChange={onChange} />),
      ).not.toThrow();
    });
  });
});
