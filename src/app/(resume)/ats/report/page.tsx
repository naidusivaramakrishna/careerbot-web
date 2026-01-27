"use client";

import { useEffect, useState } from "react";
import DetailedReport from "../_components/report/DetailedReport";

export default function ReportPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("atsAnalysisData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch {
        // ignore parsing errors
      }
    }
  }, []);

  if (!data) return <div className="p-8 text-center">Loading report…</div>;

  return (
    <DetailedReport
      score={data.scorePercentage ?? 0}
      atsData={data}
      missingFields={data.missingFields ?? []}
      onOpenEnhancer={() => window.location.assign("/ats/enhancer")}
      onBackToMain={() => window.history.back()}
    />
  );
}
