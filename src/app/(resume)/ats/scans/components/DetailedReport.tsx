import React from "react";
import { ArrowLeft, ClipboardList, FileText, Lightbulb } from "lucide-react";
import { getConfidenceRating, getScoreColor, getScoreLabel, getSeverityStyle } from "../utils/helpers";
import { AnalysisItem } from "../utils/data";
import BreakdownBar from "./BreakdownBar";

const DetailedReport = ({
  onOpenEnhancer,
  onBackToMain,
  score,
  analysisData,
  breakdown,
}: {
  onOpenEnhancer: () => void;
  onBackToMain: () => void;
  score: number;
  analysisData: AnalysisItem[];
  breakdown: { label: string; scoreValue: number }[];
}) => {
  const confidence = getConfidenceRating(score);
  const radius = 55;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const scoreOffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full max-w-7xl mx-auto p-4  min-h-screen">
      <button
        onClick={onBackToMain}
        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg mb-6 hover:bg-gray-100 flex items-center shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Scan/Upload
      </button>

      <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
        Detailed Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Score & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center relative">
            <div className="relative w-40 h-40 mx-auto mt-8">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={getScoreColor(score)}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  strokeDasharray={circumference}
                  strokeDashoffset={scoreOffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">
                  {score}%
                </span>
                <span className="text-lg font-semibold" style={{ color: getScoreColor(score) }}>
                  {getScoreLabel(score)}
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-4">
              {confidence}/5 Confidence Rating
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center text-lg font-bold text-gray-800 mb-4">
              <ClipboardList className="w-6 h-6 mr-2 text-indigo-500" />
              Detailed Breakdown
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Individual component scores
            </p>
            {breakdown.map((item) => (
              <BreakdownBar key={item.label} label={item.label} scoreValue={item.scoreValue} />
            ))}
          </div>
        </div>

        {/* Right Column: Insights */}
        <div className="lg:col-span-3">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Actionable insights to improve your ATS performance
          </h3>
          <button className="px-4 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-full mb-4">
            Issues Found
          </button>
          <div className="space-y-4">
            {analysisData.map((item) => {
              const style = getSeverityStyle(item.severity);
              const Icon = style.icon;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border ${style.cardBorderColor} shadow-sm overflow-hidden`}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Icon className={`w-6 h-6 ${style.iconColor}`} />
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.issue}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.labelBg} ${style.labelColor}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="px-5 text-sm text-gray-600 -mt-4 mb-4">
                    {item.description}
                  </p>
                  <div
                    className={`px-5 py-4 ${style.fixBg} border-t border-gray-200`}
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb
                        className={`w-5 h-5 ${style.fixIconColor} mt-0.5`}
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-gray-800">
                          Suggested Fix:{" "}
                        </span>
                        <span className="text-gray-700">{item.fix}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      Ignore
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                      Fix It
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="mt-8 p-6 bg-yellow-100 rounded-xl text-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-purple-600" />
          <div>
            <h3 className="font-bold text-lg">
              Unlock up to +15 extra points with our AI-powered optimizer
            </h3>
            <p className="text-sm">
              Our AI instantly fixes formatting errors, improves structure, and
              keyword placement to help your resume stand out to recruiters and
              ATS systems.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenEnhancer}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
        >
          Get My +15 Points
        </button>
      </div>
    </div>
  );
};

export default DetailedReport;
