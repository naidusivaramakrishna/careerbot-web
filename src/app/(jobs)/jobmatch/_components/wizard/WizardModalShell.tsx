"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link2, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

const MODAL_TABS = [
  { num: 1, label: "Upload Resume",    icon: Upload },
  { num: 2, label: "Job Description",  icon: Link2 },
  { num: 3, label: "Analyze",          icon: Sparkles },
];

interface WizardModalShellProps {
  open: boolean;
  wizardStep: 0 | 1 | 2 | 3;
  onClose: () => void;
  onBack: () => void;
  onContinueClick: () => void;
  continueDisabled: boolean;
  onAnalyzeClick: () => void;
  children: React.ReactNode;
}

// Renders unconditionally so AnimatePresence stays mounted across the whole
// open/close cycle — only then can it play the exit animation; if the parent
// unmounted this component on close, the exit transition would never run.
export default function WizardModalShell({
  open, wizardStep, onClose, onBack, onContinueClick, continueDisabled, onAnalyzeClick, children,
}: WizardModalShellProps) {
  return (
    <AnimatePresence>
      {open && (
      <motion.div
        key="wizard-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(15,23,42,0.30)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
        onClick={onClose}
      >
        <motion.div
          key="wizard-card"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            background: "#F6F8FA",
            borderRadius: 20,
            boxShadow: "0 8px 16px rgba(0,0,0,0.10), 0 32px 80px rgba(15,23,42,0.28)",
            width: "100%", maxWidth: 680,
            maxHeight: "calc(100vh - 32px)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Modal header: pill tab breadcrumb ── */}
          <div style={{
            padding: "14px 20px",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 28,
            position: "relative", zIndex: 1,
            flexShrink: 0,
          }}>
            {MODAL_TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = wizardStep === tab.num;
              const isDone = wizardStep > tab.num;
              return (
                <React.Fragment key={tab.num}>
                  {idx > 0 && (
                    <span style={{ color: "#CBCBCB", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>›</span>
                  )}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "6px 16px", borderRadius: 99,
                    border: isActive ? "1.5px solid #2557a7" : "1.5px solid transparent",
                    background: "#fff",
                    boxShadow: isActive
                      ? "0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)"
                      : "0 1px 4px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}>
                    {isDone
                      ? <CheckCircle2 style={{ width: 14, height: 14, color: "#2557a7" }} />
                      : <Icon style={{ width: 14, height: 14, color: isActive ? "#2557a7" : "#BBBBBB" }} />
                    }
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#2557a7" : isDone ? "#94A3B8" : "#BBBBBB",
                      whiteSpace: "nowrap",
                    }}>
                      {tab.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}

          </div>

          {/* ── Modal step content — scrolls internally so the card never grows
              taller than the viewport; header/footer stay put. ── */}
          <div style={{ padding: "28px 28px 20px", flex: 1, minHeight: 0, overflowY: "auto" }}>
            {children}
          </div>

          {/* ── Modal footer: navigation ── */}
          <div style={{
            padding: "16px 24px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            background: "#F6F8FA",
            flexShrink: 0,
          }}>
            <button
              onClick={onBack}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 40, padding: "0 20px", borderRadius: 10,
                fontSize: 13.5, fontWeight: 600, color: "#64748B",
                background: "#fff", border: "1.5px solid #E2E8F0",
                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              ← Go Back
            </button>

            {wizardStep < 3 ? (
              <button
                onClick={onContinueClick}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 40, padding: "0 24px", borderRadius: 10,
                  fontSize: 13.5, fontWeight: 700,
                  cursor: "pointer",
                  background: continueDisabled
                    ? "#F1F5F9"
                    : "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                  color: continueDisabled ? "#94A3B8" : "#fff",
                  border: "none",
                  boxShadow: continueDisabled ? "none" : "0 4px 16px rgba(37,87,167,0.28)",
                  transition: "all 0.2s",
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={onAnalyzeClick}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 40, padding: "0 24px", borderRadius: 10,
                  fontSize: 13.5, fontWeight: 700,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(37,87,167,0.28)",
                  transition: "all 0.2s",
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                Analyze Match Score
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
