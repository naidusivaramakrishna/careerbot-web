"use client";
// Do not mount. Backend score calculation is explicit only.
// The preview score updates live without API calls, and the full ATS score
// is calculated only when the user explicitly clicks "Calculate Full ATS Score".
// This component should remain unmounted and unused.

export default function BackgroundScoreCalculator() {
  return null;
}
