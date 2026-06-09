"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const categories = [
  {
    iconColor: "#6366f1",
    iconBg: "#eef2ff",
    iconSrc: "/assets/images/Folder-Search--Streamline-Ultimate.png",
    title: "Content",
    groups: [
      {
        label: "Keyword Matching",
        items: ["Semantic & exact keyword scoring", "Missing role-specific terms flagged"],
      },
      {
        label: "Achievement Impact",
        items: ["Quantified result detection", "Weak bullet points identified"],
      },
      {
        label: "Writing Quality",
        items: ["Action verb strength scored", "Passive language flagged instantly"],
      },
    ],
  },
  {
    iconColor: "#0ea5e9",
    iconBg: "#e0f2fe",
    iconSrc: "/assets/images/Target--Streamline-Sharp.png",
    title: "Key Sections",
    groups: [
      {
        label: "Resume Header",
        items: ["Email, phone & LinkedIn validated", "Missing contact fields detected"],
      },
      {
        label: "Work Experience",
        items: ["Job title & date format checked", "Relevance to target role scored"],
      },
      {
        label: "Skills & Education",
        items: ["Technical skill gap analysis", "Certification & degree match"],
      },
    ],
  },
  {
    iconColor: "#10b981",
    iconBg: "#f0fdf4",
    iconSrc: "/assets/images/Recruiting-Employee-Folder-Resume-Document--Streamline-Ultimate.png",
    title: "Structure",
    groups: [
      {
        label: "ATS Compatibility",
        items: ["Tables, columns & graphics blocked", "Parser-safe file format verified"],
      },
      {
        label: "Format & Layout",
        items: ["Font, spacing & margin standards", "Section heading recognition"],
      },
      {
        label: "Completeness Score",
        items: ["All critical sections present", "Resume length & density scored"],
      },
    ],
  },
];

export default function ATSScannerChecks() {
  return (
    <section
      className="py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-4 leading-tight">
            Know Exactly Why Your Resume Gets Rejected
          </h2>
          <p className="text-[14.5px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            CareerBot analyzes keywords, skills, experience, formatting, and 17 ATS scoring factors
            to uncover every issue affecting your resume before recruiters see it.
          </p>
        </motion.div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6"
                style={{
                  border: "1px solid #e8edf5",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.05), 0 8px 32px rgba(15,23,42,0.04)",
                }}
              >
                {/* Icon */}
                <div className="flex flex-col items-center mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: cat.iconBg }}
                  >
                    <Image
                      src={cat.iconSrc}
                      alt={cat.title}
                      width={32}
                      height={32}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <h3 className="text-[18px] font-black text-[#0f172a]">
                    {cat.title}
                  </h3>
                </div>

                {/* Groups */}
                <div className="space-y-4">
                  {cat.groups.map((group, gi) => (
                    <div key={gi}>
                      {/* Group label with checkmark */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: cat.iconColor }}
                          strokeWidth={2.5}
                        />
                        <span className="text-[13.5px] font-bold text-[#0f172a]">{group.label}</span>
                      </div>

                      {/* Sub-items */}
                      <ul className="space-y-1 pl-6">
                        {group.items.map((item, ii) => (
                          <li key={ii} className="flex items-start gap-2">
                            <span
                              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: "#94a3b8" }}
                            />
                            <span className="text-[13px] text-slate-500 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
