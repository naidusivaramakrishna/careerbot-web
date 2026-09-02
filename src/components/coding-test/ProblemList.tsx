'use client';

import { AlertCircle, RotateCw, SearchX } from 'lucide-react';
import type {
  CodingProblemSummary,
  CodingTestDifficulty,
  CodingTestLanguage,
} from '@/types/codingTest';
import { DIFFICULTIES, LANGUAGES } from '@/app/coding-test/_lib/ui';
import ProblemCard from './ProblemCard';

export interface ProblemListFilters {
  language: CodingTestLanguage | '';
  difficulty: CodingTestDifficulty | '';
  tag: string;
}

interface ProblemListProps {
  problems: CodingProblemSummary[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: ProblemListFilters;
  tagOptions: string[];
  onFiltersChange: (filters: ProblemListFilters) => void;
  onRetry: () => void;
}

export default function ProblemList({
  problems,
  total,
  loading,
  error,
  filters,
  tagOptions,
  onFiltersChange,
  onRetry,
}: ProblemListProps) {
  const hasActiveFilters = Boolean(filters.language || filters.difficulty || filters.tag);

  const clearFilters = () => onFiltersChange({ language: '', difficulty: '', tag: '' });

  if (loading) return <ListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />
        <p className="text-sm font-medium text-rose-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <section
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"
        aria-label="Filters"
      >
        <FilterSelect
          label="Language"
          value={filters.language}
          onChange={(v) => onFiltersChange({ ...filters, language: v as CodingTestLanguage | '' })}
          options={[
            { value: '', label: 'All languages' },
            ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
          ]}
        />
        <FilterSelect
          label="Difficulty"
          value={filters.difficulty}
          onChange={(v) =>
            onFiltersChange({ ...filters, difficulty: v as CodingTestDifficulty | '' })
          }
          options={[
            { value: '', label: 'All difficulties' },
            ...DIFFICULTIES.map((d) => ({
              value: d,
              label: d.charAt(0).toUpperCase() + d.slice(1),
            })),
          ]}
        />
        <FilterSelect
          label="Tag"
          value={filters.tag}
          onChange={(v) => onFiltersChange({ ...filters, tag: v })}
          options={[
            { value: '', label: 'All tags' },
            ...tagOptions.map((t) => ({ value: t, label: t })),
          ]}
        />
        {hasActiveFilters && (
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {problems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <SearchX className="h-8 w-8 text-slate-400" aria-hidden />
          <p className="text-sm font-medium text-slate-700">No problems match these filters.</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500" aria-live="polite">
            Showing {problems.length} of {total} problem{total === 1 ? '' : 's'}
          </p>
          <ul className="space-y-2">
            {problems.map((p) => (
              <li key={p.slug}>
                <ProblemCard problem={p} language={filters.language || undefined} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value || '__all__'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="w-full">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/5 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
        </li>
      ))}
    </ul>
  );
}
