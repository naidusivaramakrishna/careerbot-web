"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Briefcase, Bookmark, ExternalLink, Trash2, MapPin,
  Search, ClipboardList, ChevronDown, TrendingUp,
  CalendarDays, Layers, BarChart3, CheckCircle2,
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

const STATUS_CFG: Record<AppStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  applied:   { label: "Applied",   color: "#2557a7", bg: "#eff6ff", border: "#bfdbfe", dot: "#60a5fa" },
  reviewing: { label: "In Review", color: "#92400e", bg: "#fffbeb", border: "#fde68a", dot: "#fbbf24" },
  interview: { label: "Interview", color: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe", dot: "#a78bfa" },
  offer:     { label: "Offer",     color: "#065f46", bg: "#ecfdf5", border: "#a7f3d0", dot: "#34d399" },
  rejected:  { label: "Rejected",  color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
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
  jobId, status, onChange,
}: {
  jobId: string; status: AppStatus; onChange: (s: AppStatus) => void;
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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all hover:shadow-sm active:scale-[0.97]"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
        {cfg.label}
        <ChevronDown
          className="w-3 h-3 opacity-50 transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 rounded-2xl overflow-hidden min-w-[148px] animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ boxShadow: "0 12px 36px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)", background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="py-1.5">
            {ALL_STATUSES.map((s) => {
              const c = STATUS_CFG[s];
              const isActive = s === status;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); persistStatus(jobId, s); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-gray-50"
                  style={{ color: isActive ? c.color : "#374151" }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                  {c.label}
                  {isActive && (
                    <CheckCircle2 className="ml-auto w-3.5 h-3.5 shrink-0" style={{ color: c.color }} />
                  )}
                </button>
              );
            })}
          </div>
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
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", boxShadow: "0 4px 16px rgba(37,87,167,0.1)" }}
      >
        {tab === "applied"
          ? <ClipboardList className="w-7 h-7" style={{ color: "#2557a7" }} />
          : <Bookmark className="w-7 h-7" style={{ color: "#2557a7" }} />}
      </div>
      <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
        {tab === "applied" ? "No applications yet" : "No saved jobs"}
      </h3>
      <p className="text-[13px] text-gray-400 max-w-[240px] leading-relaxed">
        {tab === "applied"
          ? "Jobs you apply to will appear here automatically."
          : "Bookmark jobs you're interested in to review later."}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Stat Card
══════════════════════════════════════════ */
function StatCard({
  label, value, icon: Icon, iconColor, accentFrom, accentTo, subtext,
}: {
  label: string; value: number;
  icon: React.ElementType; iconColor: string;
  accentFrom: string; accentTo: string;
  subtext?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
      style={{
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {/* Top gradient strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})` }}
      />

      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentFrom}15` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
        {subtext && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtext}</span>
        )}
      </div>

      <div>
        <p
          className="text-3xl font-black leading-none tabular-nums"
          style={{ color: iconColor }}
        >
          {value}
        </p>
        <p className="text-[12px] text-gray-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Pipeline / Funnel
══════════════════════════════════════════ */
function PipelineStrip({ counts }: { counts: Record<AppStatus, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <p className="text-[12px] font-bold text-gray-600 uppercase tracking-widest">Application Pipeline</p>
        </div>
        <p className="text-[12px] font-semibold text-gray-400">{total === 1 ? "0 applications" : `${total} total`}</p>
      </div>

      {/* Stage tiles */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CFG[s];
          const count = counts[s];
          const pct = Math.round((count / Math.max(Object.values(counts).reduce((a, b) => a + b, 0), 1)) * 100);
          return (
            <div
              key={s}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all hover:shadow-sm"
              style={{ background: count > 0 ? cfg.bg : "#f9fafb", border: `1px solid ${count > 0 ? cfg.border : "#e5e7eb"}` }}
            >
              <span
                className="text-[20px] font-black leading-none tabular-nums"
                style={{ color: count > 0 ? cfg.color : "#d1d5db" }}
              >
                {count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: count > 0 ? cfg.color : "#9ca3af" }}>
                {cfg.label}
              </span>
              {count > 0 && (
                <span className="text-[9px] font-semibold text-gray-400">{pct}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        {ALL_STATUSES.map((s) => {
          const pct = (counts[s] / total) * 100;
          return pct > 0 ? (
            <div
              key={s}
              className="rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: STATUS_CFG[s].dot }}
            />
          ) : null;
        })}
        {total <= 1 && <div className="flex-1 rounded-full bg-gray-100" />}
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
  const cfg = STATUS_CFG[status];
  return (
    <div
      className="group flex items-center gap-4 pl-0 pr-5 py-3.5 border-b border-gray-50 hover:bg-[#f8faff] transition-all relative"
    >
      {/* Status left accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: cfg.dot }}
      />

      {/* Avatar */}
      <div className="pl-5 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
          style={{ background: avatarGrad(app.company) }}
        >
          {app.company.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-gray-900 truncate">{app.title}</p>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">{app.company}</p>
      </div>

      {/* Date */}
      <div className="hidden md:flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[12px] font-semibold text-gray-600">{fmtDate(app.appliedAt)}</span>
        <span className="text-[11px] text-gray-400">{timeSince(app.appliedAt)}</span>
      </div>

      {/* Status dropdown */}
      <StatusDropdown jobId={app.jobId} status={status} onChange={(s) => onStatusChange(app.jobId, s)} />

      {/* Link */}
      {app.url && (
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-[#2557a7] hover:bg-[#eff6ff]"
          title="View job posting"
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
    <div className="group flex items-center gap-4 pl-0 pr-5 py-3.5 border-b border-gray-50 hover:bg-[#f8faff] transition-all relative">
      {/* Left accent */}
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-300" />

      {/* Avatar */}
      <div className="pl-5 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
          style={{ background: avatarGrad(job.company) }}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-gray-900 truncate">{job.title}</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-[12px] text-gray-500 truncate">{job.company}</span>
          {job.location && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
              <MapPin className="w-2.5 h-2.5" />{job.location}
            </span>
          )}
        </div>
      </div>

      {/* Job type pill */}
      {job.type && (
        <span className="hidden sm:block shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100/80 text-gray-500 border border-gray-200">
          {job.type}
        </span>
      )}

      {/* Date */}
      <div className="hidden md:flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[12px] font-semibold text-gray-600">{fmtDate(job.savedAt)}</span>
        <span className="text-[11px] text-gray-400">{timeSince(job.savedAt)}</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(job.jobId)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
        title="Remove from saved"
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
  const [tab,      setTab]      = useState<Tab>("applied");
  const [applied,  setApplied]  = useState<JobApplication[]>([]);
  const [saved,    setSaved]    = useState<SavedJob[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AppStatus>>({});
  const [search,   setSearch]   = useState("");

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

  const q = search.toLowerCase();
  const filteredApplied = applied.filter(
    (a) => a.title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
  );
  const filteredSaved = saved.filter(
    (s) => s.title.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
  );

  const pipelineCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applied.filter((a) => (statuses[a.jobId] ?? "applied") === s).length;
    return acc;
  }, {} as Record<AppStatus, number>);

  const interviewCount = pipelineCounts.interview + pipelineCounts.offer;
  const today = new Date().toDateString();
  const appliedToday = applied.filter((a) => new Date(a.appliedAt).toDateString() === today).length;

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-4">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#2557a7,#3b82f6)" }}
            >
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[20px] font-black text-gray-900 tracking-tight">Application Tracker</h1>
          </div>
          <p className="text-[13px] text-gray-400 ml-[42px]">Monitor your job search from application to offer</p>
        </div>

        <div
          className="flex items-center gap-2 text-[12px] text-gray-500 font-medium px-3 py-2 rounded-xl shrink-0"
          style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Applied"
          value={applied.length}
          icon={Briefcase}
          iconColor="#2557a7"
          accentFrom="#2557a7"
          accentTo="#3b82f6"
        />
        <StatCard
          label="Saved Jobs"
          value={saved.length}
          icon={Bookmark}
          iconColor="#7c3aed"
          accentFrom="#7c3aed"
          accentTo="#a78bfa"
        />
        <StatCard
          label="Interviews"
          value={interviewCount}
          icon={TrendingUp}
          iconColor="#065f46"
          accentFrom="#059669"
          accentTo="#34d399"
        />
        <StatCard
          label="Applied Today"
          value={appliedToday}
          icon={BarChart3}
          iconColor="#b45309"
          accentFrom="#d97706"
          accentTo="#fbbf24"
          subtext={appliedToday > 0 ? "Active" : undefined}
        />
      </div>

      {/* ── Pipeline ── */}
      <PipelineStrip counts={pipelineCounts} />

      {/* ── Main Table Card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Tab bar + search */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 shrink-0">
            {(["applied", "saved"] as Tab[]).map((t) => {
              const isActive = tab === t;
              const count = t === "applied" ? applied.length : saved.length;
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(""); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 whitespace-nowrap"
                  style={
                    isActive
                      ? { background: "white", color: "#2557a7", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                      : { color: "#6b7280" }
                  }
                >
                  {t === "applied" ? <Briefcase className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {t === "applied" ? "Applied" : "Saved"}
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={
                      isActive
                        ? { background: "#eff6ff", color: "#2557a7" }
                        : { background: "#e5e7eb", color: "#9ca3af" }
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or company…"
              className="w-full pl-9 pr-4 py-2 text-[12.5px] border border-gray-200 rounded-xl bg-gray-50/80 focus:bg-white focus:border-[#2557a7] focus:ring-2 focus:ring-blue-50/80 outline-none transition-all"
            />
          </div>
        </div>

        {/* Column headers */}
        {((tab === "applied" && filteredApplied.length > 0) ||
          (tab === "saved" && filteredSaved.length > 0)) && (
          <div className="flex items-center gap-4 pl-8 pr-5 py-2 bg-gray-50/60 border-b border-gray-100">
            <div className="w-9 shrink-0" />
            <p className="flex-1 text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Position</p>
            <p className="hidden md:block w-32 text-right text-[10.5px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
              Date
            </p>
            {tab === "applied" && (
              <p className="w-24 text-right text-[10.5px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                Status
              </p>
            )}
            {tab === "saved" && (
              <p className="hidden sm:block w-16 text-center text-[10.5px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
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

        {/* Footer count */}
        {((tab === "applied" && filteredApplied.length > 0) ||
          (tab === "saved" && filteredSaved.length > 0)) && (
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end">
            <p className="text-[11px] text-gray-400 font-medium">
              {tab === "applied"
                ? `${filteredApplied.length} application${filteredApplied.length !== 1 ? "s" : ""}`
                : `${filteredSaved.length} saved job${filteredSaved.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
