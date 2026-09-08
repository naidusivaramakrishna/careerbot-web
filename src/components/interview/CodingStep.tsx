"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Play, BarChart2, Clock, Loader2, CheckCircle2, BookOpen, AlertCircle,
} from "lucide-react";
import type {
  CodingTestLanguage,
  SubmitSolutionResponse,
  RunResult,
  CodingProblemDetail,
} from "@/app/coding-test/_lib/types";
import { fetchProblem } from "@/app/coding-test/_lib/api";
import { mockGrade } from "@/app/coding-test/_lib/gradingApi";
import { runAsync } from "@/app/coding-test/_lib/runApi";

const CodeEditor = dynamic(
  () => import("@/app/coding-test/_components/CodeEditor"),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1e1e1e] rounded-lg animate-pulse" /> },
);
const GradingResultPanel = dynamic(
  () => import("@/app/coding-test/_components/GradingResultPanel"),
  { ssr: false },
);
const OutputPanel = dynamic(
  () => import("@/app/coding-test/_components/OutputPanel"),
  { ssr: false },
);

const LANGUAGES: { value: CodingTestLanguage; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export interface CodingStepProps {
  problemSlug: string;
  timeLimitS: number;
  onSubmitted: (result: SubmitSolutionResponse) => void;
  onTimeExpired: () => void;
}

export function CodingStep({ problemSlug, timeLimitS, onSubmitted, onTimeExpired }: CodingStepProps) {
  const [problem, setProblem] = useState<CodingProblemDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [language, setLanguage] = useState<CodingTestLanguage>("python");
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(timeLimitS);
  const [isRunning, setIsRunning] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [gradingResult, setGradingResult] = useState<SubmitSolutionResponse | null>(null);
  const [showStatement, setShowStatement] = useState(true);
  const [outputOpen, setOutputOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<"run" | "grade">("run");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    fetchProblem(problemSlug)
      .then((p) => {
        setProblem(p);
        setCode(p.starter_code.python ?? "");
      })
      .catch(() => setLoadError("Could not load problem. Please continue with the interview."));
  }, [problemSlug]);

  useEffect(() => {
    if (problem) setCode(problem.starter_code[language] ?? "");
  }, [language, problem]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!hasExpiredRef.current && !hasSubmittedRef.current) {
            hasExpiredRef.current = true;
            onTimeExpired();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
  }, [onTimeExpired]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleRun = useCallback(async () => {
    if (!problem || isRunning || isGrading) return;
    setIsRunning(true);
    setRunResult(null);
    setOutputTab("run");
    setOutputOpen(true);
    try {
      const judgeRes = await runAsync(problemSlug, language, code);
      setRunResult({
        stdout: judgeRes.results.map(r => r.stdout).join('\n').trim(),
        stderr: judgeRes.results.find(r => r.stderr)?.stderr ?? '',
        exit_code: judgeRes.verdict === 'accepted' ? 0 : 1,
      });
    } catch {
      setRunResult({ stdout: "", stderr: "Execution failed.", exit_code: 1 });
    } finally {
      setIsRunning(false);
    }
  }, [problem, problemSlug, language, code, isRunning, isGrading]);

  const handleGrade = useCallback(async () => {
    if (!problem || isGrading || gradingResult) return;
    setIsGrading(true);
    stopTimer();
    setOutputTab("grade");
    setOutputOpen(true);
    try {
      const r = await mockGrade(problemSlug, language, code, problem?.title);
      setGradingResult(r);
      hasSubmittedRef.current = true;
      onSubmitted(r);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Grading failed.";
      const fallback: SubmitSolutionResponse = {
        submission_id: "",
        problem_slug: problemSlug,
        language,
        score: null,
        grading_result: null,
        error: msg,
        submitted_at: new Date().toISOString(),
      };
      setGradingResult(fallback);
      onSubmitted(fallback);
    } finally {
      setIsGrading(false);
    }
  }, [problem, problemSlug, language, code, isGrading, gradingResult, stopTimer, onSubmitted]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const isLow = timeLeft > 0 && timeLeft < 120;
  const isGraded = !!gradingResult;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
        <AlertCircle size={32} className="text-gray-400" />
        <p className="text-sm text-gray-600">{loadError}</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-[#2557a7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              isLow ? "bg-red-100 text-red-600" : "bg-[#2557a7]/10 text-[#2557a7]"
            }`}
          >
            <Clock size={10} />
            {timeLeft === 0 ? "Time's up" : fmt(timeLeft)}
          </div>
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                disabled={isGraded}
                onClick={() => setLanguage(l.value)}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-all disabled:opacity-50 ${
                  language === l.value
                    ? "bg-[#2557a7] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowStatement((s) => !s)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <BookOpen size={11} />
            {showStatement ? "Hide" : "Problem"}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || isGrading || isGraded}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
            Run
          </button>
          {/* Grade Code button */}
          <button
            onClick={handleGrade}
            disabled={isGrading || isGraded || isRunning || timeLeft === 0}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#2557a7] text-white rounded text-xs font-semibold hover:bg-[#1e4a8f] transition-all disabled:opacity-50"
          >
            {isGrading ? (
              <><Loader2 size={11} className="animate-spin" /> Grading…</>
            ) : isGraded ? (
              <><CheckCircle2 size={11} /> Graded</>
            ) : (
              <><BarChart2 size={11} /> Grade Code</>
            )}
          </button>
        </div>
      </div>

      {/* Body: statement + editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem statement — desktop only */}
        {showStatement && (
          <div className="hidden lg:flex flex-col w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white px-4 py-3 text-xs gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                    DIFF_COLORS[problem.difficulty] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {problem.difficulty}
                </span>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {problem.tag}
                </span>
              </div>
              <h2 className="text-sm font-bold text-gray-900 mb-1.5">{problem.title}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{problem.statement}</p>
            </div>

            {problem.examples.length > 0 && (
              <div>
                <p className="font-semibold text-gray-800 mb-1">Examples</p>
                {problem.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-200 rounded p-2 mb-1.5 font-mono text-[11px]"
                  >
                    <p><span className="font-semibold">Input:</span> {ex.input}</p>
                    <p><span className="font-semibold">Output:</span> {ex.output}</p>
                    {ex.explanation && (
                      <p className="text-gray-500 mt-0.5">{ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints.length > 0 && (
              <div>
                <p className="font-semibold text-gray-800 mb-1">Constraints</p>
                <ul className="space-y-0.5 text-gray-600 font-mono text-[11px]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-[10px] text-gray-400 space-y-0.5 border-t border-gray-100 pt-2">
              <p>Time: {problem.expected_time_complexity}</p>
              <p>Space: {problem.expected_space_complexity}</p>
            </div>
          </div>
        )}

        {/* Editor + output panel */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden p-2">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onCtrlEnter={handleRun}
            />
          </div>

          {outputOpen && (
            <div className="shrink-0 border-t border-gray-200">
              {/* Tab switcher between run output and grading */}
              <div className="flex border-b border-gray-200 bg-white">
                <button
                  onClick={() => setOutputTab("run")}
                  className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                    outputTab === "run"
                      ? "border-gray-800 text-gray-800"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Output
                </button>
                <button
                  onClick={() => setOutputTab("grade")}
                  className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                    outputTab === "grade"
                      ? "border-[#2557a7] text-[#2557a7]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Grading Result
                  {isGraded && <CheckCircle2 size={10} className="inline ml-1 text-green-500" />}
                </button>
              </div>

              <div className="h-48 overflow-y-auto">
                {outputTab === "grade" ? (
                  <div className="p-2 bg-white h-full overflow-y-auto">
                    {isGrading ? (
                      <div className="flex items-center justify-center h-full gap-2 text-sm text-gray-500">
                        <Loader2 size={16} className="animate-spin text-[#2557a7]" />
                        Grading your solution…
                      </div>
                    ) : gradingResult ? (
                      <GradingResultPanel result={gradingResult} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        Click &quot;Grade Code&quot; to evaluate your solution.
                      </div>
                    )}
                  </div>
                ) : runResult ? (
                  <OutputPanel result={runResult} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                    <Loader2 size={16} className="text-gray-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
