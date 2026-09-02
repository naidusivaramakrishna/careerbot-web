"use client";

import { useEffect, useState } from "react";

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
  const activeMessage = stageLabels[stage];
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  // stage is authoritative — the caller (Overview.analyzeMatch) advances it
  // at real milestones (parsing/extracting/matching/scoring/generating). On
  // a real transition, drop whatever partial text/deletion state was
  // mid-flight so the typewriter below retypes the new stage's label
  // cleanly instead of splicing it onto leftover characters from the
  // previous one.
  useEffect(() => {
    setDisplayedMessage("");
    setIsDeleting(false);
  }, [stage]);

  useEffect(() => {
    // This isn't wired to real backend progress, so it must never actually
    // reach 100 — it's a fake progress indicator that holds near the top
    // until the parent swaps this component out for the real result.
    // Looping back to 0 (the old behavior) reads as the operation restarting.
    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 99 ? 99 : current + 1));
    }, 90);

    return () => window.clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    const messageIsComplete = displayedMessage === activeMessage;
    const messageIsEmpty = displayedMessage.length === 0;
    const delay = isDeleting ? 38 : messageIsComplete ? 1200 : 65;

    const timer = window.setTimeout(() => {
      if (messageIsComplete && !isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (messageIsEmpty && isDeleting) {
        // Same stage, no new label yet — retype the same message instead of
        // advancing to an unrelated one. Cycling through every stage's label
        // regardless of the real stage is what made this decorative instead
        // of reflecting actual progress.
        setIsDeleting(false);
        return;
      }

      setDisplayedMessage(
        activeMessage.slice(0, displayedMessage.length + (isDeleting ? -1 : 1)),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeMessage, displayedMessage, isDeleting]);

  return (
    <main
      className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-white px-5"
      aria-live="polite"
      aria-label={activeMessage}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center" role="status">
          <div className="absolute inset-0 animate-spin rounded-full border-[7px] border-blue-100 border-r-blue-600 border-t-blue-600" />
          {/* aria-hidden is load-bearing: this span sits inside TWO polite
              live regions (the <main> above and the implicit one from
              role="status" on its parent) and reticks every 90ms, which
              queued ~99 separate announcements per analysis and drowned out
              everything else on the page for a screen reader. Sighted users
              still get the counter; the stage label below carries the
              meaningful milestones. */}
          <span className="text-xl font-bold tabular-nums text-blue-600" aria-hidden="true">
            {progress}%
          </span>
          <span className="sr-only">{activeMessage}</span>
        </div>

        <div className="flex h-8 min-w-80 items-center justify-center" aria-hidden="true">
          <p className="whitespace-nowrap text-lg font-semibold text-blue-600">
            {displayedMessage}
            <span className="ml-0.5 inline-block animate-pulse text-blue-600 motion-reduce:animate-none">|</span>
          </p>
        </div>
      </div>
    </main>
  );
}
