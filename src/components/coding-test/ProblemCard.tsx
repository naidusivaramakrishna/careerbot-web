'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { CodingProblemSummary, CodingTestLanguage } from '@/types/codingTest';
import { DIFFICULTY_BADGE } from '@/app/coding-test/_lib/ui';

interface ProblemCardProps {
  problem: CodingProblemSummary;
  language?: CodingTestLanguage;
}

export default function ProblemCard({ problem, language }: ProblemCardProps) {
  const href = `/coding-test/${problem.slug}${language ? `?language=${language}` : ''}`;
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="min-w-0">
        <h2 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
          {problem.title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-slate-500">{problem.tag}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[problem.difficulty]}`}
        >
          {problem.difficulty}
        </span>
        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" aria-hidden />
      </div>
    </Link>
  );
}
