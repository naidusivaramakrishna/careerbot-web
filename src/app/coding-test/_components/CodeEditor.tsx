'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { CodingTestLanguage } from '../_lib/types';
import { MONACO_LANGUAGE } from '../_lib/ui';

export interface CodeEditorProps {
  language: CodingTestLanguage;
  value: string;
  onChange: (value: string) => void;
  onCtrlEnter?: () => void;
  onCtrlS?: () => void;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  onCtrlEnter,
  onCtrlS,
}: CodeEditorProps) {
  const onCtrlEnterRef = useRef(onCtrlEnter);
  useEffect(() => { onCtrlEnterRef.current = onCtrlEnter; }, [onCtrlEnter]);

  const onCtrlSRef = useRef(onCtrlS);
  useEffect(() => { onCtrlSRef.current = onCtrlS; }, [onCtrlS]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">

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
          padding: { top: 12, bottom: 12 },
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
