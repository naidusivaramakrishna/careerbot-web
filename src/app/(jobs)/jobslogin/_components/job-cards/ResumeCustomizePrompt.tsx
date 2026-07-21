"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface ResumeCustomizePromptProps {
  jobTitle: string;
  company: string;
  logo?: string;
  matchScore: number;
  bandColor: string;
  bandLabel: string;
  missingSkills: string[];
  applyUrl: string;
  onClose: () => void;
  onApplyWithoutCustomizing: () => void;
  onFixResume: () => void;
  fixingResume?: boolean;
  dontRemindAgain: boolean;
  onDontRemindAgainChange: (checked: boolean) => void;
}

// Semicircle gauge, 180°, needle position derived from score (0-100).
function MatchGauge({ score, color }: { score: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angleDeg = (clamped / 100) * 180; // 0 = left, 180 = right
  const angleRad = (Math.PI * angleDeg) / 180;
  const cx = 55, cy = 55, r = 44;
  const needleX = cx - r * Math.cos(angleRad);
  const needleY = cy - r * Math.sin(angleRad);

  return (
    <svg width="110" height="68" viewBox="0 0 110 68" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d="M 11 55 A 44 44 0 0 1 99 55" fill="none" stroke="#f1f5f9" strokeWidth="9" strokeLinecap="round" />
      <path d="M 11 55 A 44 44 0 0 1 99 55" fill="none" stroke="url(#gaugeGradient)" strokeWidth="7" strokeLinecap="round" />
      <circle cx={needleX} cy={needleY} r="6" fill="white" stroke={color} strokeWidth="3.5" style={{ filter: `drop-shadow(0 2px 4px ${color}66)` }} />
    </svg>
  );
}

export default function ResumeCustomizePrompt({
  jobTitle,
  company,
  logo,
  matchScore,
  bandColor,
  bandLabel,
  missingSkills,
  applyUrl,
  onClose,
  onApplyWithoutCustomizing,
  onFixResume,
  fixingResume = false,
  dontRemindAgain,
  onDontRemindAgainChange,
}: ResumeCustomizePromptProps) {
  const visibleSkills = missingSkills.slice(0, 6);
  const extraCount = missingSkills.length - visibleSkills.length;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={fixingResume ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-bl-3xl rounded-br-3xl rounded-tr-3xl bg-white p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-[18px] font-extrabold text-slate-950">Customize Your Resume in 10 seconds</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={fixingResume}
            className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-[13px] font-bold leading-snug text-slate-900">
            Your resume match score is low, and it&apos;s likely to be filtered out by ATS
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={company} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[16px] font-extrabold text-slate-500">{(company || "J").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-slate-500">{company}</p>
                <p className="truncate text-[15px] font-extrabold leading-snug text-slate-950">{jobTitle}</p>
              </div>
            </div>

            <div className="h-16 w-px shrink-0 bg-slate-100" />

            <div className="flex shrink-0 flex-col items-center">
              <MatchGauge score={matchScore} color={bandColor} />
              <span className="-mt-1 text-[21px] font-black leading-none text-slate-950">{Math.round(matchScore)}%</span>
              <span className="mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: bandColor, background: `${bandColor}1a` }}>
                {bandLabel}
              </span>
            </div>
          </div>

          {missingSkills.length > 0 && (
            <>
              <div className="my-4 border-t border-slate-100" />
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0 text-orange-500" />
                <p className="text-[13px] text-slate-700">
                  Missing <span className="font-extrabold text-slate-950">{missingSkills.length}</span> key skill{missingSkills.length === 1 ? "" : "s"} &amp; bullet point alignment
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <span key={skill} className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                    {skill}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    +{extraCount}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onFixResume}
          disabled={fixingResume}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-wait disabled:opacity-70"
        >
          {fixingResume && <Loader2 size={16} className="animate-spin" />}
          {fixingResume ? "Preparing your match…" : "Fix My Resume Now"}
        </button>

        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-allow-new-tab
          onClick={onApplyWithoutCustomizing}
          className="mt-3 block text-center text-[13px] font-semibold text-slate-500 underline transition-colors hover:text-slate-700"
        >
          Apply Without Customizing
        </a>

        <label className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-slate-500">
          <input
            type="checkbox"
            checked={dontRemindAgain}
            onChange={(e) => onDontRemindAgainChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
          />
          Do not remind me again
        </label>
      </div>
    </div>
  );
}
