"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

const WIZARD_STEPS = [
  { title: "Upload Resume",    desc: "Upload your resume in PDF or DOCX format." },
  { title: "Job Description",  desc: "Paste or upload the target job posting." },
  { title: "Get Match Score",  desc: "AI analyzes fit and highlights skill gaps." },
];

interface JobMatchStartCardProps {
  mounted: boolean;
  onStart: () => void;
}

export default function JobMatchStartCard({ mounted, onStart }: JobMatchStartCardProps) {
  return (
    <>
      {/* ── HERO ── */}
      <motion.div
        style={{ maxWidth: "min(720px, 100%)", marginBottom: 26 }}
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.84)", border: "1px solid rgba(37,87,167,0.20)",
            borderRadius: 999, padding: "6px 15px 6px 6px",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            color: "#2557a7", textTransform: "uppercase",
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 22px rgba(37,87,167,0.10)",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%", background: "#FFC85E",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Sparkles style={{ width: 11, height: 11, color: "#2557a7" }} />
            </span>
            AI Job Matching
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 4.2vw, 54px)",
          fontWeight: 850, lineHeight: 1.02,
          letterSpacing: "-0.035em", margin: "0 0 12px",
        }}>
          <span style={{ color: "#0f172a" }}>Job </span>
          <span style={{ color: "#2557a7" }}>Match</span>
        </h1>

        <p style={{ fontSize: 15.5, color: "#475569", lineHeight: 1.58, maxWidth: 620, margin: "0 0 20px" }}>
          Upload a resume, add the target job description, and generate a focused fit report with gaps and next edits.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748B", fontSize: 12.5, fontWeight: 700 }}>
            <CheckCircle2 style={{ width: 15, height: 15, color: "#16a34a" }} />
            Private analysis. No workflow changes required.
        </div>

      </motion.div>

      {/* ── LANDING CARD (always visible) ── */}
      <motion.div
        style={{ maxWidth: "100%" }}
        initial={{ opacity: 0, y: 28 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="jm-landing-card" style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px rgba(15,23,42,0.07)",
          border: "1px solid #DDE7F4",
          padding: "18px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: "#0f172a", fontWeight: 850, letterSpacing: "-0.01em" }}>
                Create match analysis
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748B", lineHeight: 1.45 }}>
                Complete the inputs below to generate your report.
              </p>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 28, padding: "0 10px", borderRadius: 999,
              background: "#F8FAFC", border: "1px solid #E2E8F0",
              color: "#64748B", fontSize: 11.5, fontWeight: 750,
              whiteSpace: "nowrap",
            }}>
              <CheckCircle2 style={{ width: 13, height: 13, color: "#16a34a" }} />
              Private
            </span>
          </div>

          {/* Steps row */}
          <div className="jm-steps-row">
            {WIZARD_STEPS.map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div className="jm-steps-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 28, alignSelf: "center" }}>
                    <ArrowRight style={{ width: 15, height: 15, color: "#94A3B8" }} />
                  </div>
                )}
                <div
                  className="jm-workflow-card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    flex: 1,
                    minWidth: 180,
                    minHeight: 108,
                    padding: 14,
                    borderRadius: 10,
                    border: idx === 0 ? "1px solid rgba(37,87,167,0.28)" : "1px solid #E2E8F0",
                    background: idx === 0 ? "linear-gradient(180deg,#FFFFFF 0%,#F4F8FF 100%)" : "#F8FAFC",
                    transition: "all 0.18s ease",
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: idx === 0 ? "#2557a7" : "#fff",
                    color: idx === 0 ? "#fff" : "#64748B",
                    border: idx === 0 ? "1px solid #2557a7" : "1px solid #DDE7F4",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12.5, fontWeight: 900, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 850, color: "#0f172a", margin: "0 0 5px", lineHeight: 1.2 }}>{step.title}</p>
                    <p style={{ fontSize: 12.5, color: "#64748B", margin: 0, lineHeight: 1.42 }}>{step.desc}</p>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* CTA button */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #EEF2F7",
          }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748B", fontWeight: 650 }}>
              Analysis starts after your resume and job description are added.
            </p>
            <button
              onClick={onStart}
              className="jm-start-btn"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                height: 40, padding: "0 16px", borderRadius: 10,
                background: "#2557a7",
                color: "#fff", fontSize: 13, fontWeight: 850,
                border: "none", cursor: "pointer",
                boxShadow: "0 8px 20px rgba(37,87,167,0.22)",
                transition: "all 0.2s ease",
                letterSpacing: 0,
                gap: 7,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 26px rgba(37,87,167,0.28)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 20px rgba(37,87,167,0.22)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              Start analysis
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

        </div>
      </motion.div>
    </>
  );
}
