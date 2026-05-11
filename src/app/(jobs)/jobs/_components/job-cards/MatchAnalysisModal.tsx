"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMatchExplanation } from "@/api/insightsApi";
import type { MatchExplanationResponse } from "@/api/insightsApi";
import {
  parseResumeFromProfile,
  parseJdByJob,
  createPremiumAction,
  executePremiumAction,
} from "@/api/premiumApi";
import type { PendingActionResponse, ExecuteActionResponse } from "@/api/premiumApi";

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
}

type View = "pick" | "basic" | "premium";

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong:  { label: "Strong Match",  color: "#16a34a", bg: "rgba(220,252,231,0.9)" },
  good:    { label: "Good Match",    color: "#2557a7", bg: "rgba(219,234,254,0.9)" },
  partial: { label: "Partial Match", color: "#d97706", bg: "rgba(254,243,199,0.9)" },
  low:     { label: "Low Match",     color: "#dc2626", bg: "rgba(254,226,226,0.9)" },
};

/* ── Picker view ─────────────────────────────────────────────────────────── */
function PickerView({ jobTitle, company, onSelect, onClose }: {
  jobTitle: string; company: string;
  onSelect: (v: "basic" | "premium") => void;
  onClose: () => void;
}) {
  return (
    <div
      className="relative w-full max-w-2xl rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden px-8 pt-7 pb-6"
        style={{ background: "linear-gradient(135deg,#0f2d4e 0%,#1a3a5c 100%)" }}
      >
        <div className="pointer-events-none absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-10 blur-2xl bg-blue-400" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Match Analysis</p>
            <h2 className="text-[20px] font-extrabold text-white leading-tight">Choose Analysis Type</h2>
            <p className="text-[13px] text-white/55 mt-1 truncate">{jobTitle} · {company}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-0.5 shrink-0"
            style={{ color: "rgba(255,255,255,0.5)" }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="p-8 grid grid-cols-2 gap-5">

        {/* Basic — Free */}
        <button
          type="button"
          onClick={() => onSelect("basic")}
          className="group flex flex-col items-start rounded-2xl border-2 border-[#2557a7]/20 bg-[#f5f8ff] hover:border-[#2557a7] hover:bg-[#eaf0ff] transition-all p-6 text-left focus:outline-none"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm3.707 6.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            FREE
          </span>
          <p className="text-[16px] font-extrabold text-[#0f2d4e] group-hover:text-[#2557a7] transition-colors mb-2">
            Basic Analysis
          </p>
          <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
            Understand your match score across 5 dimensions — skills, title, experience, education and location.
          </p>
          <ul className="space-y-2.5 w-full flex-1">
            {["Score breakdown", "Matched & missing skills", "Plain-English detail", "Instant result"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[12px] text-gray-600">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 w-full py-3 rounded-xl text-[13px] font-bold text-center text-[#2557a7] border-2 border-[#2557a7]/30 group-hover:bg-[#2557a7] group-hover:text-white transition-all">
            View Basic Analysis →
          </div>
        </button>

        {/* Premium — Locked */}
        <button
          type="button"
          onClick={() => onSelect("premium")}
          className="group flex flex-col items-start rounded-2xl border-2 border-amber-200 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-50 transition-all p-6 text-left focus:outline-none relative overflow-hidden"
        >
          <div className="pointer-events-none absolute top-0 right-0 w-24 h-24 opacity-5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-600">
              <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5l-9-4z" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            PREMIUM
          </span>
          <p className="text-[16px] font-extrabold text-amber-900 mb-2">Premium Analysis</p>
          <p className="text-[12px] text-amber-700/70 leading-relaxed mb-5">
            AI-powered deep analysis with personalised suggestions to improve your match score.
          </p>
          <ul className="space-y-2.5 w-full flex-1">
            {["Everything in Basic", "AI improvement tips", "Resume tailoring hints", "Priority action plan"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[12px] text-amber-800">
                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 w-full py-3 rounded-xl text-[13px] font-bold text-center text-amber-700 border-2 border-amber-300 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
            Unlock Premium →
          </div>
        </button>

      </div>
    </div>
  );
}

/* ── Basic analysis view ─────────────────────────────────────────────────── */
function BasicView({ jobId, jobTitle, company, onBack, onClose }: {
  jobId: string; jobTitle: string; company: string;
  onBack: () => void; onClose: () => void;
}) {
  const [data, setData]       = useState<MatchExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getMatchExplanation(jobId)
      .then((res) => { if (!cancelled) { setData(res); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError("Could not load match analysis. Please try again."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [jobId]);

  const band    = data?.band ?? "low";
  const bandCfg = BAND_CONFIG[band] ?? BAND_CONFIG.low;

  const dims = data ? [
    {
      label: "Skills", score: data.explanation.skills.score,
      detail: data.explanation.skills.detail,
      chips: [
        ...data.explanation.skills.matched.map(s => ({ text: s, matched: true })),
        ...data.explanation.skills.missing.map(s => ({ text: s, matched: false })),
      ],
      meta: null,
    },
    {
      label: "Job Title", score: data.explanation.title.score,
      detail: data.explanation.title.detail,
      chips: [],
      meta: data.explanation.title.job_title ? `Required: ${data.explanation.title.job_title}` : null,
    },
    {
      label: "Experience", score: data.explanation.experience.score,
      detail: data.explanation.experience.detail,
      chips: [],
      meta: data.explanation.experience.job_range ? `Required: ${data.explanation.experience.job_range}` : null,
    },
    {
      label: "Education", score: data.explanation.education.score,
      detail: data.explanation.education.detail,
      chips: [],
      meta: data.explanation.education.job_level ? `Required: ${data.explanation.education.job_level}` : null,
    },
    {
      label: "Location", score: data.explanation.location.score,
      detail: data.explanation.location.detail,
      chips: [],
      meta: data.explanation.location.job_location ? `Location: ${data.explanation.location.job_location}` : null,
    },
  ] : [];

  return (
    <div
      className="relative w-full max-w-xl rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden px-6 pt-5 pb-5 shrink-0"
        style={{ background: "linear-gradient(135deg,#0f2d4e 0%,#1a3a5c 100%)" }}
      >
        <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 blur-2xl bg-blue-400" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={onBack} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Back">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 leading-none mb-0.5">Basic Analysis · Free</p>
              <h2 className="text-[15px] font-extrabold text-white leading-tight truncate">{jobTitle}</h2>
              <p className="text-[11px] text-white/45 truncate">{company}</p>
            </div>
          </div>
          {/* Score pill */}
          <div className="flex items-center gap-3 shrink-0">
            {data && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-[26px] font-black text-white leading-none tabular-nums">{Math.round(data.score)}</span>
                  <span className="text-[9px] text-white/40 font-semibold">/ 100</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: bandCfg.bg, color: bandCfg.color }}>
                  {bandCfg.label}
                </span>
              </>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }} aria-label="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {loading && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-9 h-9 rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: "#0f2d4e", borderTopColor: "transparent" }} />
            <p className="text-[13px] font-semibold text-gray-600">Analysing your match…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-[13px] font-semibold text-red-500">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-0 divide-y divide-gray-100">
            {dims.map((dim) => {
              const color = dim.score >= 70 ? "#16a34a" : dim.score >= 40 ? "#d97706" : "#dc2626";
              const scoreColor = dim.score >= 70 ? "text-emerald-600" : dim.score >= 40 ? "text-amber-500" : "text-red-500";
              return (
                <div key={dim.label} className="py-3">
                  {/* Row: label | bar | score */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-20 shrink-0">{dim.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(dim.score, 100)}%`, background: color, transition: "width 0.5s ease" }} />
                    </div>
                    <span className={`text-[13px] font-extrabold tabular-nums w-7 text-right shrink-0 ${scoreColor}`}>{Math.round(dim.score)}</span>
                  </div>
                  {/* Detail */}
                  <p className="text-[11px] text-gray-500 mt-1.5 ml-23 leading-relaxed">{dim.detail}</p>
                  {/* Meta */}
                  {dim.meta && (
                    <p className="text-[10px] text-gray-400 mt-0.5 ml-23">
                      {dim.meta}
                    </p>
                  )}
                  {/* Skill chips */}
                  {dim.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-23">
                      {dim.chips.map((c) => (
                        <span
                          key={c.text}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            c.matched
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                        >
                          {c.matched ? "✓" : "✗"} {c.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-3 mt-1 border-t border-gray-100">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#0f2d4e,#1a4a6c)" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Premium view ────────────────────────────────────────────────────────── */
type PremiumPhase = "preparing" | "confirming" | "executing" | "success" | "error";

function PremiumHeader({ jobTitle, company, onBack, onClose }: {
  jobTitle: string; company: string; onBack: () => void; onClose: () => void;
}) {
  return (
    <div className="relative overflow-hidden px-6 pt-5 pb-5 shrink-0"
      style={{ background: "linear-gradient(135deg,#78350f 0%,#b45309 100%)" }}>
      <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 blur-2xl bg-amber-300" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={onBack} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} aria-label="Back">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 leading-none mb-0.5">Premium Analysis · AI</p>
            <h2 className="text-[15px] font-extrabold text-white leading-tight truncate">{jobTitle}</h2>
            <p className="text-[11px] text-white/45 truncate">{company}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} aria-label="Close">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PremiumView({ jobId, jobTitle, company, onBack, onClose }: {
  jobId: string; jobTitle: string; company: string; onBack: () => void; onClose: () => void;
}) {
  const [phase, setPhase]   = useState<PremiumPhase>("preparing");
  const [pending, setPending] = useState<PendingActionResponse | null>(null);
  const [result, setResult]   = useState<ExecuteActionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — on mount: resolve resume_id + jd_id → create pending action
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        // Parallel: get resume_id from profile + jd_id from job
        const [profileRes, jdRes] = await Promise.all([
          parseResumeFromProfile(),
          parseJdByJob(jobId),
        ]);

        if (cancelled) return;

        const action = await createPremiumAction({
          action_type: "resume_tailor",
          job_id: jobId,
          idempotency_key: `match-analysis-${jobId}-${Date.now()}`,
          options: { resume_id: profileRes.resume_id, jd_id: jdRes.jd_id },
        });

        if (cancelled) return;
        setPending(action);
        setPhase("confirming");
      } catch (err: unknown) {
        if (cancelled) return;
        // 409 from parse-from-profile means resume must be parsed first
        const status = (err as { response?: { status?: number; data?: { must_parse?: boolean; detail?: string } } })?.response?.status;
        const body   = (err as { response?: { data?: { must_parse?: boolean; detail?: string } } })?.response?.data;

        if (status === 409 && body?.must_parse) {
          setErrorMsg("Your resume hasn't been parsed yet. Please run an ATS scan first, then try again.");
        } else if (status === 402) {
          setErrorMsg("Insufficient credits. Please upgrade your plan to use premium analysis.");
        } else if (status === 404) {
          setErrorMsg("No resume found on your profile. Please upload a resume first.");
        } else {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
        setPhase("error");
      }
    }

    prepare();
    return () => { cancelled = true; };
  }, [jobId]);

  // Step 2 — user confirms
  const handleConfirm = async () => {
    if (!pending) return;
    setPhase("executing");
    try {
      const res = await executePremiumAction(pending.action_id);
      setResult(res);
      setPhase("success");
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data;
      setErrorMsg(body?.error?.message ?? (err instanceof Error ? err.message : "Execution failed. Please try again."));
      setPhase("error");
    }
  };

  const creditsAfter = pending
    ? pending.user_credits_remaining - pending.quoted_credits
    : 0;

  return (
    <div
      className="relative w-full max-w-md rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <PremiumHeader jobTitle={jobTitle} company={company} onBack={onBack} onClose={onClose} />

      <div className="px-6 py-6">

        {/* PREPARING */}
        {phase === "preparing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-11 h-11 rounded-full border-4 border-t-transparent animate-spin mb-4"
              style={{ borderColor: "#b45309", borderTopColor: "transparent" }} />
            <p className="text-[14px] font-bold text-gray-800">Preparing analysis…</p>
            <p className="text-[12px] text-gray-400 mt-1">Resolving your resume &amp; job details</p>
          </div>
        )}

        {/* CONFIRMING */}
        {phase === "confirming" && pending && (
          <div className="space-y-4">
            {/* Credit summary */}
            <div className="rounded-2xl p-4 bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">Credit Summary</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-600">Analysis cost</span>
                  <span className="text-[15px] font-extrabold text-amber-700">{pending.quoted_credits} credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Your balance</span>
                  <span className="text-[13px] font-semibold text-gray-700">{pending.user_credits_remaining} credits</span>
                </div>
                <div className="h-px bg-amber-200" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gray-700">After this action</span>
                  <span className="text-[14px] font-extrabold" style={{ color: creditsAfter >= 0 ? "#16a34a" : "#dc2626" }}>
                    {creditsAfter} credits
                  </span>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">What you get</p>
              {["AI-tailored resume suggestions for this job", "Keyword alignment with job description", "Skill gaps & priority action plan"].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[12px] text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#78350f,#b45309)", boxShadow: "0 4px 14px rgba(120,53,15,0.3)" }}
              >
                Confirm — {pending.quoted_credits} credits
              </button>
            </div>
          </div>
        )}

        {/* EXECUTING */}
        {phase === "executing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-11 h-11 rounded-full border-4 border-t-transparent animate-spin mb-4"
              style={{ borderColor: "#b45309", borderTopColor: "transparent" }} />
            <p className="text-[14px] font-bold text-gray-800">Running AI analysis…</p>
            <p className="text-[12px] text-gray-400 mt-1">This usually takes a few seconds</p>
          </div>
        )}

        {/* SUCCESS */}
        {phase === "success" && result && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#dcfce7", boxShadow: "0 6px 20px rgba(34,197,94,0.2)" }}>
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[16px] font-extrabold text-gray-900 mb-1">Analysis Complete!</p>
            <p className="text-[12px] text-gray-400 max-w-xs leading-relaxed">
              Premium AI analysis for <span className="font-semibold text-gray-700">{jobTitle}</span> is ready.
            </p>
            {result.user_credits_remaining !== undefined && (
              <p className="text-[11px] text-gray-400 mt-1">
                Credits used: <span className="font-semibold text-gray-600">{result.credits_used}</span> · Remaining: <span className="font-semibold text-gray-600">{result.user_credits_remaining}</span>
              </p>
            )}
            <button onClick={onClose} className="mt-5 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold"
              style={{ background: "linear-gradient(135deg,#78350f,#b45309)" }}>
              Done
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-[13px] font-bold text-gray-800 mb-1">Could not proceed</p>
            <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">{errorMsg}</p>
            <div className="flex gap-3 mt-5 w-full">
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Root modal ──────────────────────────────────────────────────────────── */
export default function MatchAnalysisModal({ jobId, jobTitle, company, onClose }: Props) {
  const [view, setView] = useState<View>("pick");

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {view === "pick" && (
        <PickerView
          jobTitle={jobTitle}
          company={company}
          onSelect={setView}
          onClose={onClose}
        />
      )}
      {view === "basic" && (
        <BasicView
          jobId={jobId}
          jobTitle={jobTitle}
          company={company}
          onBack={() => setView("pick")}
          onClose={onClose}
        />
      )}
      {view === "premium" && (
        <PremiumView
          jobTitle={jobTitle}
          company={company}
          onBack={() => setView("pick")}
          onClose={onClose}
        />
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
