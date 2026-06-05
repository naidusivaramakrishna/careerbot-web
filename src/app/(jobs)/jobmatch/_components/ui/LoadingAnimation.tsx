"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

const stageInfo: Record<LoadingStage, { label: string; pct: number }> = {
  parsing:    { label: "Parsing your resume...",              pct: 15 },
  extracting: { label: "Extracting skills & experience...",   pct: 35 },
  matching:   { label: "Matching with job requirements...",   pct: 58 },
  scoring:    { label: "Calculating your match score...",     pct: 78 },
  generating: { label: "Generating your insights report...", pct: 92 },
};

const LoadingAnimation: React.FC<{ stage: LoadingStage }> = ({ stage }) => {
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const [displayPct, setDisplayPct] = useState(0);
  const target = stageInfo[stage].pct;

  useEffect(() => { setPortalTarget(document.body); }, []);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPct(p => {
        if (p >= target) { clearInterval(interval); return target; }
        return Math.min(p + 1, target);
      });
    }, 35);
    return () => clearInterval(interval);
  }, [target]);

  if (!portalTarget) return null;

  const content = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(6px)",
    }}>
      <style>{`
        @keyframes atom-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes jm-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 28,
        maxWidth: 360, width: "100%", padding: "0 28px",
      }}>

        {/* Atomic orbital rings */}
        <div style={{
          width: 130, height: 130,
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "atom-spin 3.6s linear infinite",
        }}>
          {/* Ring 1 — horizontal ellipse */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "3px solid #2557a7",
            transform: "scaleY(0.28)",
          }} />
          {/* Ring 2 — 60° */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "3px solid #4f8ef7",
            transform: "rotate(60deg) scaleY(0.28)",
          }} />
          {/* Ring 3 — −60° */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "3px solid #2557a7",
            transform: "rotate(-60deg) scaleY(0.28)",
          }} />
          {/* Nucleus */}
          <div style={{
            position: "relative", zIndex: 1,
            width: 17, height: 17, borderRadius: "50%",
            background: "linear-gradient(135deg, #2557a7 0%, #4f8ef7 100%)",
            boxShadow: "0 0 18px rgba(37,87,167,0.55)",
          }} />
        </div>

        {/* Title + stage text */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Analyzing Your Match
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0, minHeight: 20 }}>
            {stageInfo[stage].label}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Processing</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2557a7" }}>{displayPct}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: "#EEF2F8", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${displayPct}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, #2557a7 0%, #4f8ef7 100%)",
              transition: "width 0.08s linear",
            }} />
          </div>
        </div>

        {/* Animated dots */}
        <div style={{ display: "flex", gap: 6, marginTop: -8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#2557a7",
              animation: `jm-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>

        {/* Note */}
        <p style={{ fontSize: 12, color: "#C4CDD8", margin: "-12px 0 0", textAlign: "center" }}>
          This usually takes 15–30 seconds
        </p>

      </div>
    </div>
  );

  return createPortal(content, portalTarget);
};

export default LoadingAnimation;
