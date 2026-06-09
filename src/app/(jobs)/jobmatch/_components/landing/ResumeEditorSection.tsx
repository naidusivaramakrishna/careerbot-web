"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, Sparkles, Zap, RefreshCw } from "lucide-react";

const sections = ["Summary", "Skills", "Experience", "Education", "Projects"];

const summaryBefore = "Frontend Developer with 4 years of experience in web development using modern frameworks.";
const summaryAfter = "Senior Frontend Engineer specializing in React & Next.js — 4 years building scalable SPAs with TypeScript, REST APIs, and CI/CD pipelines. Strong focus on performance and ATS-optimized resume presentation.";

const skillsBefore = ["HTML", "CSS", "JavaScript", "React", "Git"];
const skillsToAdd = ["TypeScript", "Next.js", "Node.js", "REST APIs", "Docker"];

const bulletBefore = "Worked on frontend features for the company product.";
const bulletAfter = "Built and shipped 12 React + TypeScript features that reduced page load time by 38% and increased user retention by 22%.";

function EditorMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const [phase, setPhase] = useState<"before" | "after">("before");
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  const toggle = () => setPhase(p => p === "before" ? "after" : "before");
  const addSkill = (s: string) => setAddedSkills(prev => prev.includes(s) ? prev : [...prev, s]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <div className="flex-1 mx-4 h-6 bg-white rounded-md border border-slate-200 flex items-center px-3">
          <span className="text-[10px] text-slate-400 font-mono">app.careerbot.ai / jobmatch / editor</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/40 overflow-x-auto">
        {sections.map((s, i) => (
          <button key={s} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all duration-200 ${
              activeTab === i
                ? "border-[#2557a7] text-[#2557a7] bg-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="p-5 flex flex-col gap-4 min-h-72">

        {/* Summary tab */}
        {activeTab === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Professional Summary</p>
              <button onClick={toggle}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2557a7] bg-[#EEF4FF] border border-[#dde8f8] px-3 py-1.5 rounded-full hover:bg-[#dde8f8] transition-all">
                <Sparkles className="w-3 h-3" /> AI Improve
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={phase}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className={`text-[12.5px] leading-relaxed p-4 rounded-xl border ${
                  phase === "after"
                    ? "bg-emerald-50 border-emerald-100 text-slate-700"
                    : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                {phase === "before" ? summaryBefore : summaryAfter}
              </motion.div>
            </AnimatePresence>
            {phase === "after" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>
                Summary optimized with role-specific keywords
              </motion.div>
            )}
            {phase === "before" && (
              <p className="text-[11px] text-slate-400">← Click AI Improve to see the optimized version</p>
            )}
          </div>
        )}

        {/* Skills tab */}
        {activeTab === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Technical Skills</p>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-2">Current</p>
              <div className="flex flex-wrap gap-1.5">
                {[...skillsBefore, ...addedSkills].map(s => (
                  <span key={s} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    addedSkills.includes(s)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#2557a7] font-bold uppercase tracking-wider mb-2">Suggested from JD — click to add</p>
              <div className="flex flex-wrap gap-1.5">
                {skillsToAdd.filter(s => !addedSkills.includes(s)).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2557a7] border border-blue-200 hover:bg-blue-100 transition-colors">
                    + {s}
                  </button>
                ))}
                {skillsToAdd.every(s => addedSkills.includes(s)) && (
                  <span className="text-[12px] text-emerald-600 font-semibold">All skills added! ✓</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Experience tab */}
        {activeTab === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Work Experience</p>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[12px] font-bold text-slate-700">Senior Frontend Developer</p>
                <p className="text-[10px] text-slate-400">TechCorp Inc • 2021 – Present</p>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <span className="text-red-400 font-bold text-[12px] shrink-0">−</span>
                  <span className="text-[11.5px] text-slate-400 line-through leading-relaxed">{bulletBefore}</span>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-500 font-bold text-[12px] shrink-0">+</span>
                  <span className="text-[11.5px] text-slate-700 leading-relaxed">{bulletAfter}</span>
                </div>
                <p className="text-[10.5px] text-[#2557a7] font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> AI added metrics and keywords from job description
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Education / Projects tabs */}
        {(activeTab === 3 || activeTab === 4) && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#2557a7]" />
            </div>
            <p className="text-[13px] font-semibold text-slate-600">
              {sections[activeTab]} section ready to edit
            </p>
            <p className="text-[11.5px] text-slate-400 max-w-48">
              Click AI Suggest to get role-specific improvements for this section.
            </p>
            <button className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2557a7] bg-[#EEF4FF] border border-[#dde8f8] px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" /> AI Suggest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const capabilities = [
  {
    icon: FileText,
    title: "Edit Any Section",
    desc: "Professional Summary, Skills, Experience, Education, Projects, Certifications — all editable in one place.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Suggestions",
    desc: "One click to rewrite your summary or bullet points with keywords from the job description.",
  },
  {
    icon: Zap,
    title: "One-Click Skill Insert",
    desc: "Click any missing skill to instantly add it to your Skills section. Score updates immediately.",
  },
  {
    icon: RefreshCw,
    title: "Real-Time Score Update",
    desc: "Every change you make recalculates your match score live — no need to re-analyze.",
  },
];

export default function ResumeEditorSection() {
  return (
    <section className="py-16 md:py-24 overflow-hidden" style={{ background: "#F7F9FC", borderTop: "1px solid #e8edf5" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-4 border border-[#dde8f8]">
            <FileText className="w-3 h-3" /> Built-In Resume Editor
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] leading-tight mb-4">
            Optimize Your Resume<br />
            <span style={{ color: "#2557a7" }}>Without Leaving the Page</span>
          </h2>
          <p className="text-[15px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            No need to switch between apps. Edit every section of your resume and watch your match score improve in real time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* LEFT — editor mockup */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <EditorMockup />
          </motion.div>

          {/* RIGHT — capabilities list */}
          <motion.div className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>

            <div className="flex flex-col gap-5">
              {capabilities.map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title}
                  className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-[#dde8f8] hover:shadow-sm transition-all duration-200"
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.09, duration: 0.4 }}>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#2557a7]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800 mb-1">{title}</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sections You Can Edit</p>
              <div className="flex flex-wrap gap-2">
                {["Contact", "Summary", "Skills", "Soft Skills", "Experience", "Internships", "Projects", "Education", "Certifications", "Achievements", "Languages"].map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
