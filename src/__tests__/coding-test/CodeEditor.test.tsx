import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import CodeEditor from '@/app/coding-test/_components/CodeEditor';
import { LANGUAGES } from '@/app/coding-test/_lib/ui';

// Monaco Editor cannot run in jsdom. Replace it with a plain textarea that
// mirrors the same props (language, value, onChange) so we can assert on them.
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ language, value, onChange }: {
    language: string;
    value: string;
    onChange?: (v: string) => void;
  }) => (
    <textarea
      data-testid="monaco-editor"
      data-language={language}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )),
}));

describe('CodeEditor', () => {
  it('renders without any routing context (self-containment proof)', () => {
    // All data comes through props — no useRouter, useParams, or page context.
    // If this render crashes because of a missing routing mock, the rule was broken.
    const { getByTestId } = render(
      <CodeEditor language="python" value="" onChange={() => {}} />,
    );
    expect(getByTestId('monaco-editor')).toBeTruthy();
  });

  it('passes the correct Monaco language id for all four supported languages', () => {
    // MONACO_LANGUAGE maps our backend lang keys 1-to-1 to Monaco lang ids.
    const expected: Record<string, string> = {
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    };
    for (const lang of LANGUAGES) {
      const { getByTestId, unmount } = render(
        <CodeEditor language={lang.value} value="" onChange={() => {}} />,
      );
      expect(getByTestId('monaco-editor')).toHaveAttribute(
        'data-language',
        expected[lang.value],
      );
      unmount();
    }
  });

  it('displays the initial starter code as the editor value', () => {
    const starter = 'def solution(nums):\n    pass';
    const { getByTestId } = render(
      <CodeEditor language="python" value={starter} onChange={() => {}} />,
    );
    expect((getByTestId('monaco-editor') as HTMLTextAreaElement).value).toBe(starter);
  });

  it('calls onChange with the new value when editor content changes', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <CodeEditor language="python" value="" onChange={onChange} />,
    );
    fireEvent.change(getByTestId('monaco-editor'), {
      target: { value: 'print("hello")' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('print("hello")');
  });

  it('does not throw when the optional onCtrlEnter prop is omitted', () => {
    expect(() =>
      render(<CodeEditor language="java" value="// starter" onChange={() => {}} />),
    ).not.toThrow();
  });

  it('accepts a new language prop without crashing (language switch scenario)', () => {
    const { getByTestId, rerender } = render(
      <CodeEditor language="python" value="" onChange={() => {}} />,
    );
    expect(getByTestId('monaco-editor')).toHaveAttribute('data-language', 'python');

    rerender(<CodeEditor language="cpp" value="" onChange={() => {}} />);
    expect(getByTestId('monaco-editor')).toHaveAttribute('data-language', 'cpp');
  });
});
