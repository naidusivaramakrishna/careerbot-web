"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Play, BarChart2, Clock, Loader2, CheckCircle2, BookOpen,
} from "lucide-react";
import type { CodingTestLanguage, RunResult } from "@/app/coding-test/_lib/types";
import { runAsync } from "@/app/coding-test/_lib/runApi";
import type { LiveCodingProblem, WsServerMessage } from "@/api/mockInterviewApi";

const CodeEditor = dynamic(
  () => import("@/app/coding-test/_components/CodeEditor"),
  { ssr: false, loading: () => <div className="flex-1 bg-[#1e1e1e] rounded-lg animate-pulse" /> },
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

export type CodeGraded = Extract<WsServerMessage, { type: "code_graded" }>;
export type FollowupGraded = Extract<WsServerMessage, { type: "followup_graded" }>;

// The problem comes in the coding_round_start frame and grading goes over the
// interview socket (submit_code / followup_answer); the room passes the
// server's code_graded / followup_graded replies back in as props.
export interface CodingStepProps {
  problem: LiveCodingProblem;
  instructions?: string;
  timeLimitS: number;
  grade: CodeGraded | null;
  followups: FollowupGraded[];
  pending: boolean;
  onSubmitCode: (code: string, language: CodingTestLanguage) => void;
  onSubmitFollowup: (code: string, attemptNumber: number) => void;
  onFinish: () => void;
}

export function CodingStep({
  problem, instructions, timeLimitS, grade, followups, pending, onSubmitCode, onSubmitFollowup, onFinish,
}: CodingStepProps) {
  const problemSlug = problem.slug;
  const [language, setLanguage] = useState<CodingTestLanguage>("python");
  const [code, setCode] = useState(problem.starter_code.python ?? "");
  const [timeLeft, setTimeLeft] = useState(timeLimitS);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showStatement, setShowStatement] = useState(true);
  const [outputOpen, setOutputOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<"run" | "grade">("run");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);
  // Read by the timer on expiry: the current editor content, not the
  // value captured when the interval was created.
  const latestRef = useRef({ code, language, onSubmitCode });
  useEffect(() => { latestRef.current = { code, language, onSubmitCode }; });

  const selectLanguage = (next: CodingTestLanguage) => {
    if (next === language) return;
    setLanguage(next);
    setCode(problem.starter_code[next] ?? "");
  };

  const submitCode = useCallback(() => {
    const { code: current, language: lang, onSubmitCode: send } = latestRef.current;
    if (!current.trim()) return;
    hasSubmittedRef.current = true;
    setOutputTab("grade");
    setOutputOpen(true);
    send(current, lang);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
  }, []);

  // Show each server grade (code_graded / followup_graded) as it arrives.
  useEffect(() => {
    if (!grade) return;
    setOutputTab("grade");
    setOutputOpen(true);
  }, [grade, followups.length]);

  // Time up: submit what is in the editor (if anything) so the round is
  // still graded, instead of dropping the candidate's work.
  useEffect(() => {
    if (timeLeft > 0) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!hasSubmittedRef.current) submitCode();
  }, [timeLeft, submitCode]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning || pending) return;
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
    } catch (err) {
      setRunResult({ stdout: "", stderr: err instanceof Error ? err.message : "Execution failed.", exit_code: 1 });
    } finally {
      setIsRunning(false);
    }
  }, [problemSlug, language, code, isRunning, pending]);

  const handleGrade = useCallback(() => {
    if (pending || grade) return;
    submitCode();
  }, [pending, grade, submitCode]);

  // The clock stops once the code is graded; a rejected submit (error frame)
  // leaves it running, so the deadline and Finish still come.
  useEffect(() => { if (grade) stopTimer(); }, [grade, stopTimer]);

  // Follow-ups: the server sends only how many there are, not their text.
  const lastFollowup = followups[followups.length - 1];
  const nextFollowup = followups.length + 1;
  const canAnswerFollowup = Boolean(grade) && nextFollowup <= (grade?.follow_up_count ?? 0)
    && (!lastFollowup || lastFollowup.next_followup_available);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const isLow = timeLeft > 0 && timeLeft < 120;
  const isGraded = !!grade;
  const isGrading = pending && !grade;

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
                disabled={isGraded || pending}
                onClick={() => selectLanguage(l.value)}
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
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <BookOpen size={11} />
            {showStatement ? "Hide" : "Problem"}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || pending}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
            Run
          </button>
          {/* Grade Code button */}
          <button
            onClick={handleGrade}
            disabled={pending || isGraded || isRunning || !code.trim()}
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
          {canAnswerFollowup && (
            <button
              onClick={() => { if (code.trim()) onSubmitFollowup(code, nextFollowup); }}
              disabled={pending || !code.trim()}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#2557a7] text-white rounded text-xs font-semibold hover:bg-[#1e4a8f] transition-all disabled:opacity-50"
            >
              Submit follow-up {nextFollowup} of {grade?.follow_up_count}
            </button>
          )}
          {(isGraded || timeLeft === 0) && (
            <button
              onClick={onFinish}
              disabled={pending}
              className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              Finish interview
            </button>
          )}
        </div>
      </div>

      {/* Body: statement + editor */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Problem statement — desktop only */}
        {showStatement && (
          <div className="flex max-h-[40%] flex-col shrink-0 overflow-y-auto border-b border-gray-200 lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r bg-white px-4 py-3 text-xs gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                    DIFF_COLORS[problem.difficulty] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>
              <h2 className="text-sm font-bold text-gray-900 mb-1.5">{problem.title}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{problem.statement}</p>
              {instructions && <p className="mt-2 text-gray-500">{instructions}</p>}
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
                    ) : grade ? (
                      <div className="space-y-1.5 p-1 text-xs text-gray-700">
                        <p className="text-sm font-bold text-gray-900">Score: {grade.score}/100</p>
                        {grade.summary && <p>{grade.summary}</p>}
                        {followups.map((f) => (
                          <p key={f.attempt_number}>
                            <span className="font-semibold">Follow-up {f.attempt_number}:</span> {f.score}/100{f.summary ? ` — ${f.summary}` : ""}
                          </p>
                        ))}
                        {canAnswerFollowup && (
                          <p className="text-gray-500">
                            Your interviewer has {grade.follow_up_count} follow-up{grade.follow_up_count === 1 ? "" : "s"} for this problem. Improve your code and submit follow-up {nextFollowup}.
                          </p>
                        )}
                      </div>
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
