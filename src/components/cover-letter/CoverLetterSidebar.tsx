'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { CoverLetterListItem as ApiListItem } from '@/types/coverLetter';
import CoverLetterListItem from './CoverLetterListItem';

function mapStatus(status: string): 'generated' | 'draft' {
  return status === 'ready_to_review' ? 'generated' : 'draft';
}

interface CoverLetterSidebarProps {
  items: ApiListItem[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CoverLetterSidebar({
  items,
  isLoading,
  selectedId,
  onSelect,
  onDelete,
}: CoverLetterSidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.role_title?.toLowerCase().includes(q) ||
          item.company_name?.toLowerCase().includes(q)
        );
      })
    : items;

  const now = new Date();
  const thisMonthCount = items.filter((item) => {
    const d = new Date(item.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <aside className="hidden lg:flex w-[280px] flex-shrink-0 bg-white border-r border-slate-200 flex-col h-full">
      {/* New Letter button */}
      <div className="p-3 border-b border-slate-100">
        <Link
          href="/cover-letter/new"
          className="flex items-center justify-center gap-2 w-full bg-[#2557a7] hover:bg-[#1e4a94] text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Letter
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search letters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2557a7]/30 focus:border-[#2557a7] transition-colors"
          />
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Recent Letters
        </span>
      </div>

      {/* Letter list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading && items.length === 0 ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center px-4 py-8">
            {query.trim() ? 'No letters match your search.' : 'No letters yet.'}
          </p>
        ) : (
          <ul role="list" className="flex flex-col gap-0.5 pb-2">
            {filtered.map((item) => (
              <li key={item.letter_id}>
                <CoverLetterListItem
                  id={item.letter_id}
                  jobTitle={item.role_title ?? 'Untitled'}
                  company={item.company_name ?? undefined}
                  createdAt={new Date(item.created_at)}
                  status={mapStatus(item.status)}
                  isActive={selectedId === item.letter_id}
                  onClick={() => onSelect(item.letter_id)}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stats pill */}
      {thisMonthCount > 0 && (
        <div className="p-3 border-t border-slate-100">
          <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
            {thisMonthCount} letter{thisMonthCount !== 1 ? 's' : ''} generated this month
          </span>
        </div>
      )}
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 px-3 py-3 animate-pulse">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}