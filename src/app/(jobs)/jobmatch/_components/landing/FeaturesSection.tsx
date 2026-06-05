"use client";

import { motion } from "framer-motion";
import { Target, Lightbulb, MousePointerClick, Check } from "lucide-react";

const features = [
  {
    Icon: Target,
    title: "Instant Match Score",
    description:
      "Upload your resume and paste any job description. Get a precise 0–100 AI-powered fit score in under 15 seconds — no guessing, no waiting.",
    points: [
      "Real-time AI analysis",
      "0–100 precision score",
      "Role-specific keyword comparison",
    ],
  },
  {
    Icon: Lightbulb,
    title: "Skill Gap Analysis",
    description:
      "See exactly which skills are matched and which are missing — grouped by High Priority, Medium Priority, and Nice to Have so you know what to fix first.",
    points: [
      "Priority-ranked skill gaps",
      "Technical + soft skill breakdown",
      "Matched skills highlighted",
    ],
  },
  {
    Icon: MousePointerClick,
    title: "One-Click Skill Add",
    description:
      "Missing a critical skill? Click once to add it directly to your resume. Your match score updates instantly so you can see the improvement.",
    points: [
      "Add missing skills in one click",
      "Resume updates automatically",
      "Score improves in real time",
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-slate-50 py-20 md:py-24 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] px-4 py-1.5 rounded-full mb-5">
            What You Get
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
            Everything You Need to Get the Job
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            Three core capabilities that turn your resume from &ldquo;maybe&rdquo; to &ldquo;interview scheduled&rdquo;.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ Icon, title, description, points }, i) => (
            <motion.div
              key={title}
              className="bg-white border-2 border-slate-100 hover:border-[#FFC85E] rounded-2xl p-6 flex flex-col transition-colors duration-300 group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <div className="w-12 h-12 bg-[#EEF4FF] group-hover:bg-[#2557A7] rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                <Icon className="w-6 h-6 text-[#2557A7] group-hover:text-white transition-colors duration-300" />
              </div>

              <h3 className="text-[17px] font-bold text-black mb-3 leading-snug">{title}</h3>

              <p className="text-[13px] text-slate-500 leading-relaxed mb-5 flex-1">{description}</p>

              <ul className="space-y-2.5 pt-4 border-t border-slate-100">
                {points.map(point => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 bg-[#FFC85E] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] text-slate-600 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
