"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getActiveResumeId,
  parseJobDescriptionForId,
  createPremiumAction,
  executePremiumAction,
} from "@/api/premiumApi";
import type { PendingActionResponse } from "@/api/premiumApi";

type Phase = "preparing" | "confirming" | "executing" | "success" | "error";

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  onClose: () => void;
}

export default function MatchAnalysisModal({
  jobId,
  jobTitle,
  company,
  jobDescription,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<Phase>("preparing");
  const [pending, setPending] = useState<PendingActionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — on mount: resolve resume_id + jd_id → create pending action
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        const [resumeId, jdId] = await Promise.all([
          getActiveResumeId(),
          parseJobDescriptionForId(jobId, jobDescription),
        ]);

        if (cancelled) return;

        const action = await createPremiumAction({
          action_type: "resume_tailor",
          job_id: jobId,
          idempotency_key: `user-click-${Date.now()}`,
          options: { resume_id: resumeId, jd_id: jdId },
        });

        if (cancelled) return;
        setPending(action);
        setPhase("confirming");
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setErrorMsg(msg);
        setPhase("error");
      }
    }

    prepare();
    return () => { cancelled = true; };
  }, [jobId, jobDescription]);

  // Step 2 — user confirms → execute
  const handleConfirm = async () => {
    if (!pending) return;
    setPhase("executing");
    try {
      await executePremiumAction(pending.action_id);
      setPhase("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Execution failed. Please try again.";
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  const creditsAfter =
    pending ? pending.user_credits_remaining - pending.quoted_credits : 0;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-5"
          style={{ background: "linear-gradient(135deg,#0f2d4e 0%,#1a3a5c 100%)" }}
        >
          <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10 blur-2xl bg-blue-400" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">
                Smart Match
              </p>
              <h2 className="text-[17px] font-extrabold text-white leading-tight">
                Match Analysis
              </h2>
              <p className="text-[12px] text-white/60 mt-0.5 leading-snug">
                {jobTitle} · {company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-0.5 shrink-0"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* PREPARING */}
          {phase === "preparing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
                style={{ borderColor: "#0f2d4e", borderTopColor: "transparent" }}
              />
              <p className="text-[14px] font-bold text-gray-800">Preparing analysis…</p>
              <p className="text-[12px] text-gray-400 mt-1">Fetching your resume &amp; parsing JD</p>
            </div>
          )}

          {/* CONFIRMING */}
          {phase === "confirming" && pending && (
            <div className="space-y-4">
              {/* Credit cost card */}
              <div className="rounded-2xl p-4" style={{ background: "#f0f4f8", border: "1px solid #e2e8f0" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Credit Summary
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Analysis cost</span>
                    <span className="text-[14px] font-extrabold text-[#0f2d4e]">
                      {pending.quoted_credits} credit{pending.quoted_credits !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">Your balance</span>
                    <span className="text-[13px] font-semibold text-gray-700">
                      {pending.user_credits_remaining} credits
                    </span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-700">After this action</span>
                    <span
                      className="text-[14px] font-extrabold"
                      style={{ color: creditsAfter >= 0 ? "#0a7c5c" : "#dc2626" }}
                    >
                      {creditsAfter} credits
                    </span>
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                  What you get
                </p>
                {[
                  "Resume tailored to this specific job",
                  "Keyword alignment with JD",
                  "Highlighted skill gaps to close",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[12px] text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#0f2d4e,#1a4a6c)", boxShadow: "0 4px 14px rgba(15,45,78,0.3)" }}
                >
                  Confirm — {pending.quoted_credits} credits
                </button>
              </div>
            </div>
          )}

          {/* EXECUTING */}
          {phase === "executing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
                style={{ borderColor: "#0f2d4e", borderTopColor: "transparent" }}
              />
              <p className="text-[14px] font-bold text-gray-800">Running analysis…</p>
              <p className="text-[12px] text-gray-400 mt-1">This usually takes a few seconds</p>
            </div>
          )}

          {/* SUCCESS */}
          {phase === "success" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#dcfce7", boxShadow: "0 6px 20px rgba(34,197,94,0.25)" }}
              >
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[16px] font-extrabold text-gray-900 mb-1">Analysis Complete!</p>
              <p className="text-[12px] text-gray-400 max-w-xs leading-relaxed">
                Your tailored resume analysis for <span className="font-semibold text-gray-700">{jobTitle}</span> is ready.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold"
                style={{ background: "#0f2d4e" }}
              >
                Done
              </button>
            </div>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#fef2f2" }}
              >
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-[14px] font-bold text-gray-800 mb-2">Analysis Failed</p>
              <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-5 px-8 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
