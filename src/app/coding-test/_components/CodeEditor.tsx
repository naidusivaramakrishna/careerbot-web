'use client';

import { Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { CodingTestLanguage } from '../_lib/types';
import { MONACO_LANGUAGE } from '../_lib/ui';

interface CodeEditorProps {
  language: CodingTestLanguage;
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e]">
      <Editor
        height="100%"
        theme="vs-dark"
        language={MONACO_LANGUAGE[language]}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        loading={
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="ml-2 text-sm">Loading editor…</span>
          </div>
        }
        options={{
          ariaLabel: `Code editor for ${language}`,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          renderLineHighlight: 'line',
        }}
      />
    </div>
  );
}
