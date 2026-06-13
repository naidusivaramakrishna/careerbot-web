"use client";

import { useState } from "react";
import { X } from "lucide-react";
import TopPickCard from "./TopPickCard";
import TrendingSkillsCard from "./TrendingSkillsCard";
import SalaryInsights from "./SalaryInsights";

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

export default function JobsRightSidebar({ jobs = [], onChatOpen }: { jobs?: Job[]; onChatOpen?: () => void }) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  return (
    <>
      {/* Scrollable widgets */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth scrollbar-hide px-3 py-3 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 200 }}>
          <TopPickCard jobs={jobs} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 200 }}>
          <TrendingSkillsCard />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 200 }}>
          <SalaryInsights jobs={jobs} />
        </div>
      </div>

      {/* Nancy AI — fixed floating widget bottom-right of viewport */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {/* Speech bubble */}
        {!bubbleDismissed && (
          <div
            className="relative bg-white rounded-2xl rounded-br-sm px-4 py-3 mb-1"
            style={{
              width: 220,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <button
              type="button"
              onClick={() => setBubbleDismissed(true)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
            <p className="text-[13px] text-gray-700 leading-snug pr-4">
              👋 Hi! I&apos;m Nancy.<br />Ask me about job matches, skill gaps &amp; career advice!
            </p>
          </div>
        )}

        {/* Avatar button */}
        <button
          type="button"
          onClick={() => { setBubbleDismissed(false); onChatOpen?.(); }}
          className="relative w-14 h-14 rounded-full hover:scale-105 active:scale-95 transition-transform"
          style={{
            padding: 2,
            background: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            border: "2px solid #e5e7eb",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
            alt="Nancy AI"
            className="w-full h-full rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        </button>
      </div>
    </>
  );
}
