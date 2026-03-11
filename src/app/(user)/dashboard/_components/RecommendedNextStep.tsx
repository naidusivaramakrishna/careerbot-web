/**
 * Recommended Next Step Component
 *
 * Displays backend-computed recommended action with 5-step progress tracker
 * Shows current step with description and CTA button
 */

import React from 'react';
import { ArrowRight, Check, Upload, User, Search, Sparkles, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { RecommendedStep } from '@/types/dashboard.types';

export interface RecommendedNextStepProps {
  recommendedStep: RecommendedStep;
  progress: {
    resume_uploaded: boolean;
    profile_completed: boolean;
    ats_scan_done: boolean;
    resume_enhanced: boolean;
    job_applied: boolean;
  };
}

const STEP_ICONS = {
  1: Upload,
  2: User,
  3: Search,
  4: Sparkles,
  5: Briefcase,
};

const STEP_LABELS = [
  'Upload Resume',
  'Complete Profile',
  'ATS Scan',
  'Enhance',
  'Apply to Jobs',
];

export const RecommendedNextStep: React.FC<RecommendedNextStepProps> = ({
  recommendedStep,
  progress,
}) => {
  const completedSteps = [
    progress.resume_uploaded,
    progress.profile_completed,
    progress.ats_scan_done,
    progress.resume_enhanced,
    progress.job_applied,
  ];

  const StepIcon = STEP_ICONS[recommendedStep.step_number as keyof typeof STEP_ICONS] || Upload;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Section Header */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Next Step</h2>

      {/* Progress Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {STEP_LABELS.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = completedSteps[index];
            const isCurrent = stepNumber === recommendedStep.step_number;
            const Icon = STEP_ICONS[stepNumber as keyof typeof STEP_ICONS];

            return (
              <React.Fragment key={stepNumber}>
                {/* Step Circle */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isCurrent ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    )}
                    {isCurrent && (
                      <div className="absolute -inset-1 bg-blue-500 rounded-full animate-ping opacity-20" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center max-w-[80px] ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < STEP_LABELS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-6">
                    <div
                      className={`h-full transition-all duration-300 ${
                        completedSteps[index] ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current Step Card */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {recommendedStep.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {recommendedStep.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              {recommendedStep.credit_cost > 0 ? (
                <span className="text-blue-600 font-medium">
                  💎 {recommendedStep.credit_cost} credits
                </span>
              ) : (
                <span className="text-green-600 font-medium">✨ FREE</span>
              )}
              {recommendedStep.estimated_time && (
                <span className="text-gray-500">⏱️ {recommendedStep.estimated_time}</span>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <Link href={recommendedStep.cta_path}>
            <button className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2">
              {recommendedStep.cta_text}
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
