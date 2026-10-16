"use client";

import { getScoreBand } from "./resultsSummary";
import { BANDS, bandStyles, bandColors } from "@/lib/job-match/bands";
import { TbTargetArrow } from "react-icons/tb";

const SEGMENTS = BANDS.map(({ min, band }, index) => ({
  from: min,
  to: index === 0 ? 100 : BANDS[index - 1].min,
  color: bandColors[band].text,
  label: bandStyles[band].label,
})).reverse();

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

export default function JobMatchScoreGauge({ value, targetRole }: { readonly value: number; readonly targetRole?: string }) {
  const score = Math.min(100, Math.max(0, value));
  const needleAngle = 270 + score * 1.8;
  const label = getScoreBand(score).label;
  const scoreColor = getScoreBand(score).text;

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
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#475467" strokeWidth="1.5" />
                <text x={labelPt.x + endpointOffset} y={labelPt.y + 4} textAnchor={textAnchor} className="fill-slate-600 text-body-sm">
                  {tick}%
                </text>
              </g>
            );
          })}

          <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${CENTER_X}px ${CENTER_Y}px`, transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <path d={`M ${CENTER_X - 7} ${CENTER_Y + 2} L ${CENTER_X} 58 L ${CENTER_X + 7} ${CENTER_Y + 2} Z`} fill="#475467" />
          </g>
          <circle cx={CENTER_X} cy={CENTER_Y} r="13" fill="#475467" />

          <text x={CENTER_X} y="195" textAnchor="middle" fill={scoreColor} className="text-h1">
            {score}%
          </text>
        </svg>
        <p className="-mt-1 text-center text-body-lg" style={{ color: scoreColor }}>
          {label}
        </p>
      </div>
      {targetRole && (
        <div className="mt-2.5 space-y-2 border-t border-[#F8FAFC] pt-2.5">
          <div className="flex items-center gap-2.5">
            <TbTargetArrow className="h-6 w-6 shrink-0 text-[#2557A7]" />
            <div className="min-w-0">
              <p className="text-body-sm uppercase tracking-[0.04em] text-[#2557A7]">Target Role</p>
              <p className="truncate text-body-sm text-[#101828]">{targetRole}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
