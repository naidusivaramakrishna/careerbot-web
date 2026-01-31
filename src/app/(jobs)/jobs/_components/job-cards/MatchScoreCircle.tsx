"use client";

export default function MatchScoreCircle({ value }: { value: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <svg width="44" height="44" className="shrink-0">
      <circle
        cx="22"
        cy="22"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        stroke="#22C55E"
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />

      {/* Percentage inside */}
      <text
        x="22"
        y="24"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#16A34A"
      >
        {safeValue}%
      </text>
    </svg>
  );
}
