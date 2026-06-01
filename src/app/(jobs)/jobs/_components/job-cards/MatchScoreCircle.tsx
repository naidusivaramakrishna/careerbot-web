"use client";

interface MatchScoreCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  dark?: boolean;
  band?: string;
  showLabel?: boolean;
  animate?: boolean;
}

const BAND_COLORS: Record<string, { stroke: string; glow: string; text: string }> = {
  strong:  { stroke: "#10b981", glow: "#10b98155", text: "#10b981" },
  good:    { stroke: "#3b82f6", glow: "#3b82f655", text: "#3b82f6" },
  partial: { stroke: "#f59e0b", glow: "#f59e0b55", text: "#f59e0b" },
  low:     { stroke: "#ef4444", glow: "#ef444455", text: "#ef4444" },
};

function scoreColor(value: number) {
  if (value >= 75) return BAND_COLORS.strong;
  if (value >= 55) return BAND_COLORS.good;
  if (value >= 35) return BAND_COLORS.partial;
  return BAND_COLORS.low;
}

export default function MatchScoreCircle({
  value,
  size = 68,
  strokeWidth = 5,
  strokeColor,
  dark = false,
  band,
  showLabel = false,
}: MatchScoreCircleProps) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - strokeWidth - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (safeValue / 100) * circumference;

  const colors = band ? (BAND_COLORS[band] ?? scoreColor(safeValue)) : scoreColor(safeValue);
  const finalStroke = strokeColor ?? colors.stroke;
  const gradId = `msring-${size}-${safeValue}`;

  const trackColor = dark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const textFill   = dark ? "#ffffff" : colors.text;

  return (
    <svg width={size} height={size} className="shrink-0" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={finalStroke} stopOpacity="0.7" />
          <stop offset="100%" stopColor={finalStroke} stopOpacity="1" />
        </linearGradient>
        {dark && (
          <filter id={`glow-${gradId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />

      {/* Progress arc */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)",
          filter: dark ? `drop-shadow(0 0 ${strokeWidth}px ${colors.glow})` : undefined,
        }}
      />

      {/* Score text */}
      <text
        x={cx}
        y={showLabel ? cy - 4 : cy}
        textAnchor="middle"
        fontSize={size < 50 ? "11" : size < 80 ? "13" : "16"}
        fontWeight="800"
        fill={textFill}
        dominantBaseline="middle"
        style={{ letterSpacing: "-0.5px" }}
      >
        {safeValue}%
      </text>

      {showLabel && (
        <text
          x={cx}
          y={cy + (size < 50 ? 9 : 11)}
          textAnchor="middle"
          fontSize={size < 50 ? "7" : "8"}
          fontWeight="700"
          fill={dark ? "rgba(255,255,255,0.45)" : "#9CA3AF"}
          dominantBaseline="middle"
          style={{ letterSpacing: "0.5px", textTransform: "uppercase" }}
        >
          MATCH
        </text>
      )}
    </svg>
  );
}
