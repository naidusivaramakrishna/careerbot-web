"use client";

import { ArrowRight, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CTABandProps {
  onScanClick?: () => void;
}

const stats = [
  { value: "50,000+", label: "Resumes scanned" },
  { value: "40+",     label: "ATS and HR-based checks" },
  { value: "~10s",    label: "Results in seconds" },
  { value: "Free",    label: "No signup required" },
  { value: "AI",      label: "Powered keyword fixes" },
  { value: "0–100",   label: "Score range" },
];

export default function CTABand({ onScanClick }: CTABandProps) {
  return (
    <section
      className="py-14 md:py-20 px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)", borderTop: "1px solid #BFDBFE" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl border border-slate-200 overflow-hidden"
          style={{
            background: "#ffffff",
            boxShadow: "0 2px 16px rgba(15,23,42,0.07)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* LEFT */}
            <div className="flex flex-col gap-5 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#dde8f8] w-fit">
                <Sparkles className="w-3 h-3" />
                Free ATS Check
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-[#0f172a] leading-tight">
                Ready to Land{" "}
                <span style={{ color: "#2557a7" }}>More Interviews?</span>
              </h2>

              <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm">
                Upload your resume and get your ATS score in seconds — with keyword gaps,
                formatting issues, and AI-powered fixes.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={onScanClick}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm text-white transition-all duration-300 hover:scale-105 active:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                    boxShadow: "0 4px 16px rgba(37,87,167,0.28)",
                  }}
                >
                  Scan My Resume Now
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/resume/builder"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-[#2557a7] text-sm font-medium transition-colors duration-200 mt-2"
                >
                  <FileText className="w-4 h-4" />
                  Build a resume from scratch
                </Link>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                Resume scores are based on ATS and recruiter-facing checks. An improved score
                can help strengthen resume readiness, but does not guarantee interviews or job offers.
              </p>
            </div>

            {/* RIGHT: Stats */}
            <div className="p-8 lg:p-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                CareerBot ATS Data Snapshot
              </p>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                    className="rounded-xl border border-slate-100 p-4"
                    style={{ background: "#f8fafc" }}
                  >
                    <div className="text-xl font-black text-[#2557a7] leading-none mb-1">{s.value}</div>
                    <div className="text-[11.5px] text-slate-500 font-medium">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
