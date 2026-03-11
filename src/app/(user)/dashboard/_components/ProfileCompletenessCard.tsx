/**
 * Profile Completeness Card
 *
 * Displays profile completion percentage with circular progress
 * Shows missing fields and encourages profile completion
 */

import React from 'react';
import { User, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export interface ProfileCompletenessCardProps {
  completeness: number; // 0-100
  missingFields: string[];
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  completeness,
  missingFields,
}) => {
  // Determine status based on completeness
  const getStatus = () => {
    if (completeness === 100) {
      return {
        label: 'Complete!',
        color: 'text-green-600',
        ringColor: 'stroke-green-500',
        bgColor: 'bg-green-50',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      };
    }
    if (completeness >= 80) {
      return {
        label: 'Almost There!',
        color: 'text-blue-600',
        ringColor: 'stroke-blue-500',
        bgColor: 'bg-blue-50',
        icon: <User className="w-5 h-5 text-blue-600" />,
      };
    }
    if (completeness >= 60) {
      return {
        label: 'Good Progress',
        color: 'text-yellow-600',
        ringColor: 'stroke-yellow-500',
        bgColor: 'bg-yellow-50',
        icon: <User className="w-5 h-5 text-yellow-600" />,
      };
    }
    if (completeness >= 30) {
      return {
        label: 'Getting Started',
        color: 'text-orange-600',
        ringColor: 'stroke-orange-500',
        bgColor: 'bg-orange-50',
        icon: <User className="w-5 h-5 text-orange-600" />,
      };
    }
    return {
      label: 'Just Started',
      color: 'text-gray-600',
      ringColor: 'stroke-gray-400',
      bgColor: 'bg-gray-50',
      icon: <User className="w-5 h-5 text-gray-600" />,
    };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-700">Profile Completeness</p>
        <span className={`text-xs font-semibold ${status.color} px-2 py-1 ${status.bgColor} rounded-full`}>
          {status.label}
        </span>
      </div>

      {/* Progress Circle and Missing Fields */}
      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className={status.ringColor}
              style={{
                strokeDasharray: `${2 * Math.PI * 32}`,
                strokeDashoffset: `${2 * Math.PI * 32 * (1 - completeness / 100)}`,
                transition: 'stroke-dashoffset 0.5s ease-out',
              }}
            />
          </svg>
          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{completeness}%</span>
          </div>
        </div>

        {/* Missing Fields */}
        <div className="flex-1">
          {missingFields.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-2">Still missing:</p>
              <ul className="space-y-1">
                {missingFields.slice(0, 3).map((field) => (
                  <li key={field} className="text-sm text-gray-700 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {field}
                  </li>
                ))}
                {missingFields.length > 3 && (
                  <li className="text-xs text-gray-500">
                    +{missingFields.length - 3} more
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">All fields complete!</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Profile Link */}
      {missingFields.length > 0 && (
        <Link href="/profile">
          <button className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Update Profile
          </button>
        </Link>
      )}
    </div>
  );
};
