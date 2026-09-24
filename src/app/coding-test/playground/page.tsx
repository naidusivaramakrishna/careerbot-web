'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, ChevronDown, ChevronUp, Loader2, Play, RotateCw, Terminal,
} from 'lucide-react';
import { executeCode, pollExecuteResult, RunApiError } from '../_lib/runApi';
import { streamSse } from '../_lib/streamSse';
import type { CodingTestLanguage } from '../_lib/types';
import { LANGUAGES } from '../_lib/ui';
import type { CodeEditorProps } from '../_components/CodeEditor';

const CodeEditor = dynamic<CodeEditorProps>(
  () => import('../_components/CodeEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
        Loading editor…
      </div>
    ),
  },
);

const STARTER: Record<CodingTestLanguage, string> = {
  python: 'print("Hello, World!")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  c: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
};

type RunState = 'idle' | 'queued' | 'running' | 'done' | 'error';
type OutputLine = { type: 'stdout' | 'stderr'; text: string };

function exitBadgeClass(code: number | null): string {
  if (code === null) return 'bg-slate-700 text-slate-300';
  return code === 0
    ? 'bg-emerald-900/60 text-emerald-400'
    : 'bg-rose-900/60 text-rose-400';
}

export default function PlaygroundPage() {
  const [language, setLanguage] = useState<CodingTestLanguage>('python');
  const [code, setCode] = useState(STARTER.python);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [wallTimeMs, setWallTimeMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusLabel, setStatusLabel] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleLanguageChange = (lang: CodingTestLanguage) => {
    if (code !== STARTER[language]) {
      if (!confirm('Switching languages will discard your code. Continue?')) return;
    }
    setLanguage(lang);
    setCode(STARTER[lang]);
  };

  const clearOutput = () => {
    setOutputLines([]);
    setRunState('idle');
    setExitCode(null);
    setWallTimeMs(null);
    setErrorMessage('');
    setStatusLabel('');
  };

  const handleRun = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOutputLines([]);
    setExitCode(null);
    setWallTimeMs(null);
    setErrorMessage('');
    setRunState('queued');
    setStatusLabel('Queued…');

    let queued;
    try {
      queued = await executeCode(language, code, stdin);
    } catch (err) {
      setErrorMessage(err instanceof RunApiError ? err.message : 'Failed to start execution.');
      setRunState('error');
      return;
    }

    setRunState('running');
    setStatusLabel('Running…');

    const applyPollFallback = async () => {
      try {
        const record = await pollExecuteResult(queued.poll_url, controller.signal);
        if (controller.signal.aborted) return;
        if (record.stdout) {
          setOutputLines((prev) => [
            ...prev,
            ...record.stdout!.split('\n').map((text) => ({ type: 'stdout' as const, text })),
          ]);
        }
        if (record.stderr) {
          setOutputLines((prev) => [
            ...prev,
            ...record.stderr!.split('\n').map((text) => ({ type: 'stderr' as const, text })),
          ]);
        }
        if (record.status === 'done') {
          setExitCode(record.exit_code ?? null);
          setWallTimeMs(record.wall_time_ms ?? null);
          setRunState('done');
        } else {
          setErrorMessage(record.error ?? 'Execution failed.');
          setRunState('error');
        }
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage('Stream disconnected unexpectedly.');
          setRunState('error');
        }
      }
    };

    let receivedTerminal = false;
    try {
      for await (const event of streamSse(queued.stream_url, controller.signal)) {
        if (controller.signal.aborted) break;
        switch (event.type) {
          case 'status':
            setStatusLabel(event.status === 'queued' ? 'Queued…' : 'Running…');
            break;
          case 'stdout':
            setOutputLines((prev) => [...prev, { type: 'stdout', text: event.line }]);
            break;
          case 'stderr':
            setOutputLines((prev) => [...prev, { type: 'stderr', text: event.line }]);
            break;
          case 'done':
            receivedTerminal = true;
            setExitCode(event.exit_code);
            setWallTimeMs(event.wall_time_ms);
            setRunState('done');
            break;
          case 'error':
            receivedTerminal = true;
            setErrorMessage(event.error);
            setRunState('error');
            break;
        }
      }
      if (!controller.signal.aborted && !receivedTerminal) {
        await applyPollFallback();
      }
    } catch {
      if (!controller.signal.aborted) {
        await applyPollFallback();
      }
    }
  }, [language, code, stdin]);

  const isRunning = runState === 'queued' || runState === 'running';
  const hasOutput = outputLines.length > 0 || runState === 'done' || runState === 'error';

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-slate-100">

      {/* ── Top nav ── */}
      <nav className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/coding-test"
            className="flex items-center gap-1 text-sm font-medium text-slate-400 transition hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-slate-600" aria-hidden />
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
            <Terminal className="h-4 w-4 text-indigo-400" aria-hidden />
            Code Playground
          </div>
          <div className="h-4 w-px bg-slate-600" aria-hidden />
          {/* Language selector (previously inside CodeEditor header) */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as CodingTestLanguage)}
            className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 focus:outline-none hover:border-slate-400"
            aria-label="Select language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {statusLabel}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden />
              Run
            </>
          )}
        </button>
      </nav>

      {/* ── Editor + panels ── */}
      <div className="flex min-h-0 flex-1 flex-col">

        {/* Monaco editor — fills remaining space */}
        <div className="min-h-0 flex-1">
          <CodeEditor
            language={language}
            value={code}
            onChange={setCode}
            onCtrlEnter={handleRun}
          />
        </div>

        {/* ── Stdin (collapsible) ── */}
        <div className="shrink-0 border-t border-slate-700 bg-slate-800">
          <button
            type="button"
            onClick={() => setShowStdin((s) => !s)}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-200"
          >
            {showStdin
              ? <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              : <ChevronUp className="h-3.5 w-3.5" aria-hidden />}
            Stdin (standard input)
          </button>
          {showStdin && (
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter program input here…"
              rows={3}
              className="w-full resize-none border-t border-slate-700 bg-slate-900 px-4 py-2 font-mono text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
            />
          )}
        </div>

        {/* ── Output panel ── */}
        <div
          className="flex shrink-0 flex-col border-t border-slate-700 bg-slate-950"
          style={{ height: 200 }}
        >
          {/* Output header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-4 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Output
            </span>
            <div className="flex items-center gap-3">
              {runState === 'done' && exitCode !== null && (
                <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-medium ${exitBadgeClass(exitCode)}`}>
                  exit {exitCode}
                </span>
              )}
              {wallTimeMs !== null && (
                <span className="font-mono text-[11px] text-slate-500">
                  {wallTimeMs} ms
                </span>
              )}
              {hasOutput && (
                <button
                  type="button"
                  onClick={clearOutput}
                  title="Clear output"
                  className="text-slate-600 transition hover:text-slate-400"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Output body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 font-mono text-xs">
            {runState === 'idle' && outputLines.length === 0 && (
              <p className="select-none text-slate-600">
                Run your code to see output here.
              </p>
            )}
            {isRunning && outputLines.length === 0 && (
              <p className="text-slate-500">{statusLabel}</p>
            )}
            {outputLines.map((line, i) => (
              <div
                key={i}
                className={line.type === 'stderr' ? 'text-rose-400' : 'text-slate-200'}
              >
                {line.text || ' '}
              </div>
            ))}
            {runState === 'error' && (
              <p className="text-rose-500">{errorMessage}</p>
            )}
            <div ref={outputEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
