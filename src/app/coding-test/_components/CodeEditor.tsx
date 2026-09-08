'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { CodingTestLanguage } from '../_lib/types';
import { MONACO_LANGUAGE } from '../_lib/ui';

export interface CodeEditorProps {
  language: CodingTestLanguage;
  value: string;
  onChange: (value: string) => void;
  onCtrlEnter?: () => void;
  onCtrlS?: () => void;
  onLanguageChange?: (lang: CodingTestLanguage) => void;
  languages?: { value: CodingTestLanguage; label: string }[];
  isMaximized?: boolean;
}

const LANG_ICONS: Record<string, string> = {
  python: '🐍',
  java:   '☕',
  cpp:    '⚡',
  c:      '🔧',
};

export default function CodeEditor({
  language,
  value,
  onChange,
  onCtrlEnter,
  onCtrlS,
  onLanguageChange,
  languages,
  isMaximized,
}: CodeEditorProps) {
  const onCtrlEnterRef = useRef(onCtrlEnter);
  useEffect(() => { onCtrlEnterRef.current = onCtrlEnter; }, [onCtrlEnter]);

  const onCtrlSRef = useRef(onCtrlS);
  useEffect(() => { onCtrlSRef.current = onCtrlS; }, [onCtrlS]);

  const [copied, setCopied] = useState(false);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(valueRef.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard not available (e.g. non-secure context) — silently ignore
    }
  };

  const showHeader = !!(languages && onLanguageChange);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e]">
      {/* ── Floating editor header bar ── */}
      {showHeader && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 border-b border-[#3e3e3e] bg-[#2d2d2d] px-3 py-1.5">
          {/* Language selector */}
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-2.5 text-sm select-none">
              {LANG_ICONS[language] ?? ''}
            </span>
            <select
              value={language}
              onChange={(e) => onLanguageChange!(e.target.value as CodingTestLanguage)}
              className="appearance-none cursor-pointer rounded border border-[#555] bg-[#3c3c3c] py-1 pl-7 pr-7 text-sm font-medium text-slate-200 transition focus:border-indigo-500 focus:outline-none hover:border-slate-400"
              aria-label="Select language"
            >
              {languages!.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <svg
              className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Right-side actions */}
          <div className={`flex items-center gap-1${isMaximized ? ' pr-40' : ''}`}>
            {/* Copy code */}
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy code'}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-[#3c3c3c] hover:text-slate-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Monaco editor ── */}
      <Editor
        height="100%"
        theme="vs-dark"
        language={MONACO_LANGUAGE[language]}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={(editor, monaco) => {
          editor.addAction({
            id: 'run-code',
            label: 'Run Code (Ctrl+Enter)',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: () => onCtrlEnterRef.current?.(),
          });
          editor.addAction({
            id: 'save-code',
            label: 'Save Code (Ctrl+S)',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => onCtrlSRef.current?.(),
          });
        }}
        loading={
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="ml-2 text-sm">Loading editor…</span>
          </div>
        }
        options={{
          ariaLabel: `Code editor for ${language}`,
          accessibilitySupport: 'on',
          accessibilityPageSize: 10,
          fontSize: 16,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          // Extra top padding when the floating header is present (≈ 40 px header + 12 px gap)
          padding: { top: showHeader ? 52 : 12, bottom: 12 },
          smoothScrolling: true,
          renderLineHighlight: 'line',
          // VS Code-like productivity features
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: { strings: true, comments: false, other: true },
          wordBasedSuggestions: 'matchingDocuments',
          bracketPairColorization: { enabled: true },
          folding: true,
          foldingHighlight: true,
          cursorBlinking: 'expand',
          cursorSmoothCaretAnimation: 'on',
          inlineSuggest: { enabled: true },

          stickyScroll: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          renderWhitespace: 'selection',
          linkedEditing: true,
          matchBrackets: 'always',
        }}
      />
    </div>
  );
}
