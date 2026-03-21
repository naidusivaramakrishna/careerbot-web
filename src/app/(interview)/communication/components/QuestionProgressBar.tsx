'use client';

interface QuestionProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  className?: string;
}

export default function QuestionProgressBar({
  currentQuestion,
  totalQuestions,
  className = '',
}: QuestionProgressBarProps) {
  const percentage = Math.round((currentQuestion / totalQuestions) * 100);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3.5 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-sm font-semibold text-[#2557a7]">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-[#2557a7] h-1.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${currentQuestion} of ${totalQuestions}`}
        />
      </div>
    </div>
  );
}
