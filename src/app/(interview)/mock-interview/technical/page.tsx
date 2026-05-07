"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code2, ChevronRight, Loader2, Sparkles, Clock, AlertCircle, BookOpen, Server, Database, Layers } from "lucide-react";
import { getUserProgress } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";

// ─── Skill categories ─────────────────────────────────────────────────────────

const SKILL_CATEGORIES = [
  {
    id: "dsa",
    label: "Data Structures & Algorithms",
    icon: Code2,
    description: "Arrays, Linked Lists, Trees, Graphs, Sorting, Searching",
    questionCount: 10,
    time: "~25 min",
  },
  {
    id: "web",
    label: "Web Development",
    icon: Layers,
    description: "HTML/CSS, JavaScript, React, REST APIs, HTTP",
    questionCount: 8,
    time: "~20 min",
  },
  {
    id: "backend",
    label: "Backend & System Design",
    icon: Server,
    description: "Node.js, APIs, Architecture, Scalability, Caching",
    questionCount: 8,
    time: "~20 min",
  },
  {
    id: "database",
    label: "Databases",
    icon: Database,
    description: "SQL, NoSQL, Indexing, Transactions, Query Optimization",
    questionCount: 6,
    time: "~15 min",
  },
  {
    id: "core",
    label: "CS Fundamentals",
    icon: BookOpen,
    description: "OS, Networking, DBMS concepts, OOP principles",
    questionCount: 8,
    time: "~20 min",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TechnicalPage() {
  const router = useRouter();
  const { userProgress } = useMockInterview();
  const [selected, setSelected] = useState<string | null>(null);
  const [techRoundsCompleted, setTechRoundsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProgress()
      .then((p) => {
        // Use live_sessions as a proxy for tech rounds until dedicated field exists
        setTechRoundsCompleted(p.live_sessions ?? 0);
      })
      .catch(() => {/* use default 0 */})
      .finally(() => setLoading(false));
  }, []);

  const handleStart = () => {
    if (!selected) return;
    router.push(`/mock-interview/technical/practice?category=${selected}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-4">
          <Sparkles size={12} />
          Technical Practice
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Technical Interview Prep</h1>
        <p className="text-sm text-gray-500">
          Practice technical questions by topic. Speak or type your answers and get AI feedback.
        </p>
      </div>

      {/* Stats */}
      {!loading && (userProgress?.practice_rounds ?? 0) > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{userProgress?.practice_rounds ?? 0}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Rounds Done</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{techRoundsCompleted}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Tech Sessions</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-lg font-bold text-[#2557a7]">{userProgress?.avg_score?.toFixed(1) ?? "—"}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Avg Score</p>
          </div>
        </div>
      )}

      {/* Category selection */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select a Topic</p>
      <div className="space-y-2.5 mb-6">
        {SKILL_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? "bg-[#2557a7]/5 border-[#2557a7]/30 shadow-sm"
                  : "bg-white border-gray-200 hover:border-[#2557a7]/20 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-[#2557a7] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-semibold ${isSelected ? "text-[#2557a7]" : "text-gray-900"}`}>
                      {cat.label}
                    </p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock size={9} /> {cat.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                </div>
                <div className="shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-[#2557a7] text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {cat.questionCount} Q
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl px-4 py-3 mb-6">
        <AlertCircle size={13} className="text-[#2557a7] mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600">
          Speak your answer aloud — this builds confidence for real interviews. Use text fallback if mic is unavailable.
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="w-full py-3.5 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Loading…</>
        ) : (
          <>Start Technical Practice <ChevronRight size={16} /></>
        )}
      </button>
    </div>
  );
}
