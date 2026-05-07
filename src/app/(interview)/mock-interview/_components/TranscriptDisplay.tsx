"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  duration?: number;
  fillerCount?: number;
  keyPointsHit?: string[];
}

export default function TranscriptDisplay({
  transcript,
  duration,
  fillerCount = 0,
  keyPointsHit = [],
}: TranscriptDisplayProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedTranscript = transcript.replace(
    /\b(umm|uhh|basically|you know|actually|like|so|I mean)\b/gi,
    (m) => `<mark class="bg-gray-200 text-gray-700 rounded px-0.5">${m}</mark>`
  );

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
      role="region"
      aria-label="Answer transcript"
    >
      {/* ── Header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        aria-expanded={expanded}
        aria-controls="transcript-body"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={14} className="text-gray-500" />
          </div>
          <span className="text-sm font-bold text-gray-800">Your Transcript</span>
          {duration !== undefined && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {duration.toFixed(0)}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all"
            aria-label="Copy transcript"
          >
            {copied
              ? <Check size={13} className="text-[#2557a7]" />
              : <Copy size={13} className="text-gray-400" />
            }
          </button>
          {expanded
            ? <ChevronUp size={15} className="text-[#2557a7]" />
            : <ChevronDown size={15} className="text-gray-400" />
          }
        </div>
      </div>

      {/* ── Body ── */}
      {expanded && (
        <div
          id="transcript-body"
          className="px-4 pb-4 border-t border-gray-100"
          role="log"
          aria-live="polite"
          aria-label="Transcript content"
        >
          {/* Stat badges */}
          <div className="flex flex-wrap gap-2 py-2.5 mb-2">
            {fillerCount > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-gray-100 text-gray-600 border-gray-200">
                {fillerCount} filler word{fillerCount > 1 ? "s" : ""}
              </span>
            )}
            {fillerCount === 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[#2557a7]/5 text-[#2557a7] border-[#2557a7]/15">
                No filler words ✓
              </span>
            )}
            {keyPointsHit.length > 0 && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-[#2557a7]/5 text-[#2557a7] border-[#2557a7]/15">
                {keyPointsHit.length} key point{keyPointsHit.length > 1 ? "s" : ""} covered
              </span>
            )}
          </div>

          {/* Transcript text */}
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedTranscript }}
            />
          </div>

          {fillerCount > 0 && (
            <p className="text-[11px] text-gray-500 mt-2.5 leading-relaxed">
              Highlighted words = fillers. Try to replace them in your next attempt.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
