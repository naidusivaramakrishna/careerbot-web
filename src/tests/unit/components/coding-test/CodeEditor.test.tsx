import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Hoist the spy so it is available inside the vi.mock() factory (which is
// hoisted to the top of the module before any imports are evaluated).
const mockAddAction = vi.hoisted(() => vi.fn());

// Monaco is a browser-only library; mock it before importing the component.
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value, language, onMount, options }: any) => {
    // Invoke onMount with a minimal fake editor + monaco so keyboard shortcut
    // registration code inside CodeEditor does not throw.
    if (onMount) {
      onMount(
        { addAction: mockAddAction },
        { KeyMod: { CtrlCmd: 2048 }, KeyCode: { Enter: 3 } },
      );
    }
    return (
      <textarea
        data-testid="monaco-editor"
        data-language={language}
        aria-label={options?.ariaLabel}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  },
}));

import CodeEditor from '@/app/coding-test/_components/CodeEditor';

// Self-containment proof: no useRouter mock set up here.

describe('CodeEditor', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  describe('rendering', () => {
    it('renders the editor element', () => {
      render(
        <CodeEditor language="python" value="print('hello')" onChange={onChange} />,
      );
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('passes the current value to the editor', () => {
      render(
        <CodeEditor language="python" value="x = 1" onChange={onChange} />,
      );
      expect(screen.getByTestId('monaco-editor')).toHaveValue('x = 1');
    });

    it('passes an empty string when value is empty', () => {
      render(<CodeEditor language="python" value="" onChange={onChange} />);
      expect(screen.getByTestId('monaco-editor')).toHaveValue('');
    });
  });

  describe('language mapping', () => {
    it.each([
      ['python', 'python'],
      ['java',   'java'],
      ['cpp',    'cpp'],
      ['c',      'c'],
    ] as const)(
      'sets data-language="%s" for language prop "%s"',
      (lang, expected) => {
        render(<CodeEditor language={lang} value="" onChange={onChange} />);
        expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
          'data-language',
          expected,
        );
      },
    );
  });

  describe('onChange callback', () => {
    it('calls onChange when the editor value changes', () => {
      render(<CodeEditor language="python" value="" onChange={onChange} />);
      fireEvent.change(screen.getByTestId('monaco-editor'), {
        target: { value: 'def solution():' },
      });
      expect(onChange).toHaveBeenCalledWith('def solution():');
    });

    it('calls onChange exactly once per change event', () => {
      render(<CodeEditor language="python" value="" onChange={onChange} />);
      fireEvent.change(screen.getByTestId('monaco-editor'), {
        target: { value: 'a' },
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('onCtrlEnter', () => {
    it('registers a submit-code action on mount when onCtrlEnter is provided', () => {
      mockAddAction.mockClear();
      const onCtrlEnter = vi.fn();
      render(
        <CodeEditor language="python" value="" onChange={onChange} onCtrlEnter={onCtrlEnter} />,
      );
      expect(mockAddAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'submit-code' }),
      );
    });
  });

  describe('accessibility', () => {
    it('sets an aria-label containing the language name', () => {
      render(<CodeEditor language="python" value="" onChange={onChange} />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor.getAttribute('aria-label')).toContain('python');
    });
  });

  describe('self-containment', () => {
    it('renders with hardcoded props without throwing', () => {
      expect(() =>
        render(<CodeEditor language="python" value="# hello" onChange={onChange} />),
      ).not.toThrow();
    });
  });
});
