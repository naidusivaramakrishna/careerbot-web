'use client';

import type { CodingTestLanguage } from '@/types/codingTest';
import { LANGUAGES } from '@/app/coding-test/_lib/ui';

interface LanguageSelectorProps {
  language: CodingTestLanguage;
  onChange: (language: CodingTestLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  language,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
      role="group"
      aria-label="Select programming language"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onChange(l.value)}
          aria-pressed={language === l.value}
          disabled={disabled}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            language === l.value
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
