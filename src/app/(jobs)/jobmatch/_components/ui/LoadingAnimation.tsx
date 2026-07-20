"use client";

type LoadingStage =
  | "parsing"
  | "extracting"
  | "matching"
  | "scoring"
  | "generating";

const stageLabels: Record<LoadingStage, string> = {
  parsing: "Reading your resume",
  extracting: "Analyzing your experience",
  matching: "Matching the job requirements",
  scoring: "Calculating your match score",
  generating: "Preparing your results",
};

export default function LoadingAnimation({ stage }: { stage: LoadingStage }) {
  return (
    <main
      className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f7fb] px-5"
      aria-live="polite"
      aria-label={stageLabels[stage]}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 motion-reduce:animate-none"
          role="status"
        >
          <span className="sr-only">{stageLabels[stage]}</span>
        </div>
        <p className="text-sm font-medium text-slate-600">{stageLabels[stage]}...</p>
      </div>
    </main>
  );
}
