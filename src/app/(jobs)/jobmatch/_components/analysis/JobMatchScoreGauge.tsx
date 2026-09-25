"use client";

import { TbTargetArrow } from "react-icons/tb";

const SEGMENTS = [
  { from: 0, to: 20, color: "#ef4444", label: "Needs improvement" },
  { from: 20, to: 40, color: "#fb923c", label: "Low match" },
  { from: 40, to: 60, color: "#facc15", label: "Fair match" },
  { from: 60, to: 80, color: "#a3e635", label: "Good match" },
  { from: 80, to: 100, color: "#22c55e", label: "Excellent match" },
];

const CENTER_X = 160;
const CENTER_Y = 142;
const RADIUS = 104;

function scoreAngle(score: number) {
  return (180 + score * 1.8) * (Math.PI / 180);
}

function pointForScore(score: number, radius = RADIUS) {
  const angle = scoreAngle(score);
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  };
}

function arcPath(from: number, to: number) {
  const start = pointForScore(from);
  const end = pointForScore(to);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

// Derived from SEGMENTS so the caption and the aria-label can never disagree
// with the arc the needle is sitting in. They previously used independent
// bands (30/50/70/85 vs 20/40/60/80) and a label — "Strong match" — that no
// segment carried, so e.g. a score of 82 rendered inside the green
// "Excellent match · 80–100%" arc while the caption read "Strong match".
function getScoreLabel(score: number) {
  const segment = SEGMENTS.find((s) => score >= s.from && score < s.to);
  return (segment ?? SEGMENTS.at(-1)!).label;
}

export default function JobMatchScoreGauge({ value, targetRole }: { readonly value: number; readonly targetRole?: string }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const needleAngle = 270 + score * 1.8;
  const label = getScoreLabel(score);
  let scoreColor: string;
  if (score < 20) scoreColor = "#ef4444";
  else if (score < 40) scoreColor = "#f97316";
  else if (score < 60) scoreColor = "#ca8a04";
  else if (score < 80) scoreColor = "#65a30d";
  else scoreColor = "#16a34a";

  return (
    <div className="w-full">
      <div
        className="mx-auto w-full max-w-[250px]"
        role="img"
        aria-label={`Job description match score: ${score} percent, ${label}`}
      >
        <svg viewBox="0 0 320 215" className="h-auto w-full overflow-visible">
          {SEGMENTS.map((segment) => (
            <path
              key={segment.from}
              d={arcPath(segment.from + 0.3, segment.to - 0.3)}
              fill="none"
              stroke={segment.color}
              strokeWidth="34"
              strokeLinecap="butt"
              className="cursor-help transition-opacity duration-150 hover:opacity-75"
              aria-label={`${segment.label}: ${segment.from} to ${segment.to} percent`}
            >
              <title>{`${segment.label} · ${segment.from}–${segment.to}%`}</title>
            </path>
          ))}
          {[0, 25, 50, 75, 100].map((tick) => {
            const inner = pointForScore(tick, 128);
            const outer = pointForScore(tick, 136);
            const labelPt = pointForScore(tick, 148);
            let endpointOffset: number;
            let textAnchor: "end" | "start" | "middle";
            if (tick === 0) {
              endpointOffset = -2;
              textAnchor = "end";
            } else if (tick === 100) {
              endpointOffset = 2;
              textAnchor = "start";
            } else {
              endpointOffset = 0;
              textAnchor = "middle";
            }
            return (
              <g key={tick}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#64748b" strokeWidth="1.5" />
                <text x={labelPt.x + endpointOffset} y={labelPt.y + 4} textAnchor={textAnchor} className="fill-slate-600 text-[10px] font-semibold">
                  {tick}%
                </text>
              </g>
            );
          })}

          <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${CENTER_X}px ${CENTER_Y}px`, transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <path d={`M ${CENTER_X - 7} ${CENTER_Y + 2} L ${CENTER_X} 58 L ${CENTER_X + 7} ${CENTER_Y + 2} Z`} fill="#6b7280" />
          </g>
          <circle cx={CENTER_X} cy={CENTER_Y} r="13" fill="#6b7280" />

          <text x={CENTER_X} y="195" textAnchor="middle" fill={scoreColor} className="text-[31px] font-medium">
            {score}%
          </text>
        </svg>
        <p className="-mt-1 text-center text-[16px] font-bold" style={{ color: scoreColor }}>
          {label}
        </p>
      </div>
      {targetRole && (
        <div className="mt-2.5 space-y-2 border-t border-[#eef1f6] pt-2.5">
          <div className="flex items-center gap-2.5">
            <TbTargetArrow className="h-6 w-6 shrink-0 text-[#2557a7]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#2557a7]">Target Role</p>
              <p className="truncate text-[13px] font-semibold text-[#1f2937]">{targetRole}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
