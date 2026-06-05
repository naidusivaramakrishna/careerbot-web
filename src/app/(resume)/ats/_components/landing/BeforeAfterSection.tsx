"use client";

import { motion } from "framer-motion";
import {
  X, Check, Sparkles, Search, TrendingUp, Layout,
  Zap, FileText, ImageOff, List, Star,
} from "lucide-react";

const beforeItems = [
  { icon: Search,     label: "Missing role-specific keywords" },
  { icon: TrendingUp, label: "No quantified achievements" },
  { icon: Layout,     label: "Tables & graphics block ATS" },
  { icon: Zap,        label: "Weak passive action verbs" },
  { icon: FileText,   label: "No professional summary" },
  { icon: ImageOff,   label: "Images & graphics embedded" },
  { icon: List,       label: "Inconsistent section headings" },
  { icon: Star,       label: "Skills section missing entirely" },
];

const afterItems = [
  { icon: Search,     label: "12 role-specific keywords added" },
  { icon: TrendingUp, label: "Impact metrics in every bullet" },
  { icon: Layout,     label: "Clean ATS-friendly layout" },
  { icon: Zap,        label: "Strong active action verbs" },
  { icon: FileText,   label: "Professional summary added" },
  { icon: ImageOff,   label: "No images or graphics used" },
  { icon: List,       label: "Standard section headings applied" },
  { icon: Star,       label: "Skills section fully optimized" },
];

interface BeforeAfterSectionProps {
  onScanClick?: () => void;
}

export default function BeforeAfterSection({ onScanClick }: BeforeAfterSectionProps) {
  return (
    <section className="py-16 md:py-24" style={{ background: "linear-gradient(160deg,#F8FAFF 0%,#FFFFFF 60%,#F0FDF4 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 items-center"
          style={{ gap: "60px" }}
        >

          {/* ── LEFT: Text content ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="flex flex-col justify-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest border border-[#dde8f8] w-fit">
              <Sparkles className="w-3 h-3" />
              Why It Matters
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-5 leading-tight">
              Why Qualified Candidates <br />Still Don&apos;t Get Interview Calls
            </h2>

            <div className="space-y-5 text-[14.5px] text-slate-600 leading-relaxed mb-8">
              <p>
                You may be perfectly qualified for the role, but your resume could still never reach a
                recruiter.
              </p>
              <p>
                Most companies — including top MNCs — use Applicant Tracking Systems to automatically
                scan and rank resumes before any human ever sees them. These systems evaluate{" "}
                <span className="text-[#2557a7] font-semibold">clean formatting</span>, standard
                section headings,{" "}
                <span className="text-[#2557a7] font-semibold">targeted keywords</span>, work history,
                skills, education, and measurable results.
              </p>
              <p>
                If your resume contains tables, embedded graphics, icons, non-standard fonts, or is
                missing key terms, it may fail to parse correctly — meaning your profile gets filtered
                out even when you are a perfect fit for the role.
              </p>
              <p>
                That is why checking your ATS score before applying is critical.{" "}
                <span className="font-semibold text-[#0f172a]">CareerBot</span> is an AI-powered ATS
                checker that detects the exact issues lowering your score and delivers{" "}
                <span className="text-[#2557a7] font-semibold">instant, actionable fixes</span> to
                help your resume pass every ATS filter.
              </p>
              <p>
                Top companies receive thousands of applications for a single role — making manual
                screening impossible. Without ATS optimization, even the most qualified candidates go
                unnoticed.
              </p>
            </div>

            <button
              onClick={onScanClick}
              className="inline-flex items-center gap-2.5 font-bold px-8 py-3.5 rounded-full transition-all duration-300 text-sm w-fit hover:scale-105 active:scale-100"
              style={{
                background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(37,87,167,0.35)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Scan Your Resume for Free
            </button>
          </motion.div>

          {/* ── RIGHT: Before / After card ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid #E2E8F0",
                padding: "24px 24px 28px",
                boxShadow: "0 8px 40px rgba(15,23,42,0.09)",
                display: "grid",
                gridTemplateColumns: "1fr 50px 1fr",
                maxWidth: 760,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >

              {/* ── Before column ── */}
              <div style={{ paddingRight: 4 }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg,#FEF2F2,#FFF5F5)",
                    border: "1px solid #FECACA",
                    borderRadius: 999,
                    padding: "10px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <X style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B91C1C", lineHeight: 1.3 }}>
                    Before CareerBot
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#EF4444", background: "#FEE2E2", borderRadius: 999, padding: "2px 8px" }}>
                    38/100
                  </span>
                </div>

                {/* Items */}
                {beforeItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.07 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px" }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "#FEF2F2",
                            border: "1.5px solid #FECACA",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon style={{ width: 13, height: 13, color: "#EF4444", strokeWidth: 1.8 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#475569", lineHeight: 1.3 }}>
                          {item.label}
                        </span>
                      </motion.div>

                      {i < beforeItems.length - 1 && (
                        <div style={{ display: "flex", justifyContent: "center", paddingTop: 1, paddingBottom: 1 }}>
                          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                            <line x1="5" y1="0" x2="5" y2="10" stroke="#FECACA" strokeWidth="1.5" />
                            <path d="M1 8 L5 14 L9 8" stroke="#FECACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── VS badge ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "1px solid #E2E8F0",
                  zIndex: 0,
                }} />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#F8FAFC",
                    border: "2px solid #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                  }}
                >
                  VS
                </div>
              </div>

              {/* ── After column ── */}
              <div style={{ paddingLeft: 4 }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg,#F0FDF4,#F7FEF9)",
                    border: "1px solid #BBF7D0",
                    borderRadius: 999,
                    padding: "10px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#22C55E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", lineHeight: 1.3 }}>
                    After CareerBot
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", borderRadius: 999, padding: "2px 8px" }}>
                    91/100
                  </span>
                </div>

                {/* Items */}
                {afterItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.07 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px" }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "#F0FDF4",
                            border: "1.5px solid #BBF7D0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon style={{ width: 13, height: 13, color: "#16A34A", strokeWidth: 1.8 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#475569", lineHeight: 1.3 }}>
                          {item.label}
                        </span>
                      </motion.div>

                      {i < afterItems.length - 1 && (
                        <div style={{ display: "flex", justifyContent: "center", paddingTop: 1, paddingBottom: 1 }}>
                          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                            <line x1="5" y1="0" x2="5" y2="10" stroke="#86EFAC" strokeWidth="1.5" />
                            <path d="M1 8 L5 14 L9 8" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
