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
      className="py-16 md:py-24 px-6 lg:px-8"
      style={{ background: "linear-gradient(135deg, #EEF4FF 0%, #ffffff 50%, #EEF4FF 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{
            background: "#F3F4F6",
            borderRadius: 24,
            boxShadow: "0 4px 32px rgba(15,23,42,0.09)",
            padding: "44px 52px",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* ── LEFT ── */}
            <div className="flex flex-col gap-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#dde8f8] w-fit">
                <Sparkles className="w-3 h-3" />
                Free ATS Check
              </div>

              <h2 className="text-3xl md:text-[34px] font-black text-[#0f172a] leading-tight">
                Ready to Land{" "}
                <span style={{ color: "#2557a7" }}>More Interviews?</span>
              </h2>

              <p className="text-[14.5px] text-slate-500 leading-relaxed max-w-md">
                Upload your resume and get your ATS score in seconds — with keyword gaps,
                formatting issues, and AI-powered fixes.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={onScanClick}
                  className="inline-flex items-center gap-2.5 font-bold px-7 py-3 rounded-full transition-all duration-300 text-sm whitespace-nowrap hover:scale-105 active:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(37,87,167,0.35)",
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

            {/* ── RIGHT: Stats ── */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                CareerBot ATS Data Snapshot
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                    style={{
                      background: "#ffffff",
                      borderRadius: 14,
                      padding: "16px 18px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#2557a7", lineHeight: 1, marginBottom: 5 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                      {s.label}
                    </div>
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
