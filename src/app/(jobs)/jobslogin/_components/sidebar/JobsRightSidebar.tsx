"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
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
  readonly topPicks?: Job[];
  readonly topPicksLoading?: boolean;
  readonly topPicksEmptyMessage?: string;
  readonly onChatOpen?: () => void;
  readonly onViewAllRecommendations?: () => void;
}) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  return (
    <>
      <div className="jobs-intelligence-body scrollbar-hide relative min-h-0 flex-1 overflow-y-auto scroll-smooth bg-white px-3 pb-3 pt-2">
        <div className="divide-y divide-slate-100">
          <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <TopPickCard
              jobs={topPicks}
              loading={topPicksLoading}
              emptyMessage={topPicksEmptyMessage}
              onViewAll={onViewAllRecommendations}
            />
          </div>
          <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <TrendingSkillsCard />
          </div>
          <div className="my-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => {
                  setBubbleDismissed(false);
                  onChatOpen?.();
                }}
                className="relative h-10 w-10 shrink-0 rounded-full focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
                  alt="Nancy AI"
                  className="h-full w-full rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-gray-900">Nancy AI Assistant</h3>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">BETA</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                  Ask about fit, salary, gaps, and your next best move.
                </p>
                <button
                  type="button"
                  onClick={onChatOpen}
                  className="mt-3 w-full rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#4F46E5] transition-colors hover:bg-gray-50"
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
