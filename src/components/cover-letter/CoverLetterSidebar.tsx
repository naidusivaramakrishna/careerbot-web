"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Plus, Search, Sparkles } from "lucide-react";
import type { CoverLetterListItem as ApiListItem } from "@/types/coverLetter";
import CoverLetterListItem from "./CoverLetterListItem";

function mapStatus(status: string): "generated" | "draft" {
  return status === "ready_to_review" ? "generated" : "draft";
}

interface CoverLetterSidebarProps {
  items: ApiListItem[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CoverLetterSidebar({
  items,
  isLoading,
  selectedId,
  onSelect,
  onRename,
  onDelete,
}: CoverLetterSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.role_title, item.company_name].some((value) =>
        value?.toLowerCase().includes(q),
      ),
    );
  }, [items, query]);

  const now = new Date();
  const thisMonthCount = items.filter((item) => {
    const created = new Date(item.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const exportableCount = items.filter((item) => item.status !== "failed").length;

  return (
    <aside className="flex rounded-lg border border-white/80 bg-white/95 p-4 shadow-sm backdrop-blur lg:sticky lg:top-3 lg:max-h-[calc(100vh-2rem)] lg:flex-col lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7]">Letter library</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Cover letters</h2>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2557a7]">
          <FileText className="h-5 w-5" />
        </div>
      </div>

      <Link
        href="/cover-letter/new"
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#2557a7] to-[#1e4a94] px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/60 transition hover:from-[#1e4a94] hover:to-[#1a3f80] hover:shadow-blue-300/40"
      >
        <Plus className="h-4 w-4" />
        New Cover Letter
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetricTile label="Total" value={items.length.toString()} />
        <MetricTile label="Can export" value={exportableCount.toString()} />
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search role or company"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent letters</span>
        {thisMonthCount > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {thisMonthCount} this month
          </span>
        )}
      </div>

      <div className="mt-2 min-h-0 overflow-y-auto overflow-x-visible pr-1 lg:flex-1">
        {isLoading && items.length === 0 ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-[#2557a7]" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              {query.trim() ? "No matching letters" : "No letters yet"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {query.trim() ? "Try another role or company name." : "Create your first tailored letter to see it here."}
            </p>
          </div>
        ) : (
          <ul role="list" className="space-y-2 pb-4">
            {filtered.map((item) => (
              <li key={item.letter_id}>
                <CoverLetterListItem
                  id={item.letter_id}
                  jobTitle={item.role_title ?? "Untitled"}
                  company={item.company_name ?? undefined}
                  createdAt={new Date(item.created_at)}
                  status={mapStatus(item.status)}
                  wordCount={item.word_count}
                  isActive={selectedId === item.letter_id}
                  onClick={() => onSelect(item.letter_id)}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-black text-[#2557a7]">{value}</p>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="flex-1">
              <div className="h-3.5 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-3 h-5 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
