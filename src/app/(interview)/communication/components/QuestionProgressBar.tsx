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
    <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)] ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-slate-800">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="rounded-full border border-[#2557a7]/15 bg-[#2557a7]/5 px-2.5 py-1 text-xs font-black text-[#2557a7]">
          {percentage}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2557a7] transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${currentQuestion} of ${totalQuestions}`}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        <span>Current item</span>
        <span>{totalQuestions - currentQuestion} remaining</span>
      </div>
    </div>
  );
}
