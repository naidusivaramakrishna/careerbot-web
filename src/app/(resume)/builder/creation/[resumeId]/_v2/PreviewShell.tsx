"use client";
import React, { useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import PreviewPanel from "../../_components/PreviewPanel";

export type PreviewShellProps = {
  resumeId: string;
  isContextRailOpen: boolean;
  onOpenContextRail: (tab: "templates" | "score" | "ai" | "jobs") => void;
  isEnhancedResume?: boolean;
  className?: string;
};

/**
 * Slim preview surface. PreviewPanel (existing) handles the actual template
 * rendering; this shell adds v2 chrome: zoom controls, focus-mode toggle,
 * "open templates" CTA, and page-of-N footer.
 */
export function PreviewShell({
  resumeId,
  isContextRailOpen,
  onOpenContextRail,
  isEnhancedResume,
  className,
}: PreviewShellProps) {
  const [zoom, setZoom] = useState(1);

  const fit = () => setZoom(1);
  const inc = () => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)));
  const dec = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));

  return (
    <section
      aria-label="Resume preview"
      className={cn(
        "relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface-sunken",
        className
      )}
    >
      {/* Top toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-line bg-white/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live preview
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-white p-0.5 shadow-sm">
          <button
            onClick={dec}
            aria-label="Zoom out"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 bv2-ring-focus"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums text-ink-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={inc}
            aria-label="Zoom in"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 bv2-ring-focus"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-line" />
          <button
            onClick={fit}
            aria-label="Reset zoom"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 bv2-ring-focus"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isContextRailOpen ? (
          <button
            onClick={() => onOpenContextRail("templates")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-[12px] font-semibold text-ink-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-700 bv2-ring-focus"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Templates
          </button>
        ) : (
          <span className="text-[11px] text-ink-400">Panel open</span>
        )}
      </div>

      {/* Document */}
      <div className="bv2-scroll flex-1 overflow-auto">
        <div
          className="mx-auto py-6 transition-transform"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {/* Drop-shadow paper to give a premium "document on a desk" feel */}
          <div className="mx-auto w-full max-w-[840px] rounded-md bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)]">
            <PreviewPanel
              resumeId={resumeId}
              isTemplateSidebarOpen={isContextRailOpen}
              onTabClick={(tab: string) => {
                const map: Record<string, "templates" | "score" | "jobs"> = {
                  Templates: "templates",
                  Score: "score",
                  "Job Match": "jobs",
                };
                const dest = map[tab] ?? "templates";
                onOpenContextRail(dest);
              }}
              isEnhancedResume={isEnhancedResume}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
