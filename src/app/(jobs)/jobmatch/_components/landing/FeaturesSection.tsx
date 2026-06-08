"use client";

import { motion } from "framer-motion";
import { Target, Lightbulb, MousePointerClick } from "lucide-react";

const features = [
  {
    Icon: Target,
    badge: "Core Feature",
    title: "Instant Match Score",
    description:
      "Upload your resume and paste any job description. Get a precise 0–100 AI-powered fit score in under 15 seconds — no guessing, no waiting.",
    points: [
      "Real-time AI analysis",
      "0–100 precision score",
      "Role-specific keyword comparison",
    ],
    iconBg: "#EEF4FF",
    iconColor: "#2557A7",
    checkColor: "#2557A7",
    checkBg: "#EEF4FF",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    Icon: Lightbulb,
    badge: "AI Powered",
    title: "Skill Gap Analysis",
    description:
      "See exactly which skills are matched and which are missing — grouped by High Priority, Medium Priority, and Nice to Have so you know what to fix first.",
    points: [
      "Priority-ranked skill gaps",
      "Technical + soft skill breakdown",
      "Matched skills highlighted",
    ],
    iconBg: "#F3EEFF",
    iconColor: "#7c3aed",
    checkColor: "#7c3aed",
    checkBg: "#F3EEFF",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    Icon: MousePointerClick,
    badge: "One Click",
    title: "One-Click Skill Add",
    description:
      "Missing a critical skill? Click once to add it directly to your resume. Your match score updates instantly so you can see the improvement.",
    points: [
      "Add missing skills in one click",
      "Resume updates automatically",
      "Score improves in real time",
    ],
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    checkColor: "#059669",
    checkBg: "#ECFDF5",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative py-10 md:py-14 overflow-hidden" style={{ background: "#ffffff", borderTop: "1px solid #e8edf5" }}>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] border border-[#dde8f8] px-4 py-1.5 rounded-full mb-5">
            What You Get
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight tracking-tight text-[#0f172a]">
            Everything You Need to<br />
            Get the Job
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
            Three core capabilities that turn your resume from &ldquo;maybe&rdquo; to &ldquo;interview scheduled&rdquo;.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ Icon, badge, title, description, points, iconBg, iconColor, checkColor, checkBg, badgeColor }, i) => (
            <motion.div
              key={title}
              className="relative group"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div
                className="relative bg-white rounded-2xl flex flex-col h-full border border-slate-100 group-hover:border-slate-200 group-hover:shadow-lg transition-all duration-300 overflow-hidden p-7"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                {/* Icon centered at top */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: iconBg }}>
                    <Icon style={{ width: 28, height: 28, color: iconColor }} strokeWidth={1.6} />
                  </div>
                  <h3 className="text-[19px] font-black text-[#0f172a] leading-snug tracking-tight">
                    {title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[13.5px] text-slate-500 leading-relaxed text-center mb-6">
                  {description}
                </p>

                {/* Divider */}
                <div className="border-t border-slate-100 mb-5" />

                {/* Points */}
                <ul className="flex flex-col gap-3 flex-1">
                  {points.map(point => (
                    <li key={point} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: checkBg }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke={checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-[13px] text-slate-600 font-medium">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
