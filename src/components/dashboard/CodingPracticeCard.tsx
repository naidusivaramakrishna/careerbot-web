'use client';

import Link from 'next/link';
import { ArrowRight, Code2 } from 'lucide-react';

export default function CodingPracticeCard() {
  return (
    <Link
      href="/coding-test"
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
        <Code2 className="h-6 w-6 text-indigo-600" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 group-hover:text-indigo-700">
          Coding Practice
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          Solve problems in Python, Java, C++ with instant AI grading.
        </p>
      </div>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-indigo-500"
        aria-hidden
      />
    </Link>
  );
}
