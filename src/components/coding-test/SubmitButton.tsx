'use client';

import { Loader2, Play } from 'lucide-react';

interface SubmitButtonProps {
  onSubmit: () => void;
  onRun: () => void;
  submitState: 'idle' | 'submitting' | 'done';
  runState: 'idle' | 'running' | 'done';
  submissionsRemaining: number | null;
  disabled?: boolean;
}

export default function SubmitButton({
  onSubmit,
  onRun,
  submitState,
  runState,
  submissionsRemaining,
  disabled = false,
}: SubmitButtonProps) {
  const outOfCredits = submissionsRemaining === 0;
  const busy = submitState === 'submitting' || runState === 'running';

  return (
    <div className="flex items-center gap-2">
      {submissionsRemaining !== null && (
        <span
          className={`text-xs tabular-nums ${outOfCredits ? 'text-rose-500' : 'text-slate-400'}`}
          aria-live="polite"
        >
          {submissionsRemaining} left
        </span>
      )}

      <button
        type="button"
        onClick={onRun}
        disabled={disabled || busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {runState === 'running' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Running…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" aria-hidden />
            Run
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || busy || outOfCredits}
        aria-live="polite"
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {submitState === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Grading…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" aria-hidden />
            Submit for grading
          </>
        )}
      </button>
    </div>
  );
}
