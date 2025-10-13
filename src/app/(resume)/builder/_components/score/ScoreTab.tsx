"use client";
import React from "react";
import { useResume } from "../../_context/ResumeContext";
import { useATSScore } from "../../_hooks/useATSScore";
import ProgressBar from "./ProgressBar";
import MultiColorCircularScore from "./MultiColorCircularScore";

export default function ATSScorePanel() {
  const { resumeData } = useResume();
  const { score, details } = useATSScore(resumeData);

  return (
    <div className="p-6 bg-white border rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

      <div className="flex flex-col items-center justify-center">
        <MultiColorCircularScore value={score} />
        <p className="mt-2 text-sm text-gray-600">Overall Score</p>
      </div>

      <div className="mt-6 space-y-3 w-full">
        <ProgressBar value={details?.keywords_score ?? 0} label="Keywords" />
        <ProgressBar value={details?.formatting_score ?? 0} label="Formatting" />
        <ProgressBar value={details?.grammar_score ?? 0} label="Grammar" />
        <ProgressBar value={details?.skills_match ?? 0} label="Skills Match" />
      </div>

      <div className="mt-6 w-full">
        <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>
        <ul className="list-disc ml-5 text-sm text-gray-600">
          {details?.improvement_suggestions?.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}





