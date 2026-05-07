"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Award,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { FillStep, FillResult } from "@/hooks/useResumeProfileFill";

interface ProfileFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  step: FillStep;
  error: string | null;
  result: FillResult | null;
}

const SAVING_MESSAGES = [
  "Saving personal information…",
  "Saving education history…",
  "Saving work experience…",
  "Saving skills…",
  "Saving certifications & projects…",
];

export default function ProfileFillModal({
  isOpen,
  onClose,
  onSuccess,
  step,
  error,
  result,
}: ProfileFillModalProps) {
  const [savingMsgIdx, setSavingMsgIdx] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle saving messages while saving
  React.useEffect(() => {
    if (step === "saving") {
      timerRef.current = setInterval(() => {
        setSavingMsgIdx(i => (i + 1) % SAVING_MESSAGES.length);
      }, 1800);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSavingMsgIdx(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  if (!isOpen) return null;

  const isProcessing = step === "parsing" || step === "saving";

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const summaryRows = result ? [
    { icon: <User size={13} />,          label: "Personal Info",   value: result.personalInfo ? "Saved" : "Skipped", ok: result.personalInfo },
    { icon: <GraduationCap size={13} />, label: "Education",       value: `${result.education} items`,               ok: result.education > 0 },
    { icon: <Briefcase size={13} />,     label: "Experience",      value: `${result.experience} items`,              ok: result.experience > 0 },
    { icon: <Wrench size={13} />,        label: "Skills",          value: `${result.skills} skills`,                 ok: result.skills > 0 },
    { icon: <Award size={13} />,         label: "Certifications",  value: `${result.certifications} items`,          ok: result.certifications > 0 },
    { icon: <FolderKanban size={13} />,  label: "Projects",        value: `${result.projects} items`,                ok: result.projects > 0 },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #1f4e98, #2557a7, #5896d7)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider leading-none mb-0.5">Auto-fill</p>
              <p className="text-sm font-bold text-white leading-none">Fill Profile from Resume</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── PARSING / SAVING ────────────────────────── */}
          {isProcessing && (
            <div className="p-5 flex flex-col items-center gap-4">
              {/* Animated ring */}
              <div className="relative flex items-center justify-center mt-2" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" className="-rotate-90 animate-spin" style={{ animationDuration: "2s" }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#dbeafe" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="#2557a7"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.25} ${2 * Math.PI * 32 * 0.75}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {step === "parsing"
                    ? <FileText size={22} style={{ color: "#2557a7" }} />
                    : <Loader2 size={22} style={{ color: "#2557a7" }} className="animate-spin" />
                  }
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                  {step === "parsing" ? "Parsing your resume…" : SAVING_MESSAGES[savingMsgIdx]}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {step === "parsing"
                    ? "Extracting information from your document"
                    : "Writing data to your profile — please wait"
                  }
                </p>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-2 w-full">
                {["Parse", "Save"].map((s, i) => {
                  const active = (i === 0 && step === "parsing") || (i === 1 && step === "saving");
                  const done = i === 0 && step === "saving";
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                        style={{
                          background: done ? "#2557a7" : active ? "#eff6ff" : "#f1f5f9",
                          color: done ? "white" : active ? "#2557a7" : "#94a3b8",
                          border: active ? "1.5px solid #2557a7" : "1.5px solid transparent",
                        }}
                      >
                        {done ? <CheckCircle2 size={12} /> : i + 1}
                      </div>
                      <span className="text-[9px] font-semibold" style={{ color: active ? "#2557a7" : "#94a3b8" }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DONE ────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="p-5">
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4"
                style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe" }}
              >
                <CheckCircle2 size={20} style={{ color: "#2557a7" }} className="shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Profile filled successfully!</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Resume data has been saved to your profile.</p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">What was saved</p>
              <div className="space-y-1.5 mb-5">
                {summaryRows.map(row => (
                  <div
                    key={row.label}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: row.ok ? "#f8faff" : "#f9fafb", border: `1px solid ${row.ok ? "#dbeafe" : "#e5e7eb"}` }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: row.ok ? "#eff6ff" : "#f1f5f9" }}
                    >
                      <span style={{ color: row.ok ? "#2557a7" : "#94a3b8" }}>{row.icon}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 flex-1">{row.label}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: row.ok ? "#eff6ff" : "#f1f5f9",
                        color: row.ok ? "#1f4e98" : "#94a3b8",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Link
                  href="/profile"
                  onClick={handleSuccess}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #2557a7, #1f4e98)" }}
                >
                  View Profile <ArrowRight size={12} />
                </Link>
                <button
                  onClick={handleSuccess}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ───────────────────────────────────── */}
          {step === "error" && (
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mt-2" style={{ background: "#fef2f2" }}>
                <AlertCircle size={26} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 mb-1">Something went wrong</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{error || "Failed to process your resume. Please try again."}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #2557a7, #1f4e98)" }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
