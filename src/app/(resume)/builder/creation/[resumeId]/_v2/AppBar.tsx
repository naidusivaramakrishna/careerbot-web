"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  FileType2,
  Linkedin,
  PanelRightOpen,
  Redo2,
  Share2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IconButton,
  InlineTitleEdit,
  Kbd,
  Popover,
  SaveStatus,
  ScoreChip,
  Tooltip,
  type SaveState,
} from "./_ui";

export type AppBarProps = {
  title: string;
  onTitleChange: (next: string) => void;
  saveState: SaveState;
  onRetrySave?: () => void;
  onResolveConflict?: () => void;
  atsScore: number | null;
  atsDelta?: number;
  onScoreClick: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onTogglePreview?: () => void;
  isPreviewFocus?: boolean;
  onDownload: (format: "pdf" | "docx" | "linkedin") => void;
  onShare?: () => void;
  isEnhanced?: boolean;
  fileNameBase?: string;
};

export function AppBar({
  title,
  onTitleChange,
  saveState,
  onRetrySave,
  onResolveConflict,
  atsScore,
  atsDelta,
  onScoreClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onTogglePreview,
  isPreviewFocus,
  onDownload,
  onShare,
  isEnhanced,
  fileNameBase,
}: AppBarProps) {
  const router = useRouter();
  const dlBtnRef = useRef<HTMLButtonElement>(null);
  const [dlOpen, setDlOpen] = useState(false);

  const goBack = () => {
    try {
      localStorage.removeItem("resumeData");
    } catch {}
    router.push(`/builder/start/list?refresh=${Date.now()}`);
    router.refresh();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-line bg-white/90 backdrop-blur",
        "supports-[backdrop-filter]:bg-white/75"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-2 px-4 sm:px-5">
        {/* Left cluster */}
        <button
          onClick={goBack}
          aria-label="Back to resumes"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 bv2-ring-focus"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="hidden h-6 w-px bg-line sm:block" />

        <div className="flex min-w-0 items-center gap-2">
          <BrandMark isEnhanced={isEnhanced} />
          <InlineTitleEdit value={title} onChange={onTitleChange} />
        </div>

        {/* Center / spacer */}
        <div className="mx-2 hidden h-6 w-px bg-line lg:block" />

        <div className="ml-1 hidden items-center gap-3 lg:flex">
          <SaveStatus
            state={saveState}
            onRetry={onRetrySave}
            onResolveConflict={onResolveConflict}
          />
        </div>

        <div className="flex-1" />

        {/* Right cluster */}
        <ScoreChip
          score={atsScore}
          delta={atsDelta}
          onClick={onScoreClick}
          className="hidden md:inline-flex"
        />

        <div className="mx-1 hidden h-6 w-px bg-line md:block" />

        <Tooltip
          content={
            <span className="inline-flex items-center gap-2">
              Undo <Kbd>⌘</Kbd>
              <Kbd>Z</Kbd>
            </span>
          }
        >
          <button
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 disabled:opacity-40 disabled:cursor-not-allowed md:inline-flex bv2-ring-focus"
          >
            <Undo2 className="h-[18px] w-[18px]" />
          </button>
        </Tooltip>

        <Tooltip
          content={
            <span className="inline-flex items-center gap-2">
              Redo <Kbd>⌘</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>Z</Kbd>
            </span>
          }
        >
          <button
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-surface-sunken hover:text-ink-800 disabled:opacity-40 disabled:cursor-not-allowed md:inline-flex bv2-ring-focus"
          >
            <Redo2 className="h-[18px] w-[18px]" />
          </button>
        </Tooltip>

        {onTogglePreview ? (
          <IconButton
            label={isPreviewFocus ? "Show editor" : "Focus preview"}
            onClick={onTogglePreview}
            active={isPreviewFocus}
            className="hidden md:inline-flex"
          >
            <PanelRightOpen className="h-[18px] w-[18px]" />
          </IconButton>
        ) : null}

        <button
          ref={dlBtnRef}
          onClick={() => setDlOpen((v) => !v)}
          className={cn(
            "ml-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-500 px-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] bv2-ring-focus",
            saveState.kind === "dirty" && "opacity-90"
          )}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </button>

        {onShare ? (
          <IconButton
            label="Share link"
            onClick={onShare}
            className="hidden md:inline-flex"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </IconButton>
        ) : null}
      </div>

      {/* Save status row (mobile / tablet) */}
      <div className="border-t border-line bg-surface-muted/60 px-4 py-1.5 lg:hidden">
        <SaveStatus
          state={saveState}
          onRetry={onRetrySave}
          onResolveConflict={onResolveConflict}
        />
      </div>

      {/* Download popover */}
      <Popover
        open={dlOpen}
        onClose={() => setDlOpen(false)}
        anchorRef={dlBtnRef}
        align="end"
      >
        <DownloadMenu
          fileNameBase={fileNameBase ?? title}
          disabled={saveState.kind === "dirty" || saveState.kind === "saving"}
          onPick={(fmt) => {
            setDlOpen(false);
            onDownload(fmt);
          }}
        />
      </Popover>
    </header>
  );
}

function BrandMark({ isEnhanced }: { isEnhanced?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md text-white shadow-sm",
          isEnhanced
            ? "bg-gradient-to-br from-accent-500 to-brand-600"
            : "bg-gradient-to-br from-brand-500 to-brand-700"
        )}
      >
        {isEnhanced ? (
          <Sparkles className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
      </div>
      <span className="hidden text-[11px] font-bold uppercase tracking-wider text-ink-500 sm:inline">
        {isEnhanced ? "Enhancer" : "Builder"}
      </span>
    </div>
  );
}

function DownloadMenu({
  fileNameBase,
  disabled,
  onPick,
}: {
  fileNameBase: string;
  disabled?: boolean;
  onPick: (fmt: "pdf" | "docx" | "linkedin") => void;
}) {
  const items: {
    fmt: "pdf" | "docx" | "linkedin";
    icon: React.ReactNode;
    label: string;
    note: string;
    recommended?: boolean;
  }[] = [
    {
      fmt: "pdf",
      icon: <FileText className="h-4 w-4" />,
      label: "PDF",
      note: "Best for applications",
      recommended: true,
    },
    {
      fmt: "docx",
      icon: <FileType2 className="h-4 w-4" />,
      label: "Word (.docx)",
      note: "Editable in MS Word",
    },
    {
      fmt: "linkedin",
      icon: <Linkedin className="h-4 w-4" />,
      label: "LinkedIn JSON",
      note: "Import to LinkedIn",
    },
  ];

  return (
    <div className="w-[280px] p-1.5">
      <div className="px-2.5 pb-1.5 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
          Export as
        </p>
      </div>
      {items.map((it) => (
        <button
          key={it.fmt}
          disabled={disabled}
          onClick={() => onPick(it.fmt)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
            "hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-sunken text-ink-700 group-hover:bg-white group-hover:text-brand-600">
            {it.icon}
          </span>
          <span className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-800">
              {it.label}
              {it.recommended ? (
                <span className="rounded-sm bg-emerald-100 px-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  Recommended
                </span>
              ) : null}
            </span>
            <span className="text-[11px] text-ink-500">{it.note}</span>
          </span>
        </button>
      ))}
      <div className="mt-1 border-t border-line px-2.5 py-2">
        <p className="truncate text-[11px] text-ink-500">
          File: <span className="font-medium text-ink-700">{slug(fileNameBase)}</span>
        </p>
        {disabled ? (
          <p className="mt-1 text-[11px] text-amber-700">
            Saving changes first…
          </p>
        ) : null}
      </div>
    </div>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
