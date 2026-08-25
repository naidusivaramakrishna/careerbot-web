"use client";

import { TbTargetArrow, TbCalendar } from "react-icons/tb";

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
  return (segment ?? SEGMENTS[SEGMENTS.length - 1]).label;
}

const today = () =>
  new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function JobMatchScoreGauge({ value, targetRole }: { value: number; targetRole?: string }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const needleAngle = 270 + score * 1.8;
  const label = getScoreLabel(score);
  const scoreColor =
    score < 20 ? "#ef4444" :
    score < 40 ? "#f97316" :
    score < 60 ? "#ca8a04" :
    score < 80 ? "#65a30d" : "#16a34a";

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
            const endpointOffset = tick === 0 ? -2 : tick === 100 ? 2 : 0;
            const textAnchor = tick === 0 ? "end" : tick === 100 ? "start" : "middle";
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
      <div className="mt-2.5 space-y-2 border-t border-[#eef1f6] pt-2.5">
        {targetRole && (
          <div className="flex items-center gap-2.5">
            <TbTargetArrow className="h-6 w-6 shrink-0 text-[#2557a7]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#2557a7]">Target Role</p>
              <p className="truncate text-[13px] font-semibold text-[#1f2937]">{targetRole}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <TbCalendar className="h-6 w-6 shrink-0 text-[#2557a7]" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#2557a7]">Match Date</p>
            <p className="truncate text-[13px] font-semibold text-[#1f2937]">{today()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
