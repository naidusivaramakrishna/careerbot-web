/**
 * Score Summary Panel
 *
 * Displays best scores for ATS, Job Match, and Interview
 * Shows progress bars and status labels
 */

import React from 'react';
import { Target, TrendingUp, Mic } from 'lucide-react';

export interface ScoreSummaryPanelProps {
  atsScore?: number;
  jobMatchScore?: number;
  interviewScore?: number;
}

export const ScoreSummaryPanel: React.FC<ScoreSummaryPanelProps> = ({
  atsScore,
  jobMatchScore,
  interviewScore,
}) => {
  const getScoreStatus = (score: number | undefined): {
    label: string;
    color: string;
    bgColor: string;
  } => {
    if (score === undefined) {
      return { label: 'Not taken', color: 'text-gray-500', bgColor: 'bg-gray-200' };
    }
    if (score >= 80) {
      return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
    }
    if (score >= 70) {
      return { label: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    }
    if (score >= 60) {
      return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    }
    if (score >= 50) {
      return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    }
    return { label: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const scores = [
    {
      label: 'ATS Score',
      value: atsScore,
      icon: Target,
      description: 'Resume compatibility',
    },
    {
      label: 'Job Match',
      value: jobMatchScore,
      icon: TrendingUp,
      description: 'Best match percentage',
    },
    {
      label: 'Interview',
      value: interviewScore,
      icon: Mic,
      description: 'Communication score',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Scores</h2>

      {/* Scores */}
      <div className="space-y-6">
        {scores.map((score) => {
          const Icon = score.icon;
          const status = getScoreStatus(score.value);
          const percentage = score.value || 0;

          return (
            <div key={score.label}>
              {/* Score Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{score.label}</p>
                    <p className="text-xs text-gray-500">{score.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {score.value !== undefined ? (
                    <>
                      <p className="text-xl font-bold text-gray-900">
                        {Math.round(percentage)}
                      </p>
                      <p className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">--</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full ${status.bgColor} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Message */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          💡 <span className="font-medium">Tip:</span> Higher scores increase your chances of landing interviews!
        </p>
      </div>
    </div>
  );
};
