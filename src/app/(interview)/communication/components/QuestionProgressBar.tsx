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
    <div className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-sm font-semibold text-indigo-600">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
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
