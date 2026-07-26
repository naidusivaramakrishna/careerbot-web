"use client";

import { useState } from "react";
import { Brain, MessageCircle, X } from "lucide-react";
import TopPickCard from "./TopPickCard";
import TrendingSkillsCard from "./TrendingSkillsCard";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  matchScore?: number;
  match_band?: string;
  salary?: string;
}

export default function JobsRightSidebar({
  topPicks = [],
  topPicksLoading = false,
  topPicksEmptyMessage,
  onChatOpen,
  onViewAllRecommendations,
}: {
  topPicks?: Job[];
  topPicksLoading?: boolean;
  topPicksEmptyMessage?: string;
  onChatOpen?: () => void;
  onViewAllRecommendations?: () => void;
}) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  return (
    <>
      <div className="border-b border-slate-200/80 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#4F46E5] shadow-inner shadow-white">
              <Brain size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold leading-tight text-slate-950">Career intelligence</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Live recommendations from your job graph</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">
            Live
          </span>
        </div>
      </div>

      <div className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto scroll-smooth bg-[#f8fafc] px-3 py-3">
        <div className="space-y-3 pb-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <TopPickCard
              jobs={topPicks}
              loading={topPicksLoading}
              emptyMessage={topPicksEmptyMessage}
              onViewAll={onViewAllRecommendations}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm" style={{ minHeight: 330 }}>
            <TrendingSkillsCard />
          </div>
          <div className="rounded-2xl border border-[#4F46E5]/15 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  setBubbleDismissed(false);
                  onChatOpen?.();
                }}
                className="relative h-12 w-12 shrink-0 rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                style={{ boxShadow: "0 8px 24px rgba(79,70,229,0.18)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
                  alt="Nancy AI"
                  className="h-full w-full rounded-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-extrabold text-slate-950">Nancy AI Assistant</h3>
                  <span className="rounded bg-[#eef3ff] px-1.5 py-0.5 text-[9px] font-black text-[#4F46E5]">BETA</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  Ask about fit, salary, gaps, and your next best move.
                </p>
                <button
                  type="button"
                  onClick={onChatOpen}
                  className="mt-3 w-full rounded-2xl border border-[#4F46E5]/20 bg-white px-4 py-2.5 text-[12px] font-bold text-[#4F46E5] transition-colors hover:bg-[#eef3ff]"
                >
                  Chat with Nancy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 xl:hidden">
        {!bubbleDismissed && (
          <div
            className="relative mb-1 rounded-2xl rounded-br-sm bg-white px-4 py-3"
            style={{
              width: 232,
              boxShadow: "0 18px 42px rgba(15,23,42,0.14), 0 1px 4px rgba(15,23,42,0.08)",
              border: "1px solid rgba(148,163,184,0.28)",
            }}
          >
            <button
              type="button"
              onClick={() => setBubbleDismissed(true)}
              className="absolute right-2 top-2 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
            <p className="pr-4 text-[13px] leading-snug text-slate-700">
              Hi, I&apos;m Nancy. Ask me about job fit, gaps, and next steps.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setBubbleDismissed(false);
            onChatOpen?.();
          }}
          className="relative h-14 w-14 rounded-full transition-transform hover:scale-105 active:scale-95"
          style={{
            padding: 2,
            background: "#fff",
            boxShadow: "0 18px 36px rgba(15,23,42,0.18)",
            border: "2px solid #e5e7eb",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
            alt="Nancy AI"
            className="h-full w-full rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          <MessageCircle size={14} className="absolute -left-1 -top-1 rounded-full bg-[#4F46E5] p-0.5 text-white shadow-sm" />
        </button>
      </div>
    </>
  );
}
