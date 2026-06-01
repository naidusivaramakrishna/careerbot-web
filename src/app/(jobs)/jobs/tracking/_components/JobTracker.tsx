'use client';

import { useRef, useState, useEffect } from 'react';
import {
  ChevronDown, Trash2, ExternalLink, FileText,
  Briefcase, Bookmark, CalendarDays, Award, XCircle,
  StickyNote, CheckCircle2,
} from 'lucide-react';
import { useJobTracker } from '../_hooks/useJobTracker';
import { JobApplicationRecord } from './mockTrackerData';

type TabType = 'Applied' | 'Saved' | 'Interview' | 'Offer' | 'Rejected';

/* ══════════════════════════════════════════
   Config
══════════════════════════════════════════ */
const TAB_CFG: Record<TabType, {
  label: string; color: string; bg: string; border: string; dot: string;
  icon: React.ElementType; emptyMsg: string;
}> = {
  Applied:   { label: "Applied",   color: "#2557a7", bg: "#eff6ff", border: "#bfdbfe", dot: "#60a5fa", icon: Briefcase,    emptyMsg: "No applications yet. Jobs you apply to will show here." },
  Saved:     { label: "Saved",     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#a78bfa", icon: Bookmark,     emptyMsg: "No saved jobs. Bookmark interesting roles to review later." },
  Interview: { label: "Interview", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", dot: "#38bdf8", icon: CalendarDays, emptyMsg: "No interview invites yet. Keep applying!" },
  Offer:     { label: "Offer",     color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0", dot: "#34d399", icon: Award,        emptyMsg: "No offers yet — you're getting closer!" },
  Rejected:  { label: "Rejected",  color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af", icon: XCircle,      emptyMsg: "No rejections tracked. Every no gets you closer to yes." },
};

const ALL_TABS: TabType[] = ['Applied', 'Saved', 'Interview', 'Offer', 'Rejected'];

const GRAD_POOL = [
  "linear-gradient(135deg,#2557a7,#5896d7)",
  "linear-gradient(135deg,#6d28d9,#a78bfa)",
  "linear-gradient(135deg,#b45309,#fbbf24)",
  "linear-gradient(135deg,#15803d,#4ade80)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#be185d,#f472b6)",
];
const avatarGrad = (name: string) => GRAD_POOL[name.charCodeAt(0) % GRAD_POOL.length];

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeSince(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ══════════════════════════════════════════
   Status Dropdown
══════════════════════════════════════════ */
function StatusDropdown({
  current, onChange,
}: {
  current: TabType; onChange: (s: TabType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = TAB_CFG[current];

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-all hover:shadow-sm"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
        <ChevronDown
          size={12}
          className="opacity-50 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-9 z-20 rounded-2xl py-1.5 min-w-39 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 12px 36px rgba(0,0,0,0.14)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {ALL_TABS.map((s) => {
            const c = TAB_CFG[s];
            const isActive = s === current;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-gray-50"
                style={{ color: isActive ? c.color : '#374151' }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                {c.label}
                {isActive && <CheckCircle2 size={13} className="ml-auto shrink-0" style={{ color: c.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Empty State
══════════════════════════════════════════ */
function EmptyState({ tab }: { tab: TabType }) {
  const cfg = TAB_CFG[tab];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon size={22} style={{ color: cfg.color }} />
      </div>
      <h3 className="text-[14px] font-bold text-gray-800 mb-1.5">{cfg.label} — Empty</h3>
      <p className="text-[12.5px] text-gray-400 max-w-65 leading-relaxed">{cfg.emptyMsg}</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Job Card
══════════════════════════════════════════ */
interface JobCardProps {
  job: JobApplicationRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (jobId: string, status: TabType) => void;
  onNotesChange: (jobId: string, notes: string) => void;
  onDelete: (jobId: string) => void;
  editingNotes?: string;
}

function JobCard({
  job, isExpanded, onToggleExpand, onStatusChange, onNotesChange, onDelete, editingNotes,
}: JobCardProps) {
  const cfg = TAB_CFG[job.status];

  return (
    <div
      className="rounded-2xl border bg-white transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden"
      style={{
        borderColor: isExpanded ? cfg.border : 'rgba(0,0,0,0.07)',
        boxShadow: isExpanded
          ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${cfg.border}`
          : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Status accent top bar */}
      {isExpanded && (
        <div className="h-0.75 w-full" style={{ background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.color})` }} />
      )}

      {/* Card header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/60 group"
      >
        {/* Company avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0"
          style={{ background: avatarGrad(job.company) }}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-gray-900 truncate group-hover:text-[#2557a7] transition-colors">
            {job.title}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">{job.company}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Status badge */}
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
          </span>
          {/* Date */}
          {job.appliedDate && (
            <span className="hidden md:block text-[11.5px] text-gray-400 font-medium">
              {timeSince(job.appliedDate)}
            </span>
          )}
          {/* Chevron */}
          <ChevronDown
            size={16}
            className="text-gray-400 transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
          />
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: cfg.border + '60', background: cfg.bg + '40' }}>

          {/* Meta row */}
          {job.appliedDate && (
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <CalendarDays size={13} className="text-gray-400" />
              Applied on {fmtDate(job.appliedDate)} · {timeSince(job.appliedDate)}
            </div>
          )}

          {/* Status change */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-gray-600 shrink-0">Move to:</span>
            <StatusDropdown current={job.status} onChange={(s) => onStatusChange(job.id, s)} />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              <StickyNote size={12} />
              Notes
            </label>
            <textarea
              value={editingNotes ?? job.notes}
              onChange={(e) => onNotesChange(job.id, e.target.value)}
              placeholder="Add context, next steps, or reminders…"
              className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2557a7] resize-none transition-all placeholder:text-gray-300"
              rows={3}
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            {job.jobUrl ? (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2557a7] hover:text-[#1a3e8c] transition-colors"
              >
                <ExternalLink size={13} />
                View posting
              </a>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onDelete(job.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
export default function JobTracker() {
  const {
    activeTab, setActiveTab, isLoading, filteredJobs,
    updateJobStatus, updateJobNotes, deleteJob, tabCounts,
  } = useJobTracker();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes]   = useState<Record<string, string>>({});

  const handleStatusChange = (jobId: string, newStatus: TabType) => updateJobStatus(jobId, newStatus);
  const handleNotesChange  = (jobId: string, notes: string) => {
    setEditingNotes((prev) => ({ ...prev, [jobId]: notes }));
    updateJobNotes(jobId, notes);
  };

  const activeCfg = TAB_CFG[activeTab];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fb]">

      {/* ── Header ── */}
      <div className="shrink-0 px-6 pt-5 pb-4 bg-white border-b border-gray-100"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2.5 mb-0.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#2557a7,#3b82f6)" }}
          >
            <FileText size={14} className="text-white" />
          </div>
          <h1 className="text-[17px] font-black text-gray-900 tracking-tight">Application Tracker</h1>
        </div>
        <p className="text-[12.5px] text-gray-400 ml-9.5">Manage applications, interviews, and offers</p>
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-5">
        <div className="flex items-end gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {ALL_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const cfg = TAB_CFG[tab];
            const Icon = cfg.icon;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-semibold whitespace-nowrap transition-all duration-150 border-b-2"
                style={{
                  color: isActive ? cfg.color : '#6b7280',
                  borderBottomColor: isActive ? cfg.color : 'transparent',
                }}
              >
                <Icon size={14} />
                {cfg.label}
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                  style={
                    isActive
                      ? { background: cfg.bg, color: cfg.color }
                      : { background: '#e5e7eb', color: '#9ca3af' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-t-[#2557a7] animate-spin" />
            </div>
            <p className="text-[13px] text-gray-500 font-medium">Loading…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-2.5 max-w-2xl">
            {/* Section header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: activeCfg.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeCfg.dot }} />
                  {activeCfg.label}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                onToggleExpand={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
                onDelete={deleteJob}
                editingNotes={editingNotes[job.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
