/**
 * Progress Indicator — card-internal step header
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps:  number;
}

const STEPS = [
  { label: 'Your Profile',  sub: 'Personal info & resume' },
  { label: "You're Ready!", sub: 'Start your journey'     },
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center select-none">

      {STEPS.map((step, index) => {
        const stepNum     = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive    = stepNum === currentStep;

        return (
          <React.Fragment key={stepNum}>

            {/* Step item */}
            <div
              className="flex items-center gap-3 shrink-0 px-3 py-1.5 rounded-xl transition-all duration-300"
              style={{
                background: isActive ? 'rgba(37,87,167,0.06)' : 'transparent',
              }}
            >
              {/* Circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                style={{
                  background: isCompleted
                    ? 'linear-gradient(135deg, #2557a7, #5896d7)'
                    : isActive
                    ? '#2557a7'
                    : '#edf0f5',
                  color:     isCompleted || isActive ? 'white' : '#b0bac8',
                  boxShadow: isActive
                    ? '0 2px 10px rgba(37,87,167,0.35)'
                    : 'none',
                }}
              >
                {isCompleted ? <Check size={13} strokeWidth={3} /> : stepNum}
              </div>

              {/* Text */}
              <div className="flex flex-col leading-none gap-0.5">
                <span
                  className="text-[13px] font-bold tracking-tight"
                  style={{
                    color: isActive
                      ? '#2557a7'
                      : isCompleted
                      ? '#94a3b8'
                      : '#c8d0db',
                  }}
                >
                  {step.label}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? '#94a3b8' : '#c8d0db' }}
                >
                  {step.sub}
                </span>
              </div>
            </div>

            {/* Connector */}
            {index < STEPS.length - 1 && (
              <div
                className="flex-1 mx-3 rounded-full overflow-hidden"
                style={{ height: '2px', background: '#edf0f5' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-in-out"
                  style={{
                    width:      currentStep > stepNum ? '100%' : '0%',
                    background: 'linear-gradient(90deg, #2557a7, #5896d7)',
                  }}
                />
              </div>
            )}

          </React.Fragment>
        );
      })}

    </div>
  );
};
