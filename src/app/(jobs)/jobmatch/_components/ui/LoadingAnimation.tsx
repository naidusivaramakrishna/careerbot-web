"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Sparkles } from "lucide-react";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

const stageInfo: Record<LoadingStage, { label: string; pct: number }> = {
  parsing: { label: "Parsing resume structure", pct: 15 },
  extracting: { label: "Extracting skills and experience", pct: 35 },
  matching: { label: "Comparing against job criteria", pct: 58 },
  scoring: { label: "Calculating match confidence", pct: 78 },
  generating: { label: "Preparing recommendations", pct: 92 },
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LoadingAnimation: React.FC<{ stage: LoadingStage }> = ({ stage }) => {
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const [displayPct, setDisplayPct] = useState(0);
  const current = stageInfo[stage];
  const target = current.pct;

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPct((pct) => {
        if (pct >= target) {
          clearInterval(interval);
          return target;
        }
        return Math.min(pct + 1, target);
      });
    }, 35);

    return () => clearInterval(interval);
  }, [target]);

  if (!portalTarget) return null;

  const strokeDashoffset = CIRCUMFERENCE - (displayPct / 100) * CIRCUMFERENCE;

  const content = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(238,244,255,0.88)",
        backdropFilter: "blur(10px)",
      }}
    >
      <style>{`
        @keyframes jm-sweep {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jm-sweep { animation: none !important; }
          .jm-ring { transition: none !important; }
        }
      `}</style>

      <section
        aria-live="polite"
        aria-label="Generating job match report"
        style={{
          width: "min(520px, 100%)",
          borderRadius: 18,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(203,213,225,0.9)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 70px rgba(15,23,42,0.18), 0 8px 24px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "24px 26px 22px",
            background:
              "linear-gradient(135deg, rgba(248,251,255,0.98) 0%, rgba(239,246,255,0.98) 100%)",
            borderBottom: "1px solid rgba(226,232,240,0.9)",
          }}
        >
          <div
            className="jm-sweep"
            style={{
              position: "absolute",
              inset: 0,
              width: "65%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)",
              animation: "jm-sweep 2.8s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(37,87,167,0.08)",
                border: "1px solid rgba(37,87,167,0.13)",
                color: "#1D4ED8",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles size={14} strokeWidth={2.4} />
              AI Match Engine
            </div>
            <h2
              style={{
                margin: 0,
                color: "#0F172A",
                fontSize: 24,
                lineHeight: 1.15,
                fontWeight: 850,
                letterSpacing: "-0.01em",
              }}
            >
              Building your match report
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: "#64748B",
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              Comparing resume signals with the job requirements.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 26px 24px" }}>
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 20,
              padding: "28px 18px 26px",
              borderRadius: 16,
              background:
                "radial-gradient(circle at 50% 35%, rgba(79,142,247,0.10), transparent 50%), linear-gradient(180deg, rgba(248,251,255,0.92) 0%, rgba(255,255,255,0.88) 100%)",
              border: "1px solid rgba(226,232,240,0.92)",
            }}
          >
            {/* Circular progress ring with percentage inside */}
            <div style={{ position: "relative", width: 108, height: 108 }}>
              <svg
                width="108"
                height="108"
                viewBox="0 0 108 108"
                style={{ transform: "rotate(-90deg)" }}
              >
                {/* Track */}
                <circle
                  cx="54"
                  cy="54"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(203,213,225,0.6)"
                  strokeWidth="7"
                />
                {/* Progress arc */}
                <circle
                  className="jm-ring"
                  cx="54"
                  cy="54"
                  r={RADIUS}
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 0.35s ease" }}
                />
              </svg>

              {/* Percentage label centered inside ring */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "#1D4ED8", fontSize: 22, fontWeight: 800 }}>
                  {displayPct}%
                </span>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#0F172A", fontSize: 17, fontWeight: 750, lineHeight: 1.25 }}>
                {current.label}
              </div>
              <div style={{ marginTop: 6, color: "#64748B", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
                Please wait while CareerBOT analyzes your match.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid rgba(226,232,240,0.9)",
              color: "#64748B",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Lock size={14} strokeWidth={2.2} color="#059669" />
              Private analysis
            </span>
            <span>Usually 15-30 seconds</span>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(content, portalTarget);
};

export default LoadingAnimation;
