"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Briefcase, Bookmark, ExternalLink, Trash2, MapPin,
  Search, ClipboardList, ChevronDown, TrendingUp,
  CalendarDays, Layers, BarChart3,
} from "lucide-react";
import {
  getApplicationHistory,
  getSavedJobs,
  removeSavedJob,
  JobApplication,
  SavedJob,
} from "@/utils/jobTracking";

/* ══════════════════════════════════════════
   Status management (localStorage)
══════════════════════════════════════════ */
type AppStatus = "applied" | "reviewing" | "interview" | "offer" | "rejected";

const STATUS_CFG: Record<AppStatus, { label: string; color: string; bg: string; border: string }> = {
  applied:   { label: "Applied",   color: "#2557a7", bg: "#eff6ff", border: "#bfdbfe" },
  reviewing: { label: "In Review", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  interview: { label: "Interview", color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe" },
  offer:     { label: "Offer",     color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  rejected:  { label: "Rejected",  color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
};
const ALL_STATUSES = Object.keys(STATUS_CFG) as AppStatus[];
const STATUS_KEY = "cb_app_statuses";

function loadStatuses(): Record<string, AppStatus> {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}"); } catch { return {}; }
}
function persistStatus(jobId: string, status: AppStatus) {
  const all = loadStatuses();
  all[jobId] = status;
  localStorage.setItem(STATUS_KEY, JSON.stringify(all));
}

/* ══════════════════════════════════════════
   Helpers
══════════════════════════════════════════ */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function timeSince(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const GRAD_POOL = [
  "linear-gradient(135deg,#2557a7,#5896d7)",
  "linear-gradient(135deg,#6d28d9,#a78bfa)",
  "linear-gradient(135deg,#b45309,#fbbf24)",
  "linear-gradient(135deg,#15803d,#4ade80)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#be185d,#f472b6)",
];
const avatarGrad = (name: string) => GRAD_POOL[name.charCodeAt(0) % GRAD_POOL.length];

type Tab = "applied" | "saved";

/* ══════════════════════════════════════════
   Status Badge + Dropdown
══════════════════════════════════════════ */
function StatusDropdown({
  jobId,
  status,
  onChange,
}: {
  jobId: string;
  status: AppStatus;
  onChange: (s: AppStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CFG[status];

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all hover:shadow-sm"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: cfg.color }}
        />
        {cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 rounded-xl overflow-hidden py-1 min-w-[130px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)", background: "white", border: "1px solid #e5e7eb" }}
        >
          {ALL_STATUSES.map((s) => {
            const c = STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(s);
                  persistStatus(jobId, s);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors"
                style={{ color: s === status ? c.color : "#374151" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                {c.label}
                {s === status && <span className="ml-auto text-[10px] font-bold" style={{ color: c.color }}>✓</span>}
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
function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg,#eff6ff,#e0ecff)" }}
      >
        {tab === "applied"
          ? <ClipboardList className="w-9 h-9" style={{ color: "#2557a7" }} />
          : <Bookmark className="w-9 h-9" style={{ color: "#2557a7" }} />}
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">
        {tab === "applied" ? "No applications yet" : "No saved jobs"}
      </h3>
      <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed">
        {tab === "applied"
          ? "Jobs you apply to from the Jobs page will appear here automatically."
          : "Bookmark jobs you're interested in to review and apply later."}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Stat Card
══════════════════════════════════════════ */
function StatCard({
  label, value, icon: Icon, iconBg, iconColor, accent,
}: {
  label: string; value: number;
  icon: React.ElementType; iconBg: string; iconColor: string; accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(37,87,167,0.07)",
        border: "1px solid rgba(37,87,167,0.06)",
      }}
    >
      {/* Accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accent }} />

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Pipeline strip
══════════════════════════════════════════ */
function PipelineStrip({ counts }: { counts: Record<AppStatus, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(37,87,167,0.07)",
        border: "1px solid rgba(37,87,167,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Application Pipeline</p>
        <p className="text-xs text-gray-400">{total} total</p>
      </div>

      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
        {ALL_STATUSES.map((s) => {
          const pct = (counts[s] / total) * 100;
          return pct > 0 ? (
            <div
              key={s}
              className="rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: STATUS_CFG[s].color }}
            />
          ) : null;
        })}
        {total === 0 && <div className="flex-1 rounded-full bg-gray-100" />}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-4 flex-wrap">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_CFG[s].color }} />
            <span className="text-[11px] text-gray-600 font-medium">
              {STATUS_CFG[s].label}
              <span className="ml-1 font-black" style={{ color: STATUS_CFG[s].color }}>{counts[s]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Applied Row
══════════════════════════════════════════ */
function AppliedRow({
  app, status, onStatusChange,
}: {
  app: JobApplication;
  status: AppStatus;
  onStatusChange: (id: string, s: AppStatus) => void;
}) {
  return (
    <div className="group flex items-center gap-4 px-6 py-3.5 border-b border-gray-50 hover:bg-[#f8faff] transition-colors">

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white"
        style={{ background: avatarGrad(app.company) }}
      >
        {app.company.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{app.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{app.company}</p>
      </div>

      {/* Date */}
      <div className="hidden md:flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-xs font-semibold text-gray-700">{fmtDate(app.appliedAt)}</span>
        <span className="text-[11px] text-gray-400">{timeSince(app.appliedAt)}</span>
      </div>

      {/* Status dropdown */}
      <StatusDropdown
        jobId={app.jobId}
        status={status}
        onChange={(s) => onStatusChange(app.jobId, s)}
      />

      {/* Link */}
      {app.url && (
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-[#2557a7] hover:bg-[#eff6ff]"
          title="View job"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Saved Row
══════════════════════════════════════════ */
function SavedRow({ job, onRemove }: { job: SavedJob; onRemove: (id: string) => void }) {
  return (
    <div className="group flex items-center gap-4 px-6 py-3.5 border-b border-gray-50 hover:bg-[#f8faff] transition-colors">

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white"
        style={{ background: avatarGrad(job.company) }}
      >
        {job.company.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-xs text-gray-500 truncate">{job.company}</span>
          {job.location && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 shrink-0">
              <MapPin className="w-3 h-3" />{job.location}
            </span>
          )}
        </div>
      </div>

      {/* Job type */}
      {job.type && (
        <span className="hidden sm:block shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {job.type}
        </span>
      )}

      {/* Date */}
      <div className="hidden md:flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-xs font-semibold text-gray-700">{fmtDate(job.savedAt)}</span>
        <span className="text-[11px] text-gray-400">{timeSince(job.savedAt)}</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(job.jobId)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
        title="Remove"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
export default function JobTracker() {
  const [tab,       setTab]       = useState<Tab>("applied");
  const [applied,   setApplied]   = useState<JobApplication[]>([]);
  const [saved,     setSaved]     = useState<SavedJob[]>([]);
  const [statuses,  setStatuses]  = useState<Record<string, AppStatus>>({});
  const [search,    setSearch]    = useState("");

  const load = useCallback(() => {
    setApplied(getApplicationHistory().slice().reverse());
    setSaved(getSavedJobs().slice().reverse());
    setStatuses(loadStatuses());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (jobId: string, status: AppStatus) => {
    setStatuses((prev) => ({ ...prev, [jobId]: status }));
  };

  const handleRemoveSaved = (id: string) => {
    removeSavedJob(id);
    setSaved((prev) => prev.filter((j) => j.jobId !== id));
  };

  /* Search filter */
  const q = search.toLowerCase();
  const filteredApplied = applied.filter(
    (a) => a.title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
  );
  const filteredSaved = saved.filter(
    (s) => s.title.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
  );

  /* Pipeline counts */
  const pipelineCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applied.filter((a) => (statuses[a.jobId] ?? "applied") === s).length;
    return acc;
  }, {} as Record<AppStatus, number>);

  /* Stats */
  const interviewCount = pipelineCounts.interview + pipelineCounts.offer;
  const today = new Date().toDateString();
  const appliedToday = applied.filter((a) => new Date(a.appliedAt).toDateString() === today).length;

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#2557a7,#5896d7)" }}
            >
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Application Tracker</h1>
          </div>
          <p className="text-sm text-gray-500 ml-10">Monitor your job search progress end-to-end</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white px-3 py-2 rounded-xl border border-gray-100">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Applied"
          value={applied.length}
          icon={Briefcase}
          iconBg="#eff6ff"
          iconColor="#2557a7"
          accent="#2557a7"
        />
        <StatCard
          label="Saved Jobs"
          value={saved.length}
          icon={Bookmark}
          iconBg="#f1f5f9"
          iconColor="#64748b"
          accent="#64748b"
        />
        <StatCard
          label="Interviews"
          value={interviewCount}
          icon={TrendingUp}
          iconBg="#f8fafc"
          iconColor="#0f172a"
          accent="#0f172a"
        />
        <StatCard
          label="Applied Today"
          value={appliedToday}
          icon={BarChart3}
          iconBg="#f0f4f8"
          iconColor="#94a3b8"
          accent="#94a3b8"
        />
      </div>

      {/* ── Pipeline ── */}
      <PipelineStrip counts={pipelineCounts} />

      {/* ── Main Card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(37,87,167,0.08)",
          border: "1px solid rgba(37,87,167,0.07)",
        }}
      >
        {/* Card top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["applied", "saved"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={
                  tab === t
                    ? { background: "white", color: "#2557a7", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                    : { color: "#6b7280" }
                }
              >
                {t === "applied" ? <Briefcase className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {t === "applied" ? "Applied" : "Saved"}
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5"
                  style={
                    tab === t
                      ? { background: "#eff6ff", color: "#2557a7" }
                      : { background: "#e5e7eb", color: "#9ca3af" }
                  }
                >
                  {t === "applied" ? applied.length : saved.length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="pl-8.5 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#2557a7] focus:ring-2 focus:ring-blue-50 outline-none transition-all w-48"
            />
          </div>
        </div>

        {/* Column headers */}
        {((tab === "applied" && filteredApplied.length > 0) ||
          (tab === "saved" && filteredSaved.length > 0)) && (
          <div className="flex items-center gap-4 px-6 py-2 bg-gray-50/80 border-b border-gray-100">
            <div className="w-9 shrink-0" />
            <p className="flex-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Position</p>
            <p className="hidden md:block w-32 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
              Date
            </p>
            {tab === "applied" && (
              <p className="w-24 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                Status
              </p>
            )}
            {tab === "saved" && (
              <p className="hidden sm:block w-16 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                Type
              </p>
            )}
            <div className="w-7 shrink-0" />
          </div>
        )}

        {/* Rows */}
        {tab === "applied" ? (
          filteredApplied.length === 0 ? (
            <EmptyState tab="applied" />
          ) : (
            filteredApplied.map((app) => (
              <AppliedRow
                key={app.jobId}
                app={app}
                status={statuses[app.jobId] ?? "applied"}
                onStatusChange={handleStatusChange}
              />
            ))
          )
        ) : filteredSaved.length === 0 ? (
          <EmptyState tab="saved" />
        ) : (
          filteredSaved.map((job) => (
            <SavedRow key={job.jobId} job={job} onRemove={handleRemoveSaved} />
          ))
        )}
      </div>
    </div>
  );
}
