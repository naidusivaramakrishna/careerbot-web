"use client";

import { Sparkles } from "lucide-react";
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
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable widgets */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0 scroll-smooth scrollbar-hide">
        <TopPickCard jobs={jobs} />
        <TrendingSkillsCard />
        <SalaryInsights jobs={jobs} />
      </div>

      {/* Nancy AI card — sticky at bottom */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-4">
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #0d1b3e 0%, #162a56 50%, #1a3468 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
              transform: "translate(40%, -40%)",
            }}
          />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
                alt="Nancy AI"
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d1b3e]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-white leading-tight">Ask Nancy AI</span>
                <span className="text-[8px] font-bold bg-blue-500/25 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                  Beta
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5 leading-tight">AI career advisor · online now</p>
            </div>
          </div>
          <p className="relative z-10 text-[11px] text-white/45 leading-relaxed mb-3">
            Get personalized career advice, skill gaps &amp; job match insights
          </p>
          <button
            type="button"
            onClick={onChatOpen}
            className="relative z-10 w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[12px] font-semibold text-white transition-all hover:bg-white/25 active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <Sparkles size={12} className="text-blue-300" />
            Chat with Nancy
          </button>
        </div>
      </div>
    </div>
  );
}
