"use client";

import { useState } from "react";
import { ShieldCheck, Mic, Brain, Trash2, Shield, X, AlertCircle } from "lucide-react";
import { recordConsent } from "@/api/mockInterviewApi";

interface ConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
  isReConsent?: boolean;
}

const CONSENT_VERSION = "v1.1";

const POINTS = [
  {
    icon: Mic,
    color: "text-[#2557a7]",
    bg: "bg-[#2557a7]/5",
    border: "border-[#2557a7]/15",
    title: "Audio Recording",
    desc: "Your voice will be recorded during practice and mock interviews. Audio is deleted immediately after transcription — we do not store recordings.",
  },
  {
    icon: Brain,
    color: "text-[#2557a7]",
    bg: "bg-[#2557a7]/5",
    border: "border-[#2557a7]/15",
    title: "AI Evaluation",
    desc: "Your transcribed answers will be sent to Azure OpenAI (gpt-4o-mini) for evaluation. Transcripts are anonymised — your name, email, and phone are removed before sending.",
  },
  {
    icon: Shield,
    color: "text-[#2557a7]",
    bg: "bg-[#2557a7]/5",
    border: "border-[#2557a7]/15",
    title: "Practice vs Live Mode",
    desc: "Practice: Audio is processed locally on our server. Live Mock: Audio is streamed to Azure Speech Services for real-time transcription. This is a privacy-relevant difference.",
  },
  {
    icon: Trash2,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    title: "Data Retention",
    desc: "Audio: deleted immediately. Transcripts: kept 90 days, then auto-deleted. Reports: kept 1 year. You can delete all your data anytime from Settings → Privacy.",
  },
];

export default function ConsentModal({ onAccept, onDecline, isReConsent = false }: ConsentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await recordConsent(true);
    } catch {
      // Consent endpoint failure is non-blocking — proceed anyway
    } finally {
      setLoading(false);
    }
    onAccept();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onDecline();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="bg-white rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="relative bg-white px-6 py-5 border-b border-gray-100 shrink-0">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-[#2557a7] to-[#5b8fd6]" />
          <button
            onClick={onDecline}
            className="absolute top-4 right-4 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            aria-label="Close"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#2557a7]/8 border border-[#2557a7]/15 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck size={22} className="text-[#2557a7]" />
            </div>
            <div>
              <h2 id="consent-title" className="text-base font-bold text-gray-900 tracking-tight">
                {isReConsent ? "Re-consent Required" : "Consent Required"}
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {isReConsent
                  ? "Our privacy policy has changed. Please review and re-consent."
                  : "Before using mock interview features, please review:"}
              </p>
            </div>
          </div>
        </div>

        {/* Re-consent banner */}
        {isReConsent && (
          <div className="bg-[#2557a7]/6 border-b border-[#2557a7]/15 px-5 py-3 flex items-start gap-2.5 shrink-0">
            <AlertCircle size={13} className="text-[#2557a7] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600">
              Policy updated to <strong className="text-gray-800">{CONSENT_VERSION}</strong>. Your previous consent was for an earlier version.
            </p>
          </div>
        )}

        {/* Points list — scrollable */}
        <div className="px-5 py-4 space-y-2.5 overflow-y-auto flex-1">
          {POINTS.map(({ icon: Icon, color, bg, border, title, desc }, i) => (
            <div key={title} className={`flex gap-3 p-3.5 rounded-xl border ${bg} ${border}`}>
              <div className={`shrink-0 mt-0.5 ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm font-bold text-gray-800">{title}</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-gray-400 text-center pt-1">
            Version <strong>{CONSENT_VERSION}</strong> · Withdraw consent anytime in Settings → Privacy
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex flex-col sm:flex-row gap-2.5 border-t border-gray-100 shrink-0">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 py-3 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-md shadow-[#2557a7]/20 hover:shadow-lg hover:shadow-[#2557a7]/25 disabled:opacity-60 flex items-center justify-center gap-2 hover:-translate-y-px active:translate-y-0"
            autoFocus
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              "I Agree — Start Preparing"
            )}
          </button>
          <button
            onClick={onDecline}
            disabled={loading}
            className="sm:w-24 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
