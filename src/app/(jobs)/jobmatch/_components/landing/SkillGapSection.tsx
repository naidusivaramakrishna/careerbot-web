"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, TrendingUp, AlertCircle, AlertTriangle, Info } from "lucide-react";

const missingSkills = [
  { name: "Python",     pts: 4, tier: "Critical",     color: "#ef4444", bg: "#fff5f5", border: "#fecaca", dot: "#ef4444", Icon: AlertCircle },
  { name: "Docker",     pts: 3, tier: "Critical",     color: "#ef4444", bg: "#fff5f5", border: "#fecaca", dot: "#ef4444", Icon: AlertCircle },
  { name: "Redis",      pts: 2, tier: "Important",    color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", Icon: AlertTriangle },
  { name: "GraphQL",    pts: 2, tier: "Important",    color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", Icon: AlertTriangle },
  { name: "Kubernetes", pts: 1, tier: "Nice to Have", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8", Icon: Info },
];

const matched = ["React", "TypeScript", "Next.js", "Node.js"];

const tierGroups = [
  { label: "Critical",     color: "#ef4444", bg: "#fff5f5", border: "#fecaca", Icon: AlertCircle,   desc: "Must-have skills — missing these filters you out" },
  { label: "Important",    color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", Icon: AlertTriangle, desc: "Strongly preferred — adds major score boost" },
  { label: "Nice to Have", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", Icon: Info,          desc: "Bonus skills that give you an edge" },
];

function SkillGapCard() {
  const [added, setAdded] = useState<string[]>([]);
  const baseScore = 62;
  const totalPts = missingSkills.filter(s => added.includes(s.name)).reduce((a, s) => a + s.pts, 0);
  const score = Math.min(baseScore + totalPts, 99);

  const toggle = (name: string) =>
    setAdded(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);

  const grouped = tierGroups.map(t => ({
    ...t,
    skills: missingSkills.filter(s => s.tier === t.label),
  }));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: "0 8px 40px rgba(37,87,167,0.10), 0 2px 8px rgba(0,0,0,0.04)" }}>

      {/* Score bar */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match Score</p>
            <div className="flex items-end gap-2">
              <motion.span key={score} className="text-3xl font-black text-[#2557a7]"
                initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}>
                {score}%
              </motion.span>
              <AnimatePresence>
                {totalPts > 0 && (
                  <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-1 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />+{totalPts} pts
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="text-right bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Potential</p>
            <span className="text-xl font-black text-emerald-600">99%</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(to right, #2557a7, #7c3aed)" }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">

        {/* Matched */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
            ✓ Matched Skills ({matched.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matched.map(s => (
              <span key={s} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Missing by tier */}
        {grouped.map(tier => (
          <div key={tier.label}>
            <div className="flex items-center gap-1.5 mb-2">
              <tier.Icon className="w-3 h-3" style={{ color: tier.color }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {tier.skills.map(skill => {
                const isAdded = added.includes(skill.name);
                return (
                  <motion.button key={skill.name} onClick={() => toggle(skill.name)}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 w-full"
                    style={{ background: isAdded ? "#f0fdf4" : tier.bg, borderColor: isAdded ? "#86efac" : tier.border }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: isAdded ? "#22c55e" : tier.dot }} />
                      <span className="text-[12.5px] font-semibold text-slate-700">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold" style={{ color: isAdded ? "#16a34a" : tier.color }}>
                        +{skill.pts} pts
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isAdded ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-[#2557a7] border-[#c7d9f5]"
                      }`}>
                        {isAdded ? "Added ✓" : "+ Add"}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkillGapSection() {
  return (
    <section className="py-16 md:py-24" style={{ background: "#F7F9FC", borderTop: "1px solid #e8edf5" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-4 border border-[#dde8f8]">
            <Sparkles className="w-3 h-3" /> Skill Gap Analysis
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] leading-tight mb-4">
            Know Exactly Which Skills<br />
            <span style={{ color: "#2557a7" }}>Are Costing You the Job</span>
          </h2>
          <p className="text-[15px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            CareerBot ranks every missing skill by how much it impacts your match score — so you fix the most important gaps first, not last.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — tier legend */}
          <motion.div className="flex flex-col gap-5"
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>

            {tierGroups.map((tier, i) => (
              <motion.div key={tier.label}
                className="flex items-start gap-4 p-5 rounded-2xl border"
                style={{ background: tier.bg, borderColor: tier.border }}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "white", border: `1.5px solid ${tier.border}` }}>
                  <tier.Icon className="w-4 h-4" style={{ color: tier.color }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold mb-1" style={{ color: tier.color }}>{tier.label}</p>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">{tier.desc}</p>
                </div>
              </motion.div>
            ))}

            <p className="text-[12px] text-slate-400 flex items-center gap-2 mt-1">
              <span className="w-4 h-4 rounded-full bg-[#2557a7] flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Click any skill in the card to see your score update live
            </p>
          </motion.div>

          {/* RIGHT — interactive card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <SkillGapCard />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
