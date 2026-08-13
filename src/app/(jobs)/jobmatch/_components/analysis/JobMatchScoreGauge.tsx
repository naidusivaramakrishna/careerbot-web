"use client";

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

export default function JobMatchScoreGauge({ value }: { value: number }) {
  const score = Math.min(100, Math.max(0, Math.round(value)));
  const needleAngle = 270 + score * 1.8;
  const scoreColor =
    score < 20 ? "#ef4444" :
    score < 40 ? "#f97316" :
    score < 60 ? "#ca8a04" :
    score < 80 ? "#65a30d" : "#16a34a";

  return (
    <div
      className="mx-auto w-full max-w-[300px]"
      role="img"
      aria-label={`Job description match score: ${score} percent, ${getScoreLabel(score)}`}
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
          const label = pointForScore(tick, 148);
          const endpointOffset = tick === 0 ? -2 : tick === 100 ? 2 : 0;
          const textAnchor = tick === 0 ? "end" : tick === 100 ? "start" : "middle";
          return (
            <g key={tick}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#64748b" strokeWidth="1.5" />
              <text x={label.x + endpointOffset} y={label.y + 4} textAnchor={textAnchor} className="fill-slate-600 text-[10px] font-semibold">
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
      <p className="-mt-1 text-center text-base font-bold" style={{ color: scoreColor }}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
}
