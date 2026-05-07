"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEnglishEssentials, EnglishEssentials } from "@/api/mockInterviewApi";
import { Loader2 } from "lucide-react";
import {
  Zap,
  RefreshCw,
  AlertTriangle,
  Globe,
  BookOpen,
  Languages,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// ─── Static Data ───────────────────────────────────────────────────────────────

const POWER_PHRASES = [
  {
    category: "Starting an Answer",
    items: [
      { phrase: "That's a great question. Let me explain…", tip: "Buys thinking time — max 1-2 times per interview" },
      { phrase: "Sure, I would be happy to answer that.", tip: "Shows enthusiasm and readiness" },
      { phrase: "To give you a bit of context…", tip: "Better opener than 'basically'" },
      { phrase: "In my experience…", tip: "Signals a real example is coming" },
      { phrase: "Let me walk you through that.", tip: "Structured and confident" },
    ],
  },
  {
    category: "Explaining Something",
    items: [
      { phrase: "The main purpose of this was…", tip: "Shows big-picture thinking" },
      { phrase: "What this does is…", tip: "Good for technical explanations" },
      { phrase: "I approached this by first…", tip: "Shows methodical thinking" },
      { phrase: "The key challenge here was…", tip: "Leads into a STAR story naturally" },
      { phrase: "Let me break this down…", tip: "Signals clarity and structure" },
    ],
  },
  {
    category: "Ending an Answer",
    items: [
      { phrase: "The result was…", tip: "Always end with an outcome" },
      { phrase: "The key thing I learnt was…", tip: "Shows reflection and growth" },
      { phrase: "In summary…", tip: "Good for longer answers" },
      { phrase: "Does that answer your question?", tip: "Shows engagement and communication" },
    ],
  },
  {
    category: "Strength & Weakness Questions",
    items: [
      { phrase: "One of my strengths is…", tip: "Confident, not arrogant" },
      { phrase: "I am actively working on improving…", tip: "Shows self-awareness for weakness questions" },
      { phrase: "I have seen myself grow significantly in…", tip: "Frames improvement positively" },
    ],
  },
  {
    category: "Closing the Interview",
    items: [
      { phrase: "Thank you for this opportunity.", tip: "Always say this at the end" },
      { phrase: "I am excited about the possibility of joining your team.", tip: "Shows genuine interest" },
      { phrase: "Is there anything else you would like to know about me?", tip: "Proactive and engaged" },
      { phrase: "Could you tell me more about the team I would be working with?", tip: "Shows you're thinking about fit" },
    ],
  },
];

const DIFFICULT_MOMENTS = [
  {
    situation: "You don't know the answer",
    responses: [
      "\"That's an interesting question. I haven't encountered this specific scenario, but based on my experience with [related area], I would approach it by…\"",
      "\"I'm not fully familiar with that, but I'd like to learn. Here's how I'd find out quickly…\"",
      "\"Honestly, I haven't faced that exact situation, but here's how I'd think through it…\"",
    ],
    tip: "Never say 'I don't know' and stop. Always bridge to something you do know.",
  },
  {
    situation: "You need time to think",
    responses: [
      "\"That's a great question. Let me think about that for a moment.\"",
      "\"Give me just a second to structure my thoughts on that.\"",
    ],
    tip: "Silence for 3-5 seconds is completely fine. Interviewers respect thoughtful answers.",
  },
  {
    situation: "You lost your train of thought",
    responses: [
      "\"Let me rephrase that. What I meant to say is…\"",
      "\"To summarise what I was saying…\"",
      "\"Sorry, let me start that example again more clearly.\"",
    ],
    tip: "It's okay to restart. Interviewers respect recovery far more than stumbling through.",
  },
  {
    situation: "You partially know the answer",
    responses: [
      "\"I'm familiar with [part of it]. The part I'm less certain about is [X], but I believe it works by…\"",
    ],
    tip: "Partial honesty is better than pretending. It shows integrity.",
  },
];


const HINGLISH_GUIDE = {
  policy: [
    {
      mode: "Practice Mode",
      rule: "Hinglish is allowed",
      detail: "The system will coach you toward clearer English phrasing, but won't penalize Hinglish. Use it as a crutch while you build confidence.",
    },
    {
      mode: "Mock Interview Mode",
      rule: "Hinglish is flagged in scoring",
      detail: "Hinglish phrases are detected and alternative phrasings are shown in your report. It does NOT fail you — it shows you what to improve.",
    },
    {
      mode: "Regional Accent",
      rule: "Accent is NEVER penalized",
      detail: "The system scores clarity, vocabulary, and structure — NOT your accent. A strong regional accent is normal and accepted.",
    },
  ],
  examples: [
    { hinglish: "Basically woh kya tha…", english: "What happened was…", note: "Replace the Hinglish setup with a direct English opener" },
    { hinglish: "Agar koi problem aaya toh…", english: "If any issue arose…", note: "Use conditional structures in English" },
    { hinglish: "Main thoda nervous tha but…", english: "I was a bit nervous, but…", note: "Full English sentences flow better in interviews" },
    { hinglish: "Humara team ne decide kiya…", english: "Our team decided to…", note: "Team decisions should always be framed in English" },
  ],
  tip: "The goal is not to eliminate your identity. It is to make sure the interviewer can understand you clearly every single time.",
};

// ─── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "phrases", label: "Phrases", icon: Zap, color: "text-[#2557a7]" },
  { id: "difficult", label: "Difficult Moments", icon: AlertTriangle, color: "text-[#2557a7]" },
  { id: "fillers", label: "Fillers", icon: RefreshCw, color: "text-gray-500" },
  { id: "mistakes", label: "Common Mistakes", icon: Globe, color: "text-[#2557a7]" },
  { id: "phrasal", label: "Phrasal Verbs", icon: BookOpen, color: "text-[#2557a7]" },
  { id: "hinglish", label: "Hinglish Guide", icon: Languages, color: "text-gray-500" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EnglishPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("phrases");
  const [apiData, setApiData] = useState<EnglishEssentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setApiError(null);
    getEnglishEssentials()
      .then(setApiData)
      .catch(() => setApiError("Could not load content. Please check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fillerFixes = apiData?.filler_replacements
    ? Object.entries(apiData.filler_replacements).map(([wrong, right]) => ({ wrong, right, reason: "" }))
    : [];

  const commonMistakes = (apiData?.common_mistakes ?? []).map((m) => ({ wrong: m.wrong, right: m.correct, note: "" }));

  const phrasalVerbs = (apiData?.phrasal_verbs ?? []).map((pv) => ({ ...pv, example: "" }));

  const handleTabKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const ids = TABS.map((t) => t.id);
    const idx = ids.indexOf(currentId);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveTab(ids[(idx + 1) % ids.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab(ids[(idx - 1 + ids.length) % ids.length]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-[#2557a7] animate-spin mr-2" />
          <p className="text-sm text-gray-500">Loading content…</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm text-gray-500">{apiError}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2 bg-[#2557a7] text-white rounded-xl text-sm font-semibold hover:bg-[#1e4a8f] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page Header ── */}
      <div className="mb-7">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-5"
        >
          <ChevronLeft size={14} />
          Back to Mock Interview
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#2557a7]/8 border border-[#2557a7]/15 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-[#2557a7]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Interview English Essentials
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#2557a7]/8 border border-[#2557a7]/15 text-[#2557a7] rounded-full uppercase tracking-wide shrink-0">
                Stage 2
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-snug">
              The only English you need for interviews. 10 minutes to read.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div
        role="tablist"
        aria-label="English essentials sections"
        className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide"
      >
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            onKeyDown={(e) => handleTabKeyDown(e, id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]/40 ${
              activeTab === id
                ? "bg-[#2557a7] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon size={13} className={activeTab === id ? "text-white" : color} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Panel ── */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden"
      >

        {/* ────────────────── Phrases ────────────────── */}
        {activeTab === "phrases" && (
          <div>
            {/* Panel intro */}
            <div className="px-5 py-3.5 bg-[#2557a7]/5 border-b border-[#2557a7]/15">
              <p className="text-xs text-[#2557a7] font-semibold leading-relaxed">
                30 essential phrases that make you sound fluent and confident. Practice saying each one 3 times aloud.
              </p>
            </div>

            {POWER_PHRASES.map((group, gi) => (
              <div key={gi}>
                {/* Category divider */}
                <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {group.category}
                  </p>
                </div>

                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className={`px-5 py-4 hover:bg-gray-50/70 transition-colors ${
                      i < group.items.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1.5">
                      &ldquo;{item.phrase}&rdquo;
                    </p>
                    <p className="text-xs text-[#2557a7]/80 font-medium">{item.tip}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ────────────────── Difficult Moments ────────────────── */}
        {activeTab === "difficult" && (
          <div>
            <div className="px-5 py-3.5 bg-[#2557a7]/5 border-b border-[#2557a7]/15">
              <p className="text-xs text-[#2557a7] font-semibold leading-relaxed">
                Prepared responses for the trickiest interview moments. Read them until they feel natural.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {DIFFICULT_MOMENTS.map((item, i) => (
                <div key={i} className="px-5 py-5 hover:bg-gray-50/70 transition-colors">
                  {/* Situation label */}
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className="w-5 h-5 rounded-md bg-[#2557a7]/8 border border-[#2557a7]/15 flex items-center justify-center shrink-0">
                      <AlertTriangle size={11} className="text-[#2557a7]" />
                    </div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      When: {item.situation}
                    </p>
                  </div>

                  {/* Response options */}
                  <div className="space-y-2 mb-3.5">
                    {item.responses.map((r, ri) => (
                      <div
                        key={ri}
                        className="bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-xl px-4 py-2.5"
                      >
                        <p className="text-sm text-gray-700 leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tip */}
                  <p className="text-xs text-gray-500 leading-relaxed pl-0.5">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── Fillers ────────────────── */}
        {activeTab === "fillers" && (
          <div>
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                Stop Saying → Say Instead. These replacements alone will make you sound 30% more confident.
              </p>
            </div>

            {fillerFixes.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No filler data available.</div>
            )}
            <div className="divide-y divide-gray-100">
              {fillerFixes.map((item, i) => (
                <div key={i} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="grid grid-cols-[1fr_20px_1fr] items-center gap-2.5 mb-2">
                    {/* Stop saying */}
                    <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Stop Saying
                      </p>
                      <p className="text-sm font-semibold text-gray-700 leading-tight">{item.wrong}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ChevronRight size={15} className="text-gray-300 shrink-0" />
                    </div>

                    {/* Say instead */}
                    <div className="bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-bold text-[#2557a7]/60 uppercase tracking-widest mb-1">
                        Say Instead
                      </p>
                      <p className="text-sm font-semibold text-[#2557a7] leading-tight">{item.right}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">{item.reason}</p>
                </div>
              ))}
            </div>

            {/* Practice tip footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Practice tip: Record yourself for 60 seconds. Count how many fillers you use. Try to halve that number each week.
              </p>
            </div>
          </div>
        )}

        {/* ────────────────── Common Mistakes ────────────────── */}
        {activeTab === "mistakes" && (
          <div>
            <div className="px-5 py-3.5 bg-[#2557a7]/5 border-b border-[#2557a7]/15">
              <p className="text-xs text-[#2557a7] font-semibold leading-snug">
                Common Indian English mistakes in interviews and how to fix them.
              </p>
              <p className="text-xs text-[#2557a7]/60 mt-1 leading-snug">
                Note: These are not wrong in everyday Indian English — but in interview context, the corrections sound more polished.
              </p>
            </div>

            {commonMistakes.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No mistakes data available.</div>
            )}
            <div className="divide-y divide-gray-100">
              {commonMistakes.map((item, i) => (
                <div key={i} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  {/* Wrong → Right */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-500 text-xs rounded-lg font-medium line-through leading-tight">
                      {item.wrong}
                    </span>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                    <span className="px-2.5 py-1 bg-[#2557a7]/5 border border-[#2557a7]/15 text-[#2557a7] text-xs rounded-lg font-semibold leading-tight">
                      {item.right}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── Phrasal Verbs ────────────────── */}
        {activeTab === "phrasal" && (
          <div>
            <div className="px-5 py-3.5 bg-[#2557a7]/5 border-b border-[#2557a7]/15">
              <p className="text-xs text-[#2557a7] font-semibold leading-relaxed">
                20 must-know phrasal verbs for interviews. Each one sounds natural and professional.
              </p>
            </div>

            {phrasalVerbs.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No phrasal verbs data available.</div>
            )}
            <div className="divide-y divide-gray-100">
              {phrasalVerbs.map((item, i) => (
                <div key={i} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start gap-3.5">
                    {/* Number badge */}
                    <div className="w-7 h-7 rounded-lg bg-[#2557a7]/8 border border-[#2557a7]/12 text-[#2557a7] text-[10px] font-bold tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Verb + meaning */}
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-2">
                        <span className="text-sm font-bold text-gray-900">{item.verb}</span>
                        <span className="text-gray-300 text-xs">—</span>
                        <span className="text-xs text-gray-500">{item.meaning}</span>
                      </div>

                      {/* Example */}
                      <div className="bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-xl px-4 py-2.5">
                        <p className="text-xs text-[#2557a7] leading-relaxed italic">{item.example}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Practice tip footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Practice exercise: Pick 5 of these and write a sentence about your own project using each one.
              </p>
            </div>
          </div>
        )}

        {/* ────────────────── Hinglish Guide ────────────────── */}
        {activeTab === "hinglish" && (
          <div>
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                Understanding how CareerBot handles Hinglish and regional accents.
              </p>
            </div>

            {/* Policy rows */}
            <div className="divide-y divide-gray-100">
              {HINGLISH_GUIDE.policy.map((p, i) => (
                <div key={i} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start gap-3.5">
                    {/* Mode badge */}
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 mt-0.5 whitespace-nowrap ${
                        i === 0
                          ? "bg-[#2557a7]/8 border border-[#2557a7]/15 text-[#2557a7]"
                          : "bg-gray-100 border border-gray-200 text-gray-600"
                      }`}
                    >
                      {p.mode}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5 leading-snug">
                        {p.rule}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">{p.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Examples section */}
            <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Hinglish to English Examples
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {HINGLISH_GUIDE.examples.map((ex, i) => (
                <div key={i} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg font-medium">
                      {ex.hinglish}
                    </span>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                    <span className="text-xs px-2.5 py-1 bg-[#2557a7]/5 border border-[#2557a7]/15 text-[#2557a7] rounded-lg font-semibold">
                      {ex.english}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{ex.note}</p>
                </div>
              ))}
            </div>

            {/* Closing philosophy quote */}
            <div className="px-5 py-4 bg-[#2557a7]/5 border-t border-[#2557a7]/15">
              <p className="text-sm text-[#2557a7] font-medium leading-relaxed">
                &ldquo;{HINGLISH_GUIDE.tip}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── CTA Footer ── */}
      <div className="mt-5 flex items-center justify-between gap-4 px-1">
        <p className="text-xs text-gray-400 font-medium">
          Reading done? Move to Stage 3.
        </p>
        <button
          onClick={() => router.push("/mock-interview/practice")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2557a7] hover:bg-[#1e4a8f] text-white text-sm font-bold rounded-xl shadow-md shadow-[#2557a7]/20 transition-colors whitespace-nowrap"
        >
          Start Practice Mode
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
