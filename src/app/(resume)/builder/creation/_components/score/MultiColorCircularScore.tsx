"use client";
import React, { useEffect, useId, useState } from "react";

interface Props {
  value: number;
  size?: number;
  duration?: number;
}

const TIER = {
  good: { arc: "#10B981", arcLight: "#34D399", track: "#D1FAE5", text: "#10B981", glow: "rgba(16,185,129,0.20)" },
  mid:  { arc: "#F59E0B", arcLight: "#FCD34D", track: "#FEF3C7", text: "#F59E0B", glow: "rgba(245,158,11,0.20)"  },
  low:  { arc: "#EF4444", arcLight: "#FCA5A5", track: "#FEE2E2", text: "#EF4444", glow: "rgba(239,68,68,0.20)"   },
} as const;

function getTier(v: number) {
  return v >= 70 ? "good" : v >= 40 ? "mid" : "low";
}

export default function MultiColorCircularScore({ value, size = 128, duration = 900 }: Props) {
  const [anim, setAnim] = useState(0);
  const uid = useId().replace(/:/g, "s");

  useEffect(() => {
    let start: number | null = null;
    const from = anim;
    const to = value;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnim(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const tier = getTier(anim);
  const c = TIER[tier];
  const R = 15.9155;
  const C = 2 * Math.PI * R;
  const filled = (Math.min(anim, 100) / 100) * C;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ inset: "14%", background: c.glow, filter: "blur(18px)" }}
      />

      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`arc-${uid}`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor={c.arcLight} />
            <stop offset="100%" stopColor={c.arc} />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={c.track}
          strokeWidth="3.2"
        />
        {/* Progress arc */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={`url(#arc-${uid})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          style={{ transition: "stroke-dasharray 0.04s linear" }}
        />
      </svg>

      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontSize: Math.round(size * 0.255), color: c.text }}
        >
          {Math.round(anim)}
        </span>
      </div>
    </div>
  );
}
