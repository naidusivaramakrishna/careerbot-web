import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CoverLetterTopBar() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Cover Letters</h1>
        <p className="text-sm text-slate-500">AI-tailored letters for every application</p>
      </div>
      {/* Mobile only — desktop shows the sidebar button */}
      <Link
        href="/cover-letter/new"
        className="lg:hidden inline-flex items-center gap-1.5 bg-[#2557a7] hover:bg-[#1e4a94] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Letter
      </Link>
    </div>
  );
}