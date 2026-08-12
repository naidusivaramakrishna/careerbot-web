"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Pencil,
  Save,
  FileText,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CoverLetterResponse, CoverLetterTemplateId } from "@/types/coverLetter";
import { useCoverLetterTemplates } from "@/hooks/useCoverLetterTemplates";
import { useDownloadCoverLetter } from "@/hooks/useDownloadCoverLetter";
import { useUpdateCoverLetter } from "@/hooks/useUpdateCoverLetter";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import { CoverLetterTemplatePreview } from "./CoverLetterTemplatePreview";
import CoverLetterStatusPill from "./CoverLetterStatusPill";
import WarningBanner from "./WarningBanner";
import { getMatchBand, getMatchLabel, getMatchLabelTone, type MatchBand } from "../_utils/matchLabel";

export interface CoverLetterViewProps {
  letter: CoverLetterResponse;
  actions?: ReactNode;
}

type DisplayTemplateId =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "minimal"
  | "signature";

type IconComponent = ComponentType<{ className?: string }>;

type ReviewSuggestion = {
  title: string;
  description: string;
  icon: "growth" | "company";
};

const COVER_LETTER_TEMPLATE_PREF_KEY = "careerbot:cover-letter-template";

const displayTemplates: Array<{
  id: DisplayTemplateId;
  name: string;
  description: string;
  backendTemplateId: CoverLetterTemplateId;
  accent: string;
  badge: string;
  paper: string;
  previewStyle: "classic" | "modern" | "compact" | "executive" | "minimal" | "signature";
  bestFor: string;
}> = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional letterhead with recruiter-safe spacing.",
    backendTemplateId: "classic",
    accent: "bg-slate-900",
    badge: "Formal",
    paper: "bg-[#f6f3ef]",
    previewStyle: "classic",
    bestFor: "Finance, legal, operations",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold masthead with a clean contact row.",
    backendTemplateId: "modern",
    accent: "bg-[#0f8b8d]",
    badge: "Modern",
    paper: "bg-[#e9f7f6]",
    previewStyle: "modern",
    bestFor: "Tech, product, growth",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense one-page rhythm for fast applications.",
    backendTemplateId: "compact",
    accent: "bg-[#2557a7]",
    badge: "ATS-friendly",
    paper: "bg-[#edf4ff]",
    previewStyle: "compact",
    bestFor: "High-volume applications",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium side rail for senior roles.",
    backendTemplateId: "executive",
    accent: "bg-[#26324a]",
    badge: "Leadership",
    paper: "bg-[#eef1f7]",
    previewStyle: "executive",
    bestFor: "Senior leadership",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Open editorial whitespace and quiet type.",
    backendTemplateId: "minimal",
    accent: "bg-[#64748b]",
    badge: "Editorial",
    paper: "bg-[#f8fafc]",
    previewStyle: "minimal",
    bestFor: "Consulting, research",
  },
  {
    id: "signature",
    name: "Signature",
    description: "Monogram header with a signature finish.",
    backendTemplateId: "signature",
    accent: "bg-[#047857]",
    badge: "Personal",
    paper: "bg-[#ecfdf5]",
    previewStyle: "signature",
    bestFor: "Design, marketing, CS",
  },
];

const displayTemplateIds = new Set<DisplayTemplateId>(
  displayTemplates.map((template) => template.id),
);

function getStoredGeneratedLetterTemplate(letterId: string): DisplayTemplateId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(`${COVER_LETTER_TEMPLATE_PREF_KEY}:${letterId}`);
    return stored && displayTemplateIds.has(stored as DisplayTemplateId)
      ? (stored as DisplayTemplateId)
      : null;
  } catch {
    return null;
  }
}

function formatGeneratedFull(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function redirectToLoginForExport() {
  if (typeof window === "undefined") return;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ showLogin: "true" });
  if (currentPath && currentPath !== "/") {
    params.set("next", currentPath);
  }
  window.location.href = `/?${params.toString()}`;
}

export default function CoverLetterView({ letter, actions }: CoverLetterViewProps) {
  const { templates, isLoading: templatesLoading } = useCoverLetterTemplates();
  const [currentLetter, setCurrentLetter] = useState(letter);
  const [selectedDisplayTemplateId, setSelectedDisplayTemplateId] =
    useState<DisplayTemplateId>(() => getStoredGeneratedLetterTemplate(letter.letter_id) ?? "modern");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(letter.plain_text ?? "");
  const selectedDisplayTemplate =
    displayTemplates.find((template) => template.id === selectedDisplayTemplateId)
    ?? displayTemplates[1];
  const selectedCatalogTemplate = useMemo(
    () =>
      templates.find((template) => template.template_id === selectedDisplayTemplate.backendTemplateId),
    [selectedDisplayTemplate.backendTemplateId, templates],
  );

  const downloader = useDownloadCoverLetter({
    onSuccess: () => toast.success("Cover letter downloaded."),
    onError: (_letterId, _params, err) => {
      if (err.reason === "unauthorized") {
        toast.info("Sign in to export your cover letter.");
        redirectToLoginForExport();
        return;
      }
      toast.error(ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown);
    },
  });
  const updater = useUpdateCoverLetter({
    onSuccess: (_letterId, updatedLetter) => {
      setCurrentLetter(updatedLetter);
      setDraftText(updatedLetter.plain_text ?? "");
      toast.success("Cover letter saved.");
    },
    onNotFound: () => toast.error("Cover letter was not found."),
    onError: (_letterId, err) => {
      toast.error(ERROR_MESSAGES[err.reason] ?? "Could not save cover letter.");
    },
  });

  useEffect(() => {
    setCurrentLetter(letter);
    setDraftText(letter.plain_text ?? "");
    setIsEditing(false);
  }, [letter]);

  useEffect(() => {
    if (
      !displayTemplates.some((template) => template.id === selectedDisplayTemplateId)
      && templates.length > 0
    ) {
      setSelectedDisplayTemplateId("classic");
    }
  }, [selectedDisplayTemplateId, templates.length]);

  useEffect(() => {
    const storedTemplateId = getStoredGeneratedLetterTemplate(currentLetter.letter_id);
    if (storedTemplateId) {
      setSelectedDisplayTemplateId(storedTemplateId);
    }
  }, [currentLetter.letter_id]);

  const wordCount = currentLetter.metadata?.word_count ?? currentLetter.plain_text?.split(/\s+/).filter(Boolean).length ?? 0;
  const titleLine = `${formatGeneratedFull(currentLetter.created_at)} - ${wordCount} words`;
  const matched = currentLetter.jd_match_matrix.filter((entry) => entry.status === "met").length;
  const partial = currentLetter.jd_match_matrix.filter((entry) => entry.status === "partial").length;
  const totalRequirements = Math.max(currentLetter.jd_match_matrix.length, 1);
  const matchScore = Math.round(((matched + partial * 0.5) / totalRequirements) * 100);
  const evidenceScore = getEvidenceScore(currentLetter);
  const readinessScore = Math.max(42, Math.round((matchScore + evidenceScore + (currentLetter.status === "ready_to_review" ? 88 : 66)) / 3));
  const atsScore = clampScore(currentLetter.keyword_report?.keyword_coverage_pct ?? matchScore);
  const relevanceScore = clampScore(currentLetter.jd_match_summary?.jd_match_pct ?? matchScore);
  const readabilityScore = clampScore(currentLetter.keyword_report?.readability_score ?? readinessScore);
  const overallScore = Math.round((atsScore + relevanceScore + readabilityScore) / 3);
  const suggestions = getTopSuggestions(currentLetter);
  const supportsPdf = selectedCatalogTemplate?.supports.includes("pdf") ?? true;
  const supportsDocx = selectedCatalogTemplate?.supports.includes("docx") ?? true;
  const canDownload = currentLetter.status !== "failed" && !isEditing;

  async function handleDownload(format: "pdf" | "docx") {
    try {
      await downloader.mutate(currentLetter.letter_id, {
        format,
        template_id: selectedDisplayTemplate.backendTemplateId,
      });
    } catch {
      // Hook callback already handles user-facing error copy.
    }
  }

  function handleTemplateChange(templateId: DisplayTemplateId) {
    setSelectedDisplayTemplateId(templateId);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(`${COVER_LETTER_TEMPLATE_PREF_KEY}:${currentLetter.letter_id}`, templateId);
    } catch {
      // Template selection still works even if storage is unavailable.
    }
  }

  function handleStartEdit() {
    setDraftText(currentLetter.plain_text ?? "");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setDraftText(currentLetter.plain_text ?? "");
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    const nextText = draftText.trim();
    if (!nextText) {
      toast.error("Cover letter text cannot be empty.");
      return;
    }
    const updated = await updater.mutate(currentLetter.letter_id, {
      plain_text: nextText,
    });
    if (updated) {
      setIsEditing(false);
    }
  }

  return (
    <ReadyCoverLetterReview
      letter={currentLetter}
      actions={actions}
      selectedTemplate={selectedDisplayTemplate}
      selectedTemplateId={selectedDisplayTemplateId}
      onTemplateChange={handleTemplateChange}
      templatesOpen={templatesOpen}
      onTemplatesOpenChange={setTemplatesOpen}
      templatesLoading={templatesLoading}
      canDownload={canDownload}
      supportsPdf={supportsPdf}
      supportsDocx={supportsDocx}
      isDownloading={downloader.isLoading}
      onDownload={handleDownload}
      isEditing={isEditing}
      draftText={draftText}
      isSavingEdit={updater.isLoading}
      onDraftTextChange={setDraftText}
      onStartEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onSaveEdit={handleSaveEdit}
      wordCount={wordCount}
      titleLine={titleLine}
      atsScore={atsScore}
      relevanceScore={relevanceScore}
      readabilityScore={readabilityScore}
      overallScore={overallScore}
      suggestions={suggestions}
    />
  );
}

function ReadyCoverLetterReview({
  letter,
  actions,
  selectedTemplate,
  selectedTemplateId,
  onTemplateChange,
  templatesOpen,
  onTemplatesOpenChange,
  templatesLoading,
  canDownload,
  supportsPdf,
  supportsDocx,
  isDownloading,
  onDownload,
  isEditing,
  draftText,
  isSavingEdit,
  onDraftTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  wordCount,
  titleLine,
  atsScore,
  relevanceScore,
  readabilityScore,
  overallScore,
  suggestions,
}: {
  letter: CoverLetterResponse;
  actions?: ReactNode;
  selectedTemplate: (typeof displayTemplates)[number];
  selectedTemplateId: DisplayTemplateId;
  onTemplateChange: (id: DisplayTemplateId) => void;
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
  templatesLoading: boolean;
  canDownload: boolean;
  supportsPdf: boolean;
  supportsDocx: boolean;
  isDownloading: boolean;
  onDownload: (format: "pdf" | "docx") => void;
  isEditing: boolean;
  draftText: string;
  isSavingEdit: boolean;
  onDraftTextChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  wordCount: number;
  titleLine: string;
  atsScore: number;
  relevanceScore: number;
  readabilityScore: number;
  overallScore: number;
  suggestions: ReviewSuggestion[];
}) {
  return (
    <article className="relative space-y-4 2xl:space-y-5">
      <header className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)] backdrop-blur-sm 2xl:p-5">
        <StepReviewRail />
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between 2xl:mt-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-black tracking-tight text-[#070b33] 2xl:text-3xl">
                Your cover letter is ready!
              </h1>
              <CoverLetterStatusPill status={letter.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-[#344272]">
              Review, refine and export your personalized cover letter.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#263363] 2xl:px-4 2xl:text-sm">
                Template: <span className="text-[#2557a7]">{selectedTemplate.name}</span>
              </span>
              <button
                type="button"
                onClick={() => onTemplatesOpenChange(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cdd8ee] bg-white px-3 text-xs font-bold text-[#2557a7] transition hover:border-[#2557a7] hover:bg-blue-50 2xl:h-10 2xl:px-4 2xl:text-sm"
              >
                <FileText className="h-4 w-4" />
                Browse Templates
              </button>
              <span className="text-xs font-semibold text-slate-500">{titleLine}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#263363]">
              <ShieldCheck className="h-5 w-5" />
              Your data is secure
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Auto-saved
            </span>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>
      </header>

      {letter.status === "needs_review" && letter.warnings.length > 0 && (
        <WarningBanner warnings={letter.warnings} />
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_380px] 2xl:gap-5">
        <section className="self-start overflow-hidden rounded-lg border border-[#dfe6f5] bg-white shadow-[0_14px_38px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-3 border-b border-[#e8eef8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between 2xl:px-5 2xl:py-4">
            <div>
              <h2 className="text-lg font-black leading-tight text-[#070b33] 2xl:text-xl">Document Preview</h2>
              <p className="mt-1 text-sm font-medium text-[#344272]">
                {isEditing
                  ? `${draftText.split(/\s+/).filter(Boolean).length.toLocaleString()} words in draft`
                  : `${wordCount.toLocaleString()} words`}
              </p>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSavingEdit}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#dfe6f5] bg-white px-3 text-xs font-black text-[#263363] transition hover:border-[#2557a7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 2xl:h-10 2xl:px-4 2xl:text-sm"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  disabled={isSavingEdit}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-3 text-xs font-black text-white shadow-sm shadow-blue-200 transition hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:opacity-50 2xl:h-10 2xl:px-4 2xl:text-sm"
                >
                  {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSavingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartEdit}
                disabled={letter.status === "failed"}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#cdd8ee] bg-white px-3 text-xs font-black text-[#2557a7] transition hover:border-[#2557a7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 2xl:h-10 2xl:px-4 2xl:text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          <div className="bg-[#f6f8fc] p-4 lg:p-5 2xl:p-7">
            {isEditing ? (
              <LetterEditor
                value={draftText}
                onChange={onDraftTextChange}
                disabled={isSavingEdit}
              />
            ) : (
              <LetterPreviewPaper
                template={selectedTemplate}
                plainText={letter.plain_text}
                coverLetter={letter.cover_letter}
              />
            )}
          </div>
        </section>

        <aside className="space-y-4 self-start 2xl:space-y-5">
          <InsightsPanel
            overallScore={overallScore}
            atsScore={atsScore}
            relevanceScore={relevanceScore}
            readabilityScore={readabilityScore}
            suggestions={suggestions}
          />
          <ExportActions
            canDownload={canDownload}
            supportsPdf={supportsPdf}
            supportsDocx={supportsDocx}
            isDownloading={isDownloading}
            onDownload={onDownload}
            plainText={letter.plain_text}
          />
          <button
            type="button"
            onClick={() => onDownload("pdf")}
            disabled={!canDownload || !supportsPdf || isDownloading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:opacity-50 2xl:h-12 2xl:gap-3 2xl:px-6 2xl:text-base"
          >
            <Download className="h-5 w-5" />
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </aside>
      </section>

      <TemplateBrowseDrawer
        open={templatesOpen}
        onClose={() => onTemplatesOpenChange(false)}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={(id) => {
          onTemplateChange(id);
          onTemplatesOpenChange(false);
        }}
        templatesLoading={templatesLoading}
      />
    </article>
  );
}

function StepReviewRail() {
  const items = [
    { label: "Resume & Job", state: "done" },
    { label: "Review Letter", state: "active" },
    { label: "Export", state: "next" },
  ];
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-3 items-start gap-2">
      {items.map((item, index) => (
        <div key={item.label} className="relative flex flex-col items-center text-center">
          {index > 0 && <span className="absolute right-1/2 top-4 h-1 w-full bg-[#d8e1f0] 2xl:top-5" />}
          <span
            className={[
              "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black 2xl:h-11 2xl:w-11 2xl:text-sm",
              item.state === "active"
                ? "border-[#2557a7] bg-[#2557a7] text-white shadow-lg shadow-blue-200"
                : item.state === "done"
                  ? "border-[#2557a7] bg-white text-[#2557a7]"
                  : "border-[#cdd8ee] bg-white text-[#070b33]",
            ].join(" ")}
          >
            {item.state === "done" ? <CheckCircle2 className="h-4 w-4 2xl:h-5 2xl:w-5" /> : index + 1}
          </span>
          <span className={["mt-2 text-xs font-black", item.state === "active" ? "text-[#2557a7]" : "text-[#070b33]"].join(" ")}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel({
  overallScore,
  atsScore,
  relevanceScore,
  readabilityScore,
  suggestions,
}: {
  overallScore: number;
  atsScore: number;
  relevanceScore: number;
  readabilityScore: number;
  suggestions: ReviewSuggestion[];
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#dfe6f5] bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)] 2xl:p-5">
        <h2 className="text-lg font-black text-[#070b33]">Insights</h2>
        <div className="mt-4 flex items-center gap-3 2xl:mt-5 2xl:gap-4">
          <ScoreRing value={overallScore} tone={getRingTone(overallScore)} />
          <div>
            <p className="text-xl font-black text-[#070b33] 2xl:text-2xl">{overallScore}%</p>
            <p className={`text-sm font-bold ${getMatchLabelTone(overallScore)}`}>{getMatchLabel(overallScore)}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <ScoreRow label="ATS" value={atsScore} />
          <ScoreRow label="Relevance" value={relevanceScore} />
          <ScoreRow label="Readability" value={readabilityScore} />
        </div>
      </div>

      <div className="rounded-lg border border-[#dfe6f5] bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)] 2xl:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#070b33]">Top AI Suggestions</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-[#2557a7]">{suggestions.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.title} suggestion={suggestion} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Keyed on the FULL MatchBand union, not a subset. getMatchBand returns
// "excellent" for scores >= 85 (matchLabel.ts:20); a partial Record left that
// key missing, so RING_TONE_COLOR[tone] was undefined and the ring rendered
// conic-gradient(undefined ...) on exactly the best-scoring cover letters.
const RING_TONE_COLOR: Record<MatchBand, string> = {
  excellent: "#16a34a",
  good: "#22c55e",
  moderate: "#d97706",
  low: "#ea580c",
  "very-low": "#b91c1c",
};

function getRingTone(score: number): MatchBand {
  return getMatchBand(score);
}

function ScoreRing({ value, tone }: { value: number; tone: MatchBand }) {
  const color = RING_TONE_COLOR[tone];
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-black text-[#070b33] 2xl:h-20 2xl:w-20 2xl:text-xl"
      style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e8eef8 0deg)` }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white 2xl:h-14 2xl:w-14">{value}</span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-bold text-[#344272]">{label}</span>
      <span className="font-black text-[#070b33]">{value}</span>
    </div>
  );
}

function SuggestionCard({
  suggestion,
}: {
  suggestion: ReviewSuggestion;
}) {
  const Icon = suggestion.icon === "growth" ? Target : FileText;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e8eef8] bg-white p-3">
      <span className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-lg 2xl:h-10 2xl:w-10", suggestion.icon === "growth" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#2557a7]"].join(" ")}>
        <Icon className="h-4 w-4 2xl:h-5 2xl:w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#070b33]">{suggestion.title}</p>
        <p className="mt-1 text-xs font-medium text-[#344272]">{suggestion.description}</p>
      </div>
    </div>
  );
}

function ExportActions({
  canDownload,
  supportsPdf,
  supportsDocx,
  isDownloading,
  onDownload,
  plainText,
}: {
  canDownload: boolean;
  supportsPdf: boolean;
  supportsDocx: boolean;
  isDownloading: boolean;
  onDownload: (format: "pdf" | "docx") => void;
  plainText: string | null;
}) {
  return (
    <div className="rounded-lg border border-[#dfe6f5] bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)] 2xl:p-5">
      <h2 className="text-lg font-black text-[#070b33]">Export</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 2xl:gap-3">
        <ExportTile label="PDF" icon={Download} disabled={!canDownload || !supportsPdf || isDownloading} onClick={() => onDownload("pdf")} />
        <ExportTile label="DOCX" icon={FileText} disabled={!canDownload || !supportsDocx || isDownloading} onClick={() => onDownload("docx")} />
        <ExportTile
          label="Copy"
          icon={Copy}
          disabled={!plainText}
          onClick={() => {
            if (!plainText) return;
            navigator.clipboard?.writeText(plainText).then(
              () => toast.success("Copied cover letter."),
              () => toast.error("Could not copy cover letter."),
            );
          }}
        />
      </div>
    </div>
  );
}

function ExportTile({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: IconComponent;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-lg border border-[#dfe6f5] bg-white text-xs font-black text-[#070b33] transition hover:border-[#2557a7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 2xl:min-h-[86px] 2xl:text-sm"
    >
      <Icon className="h-5 w-5 text-[#2557a7] 2xl:h-6 2xl:w-6" />
      {label}
    </button>
  );
}

function TemplateBrowseDrawer({
  open,
  onClose,
  selectedTemplateId,
  onTemplateChange,
  templatesLoading,
}: {
  open: boolean;
  onClose: () => void;
  selectedTemplateId: DisplayTemplateId;
  onTemplateChange: (id: DisplayTemplateId) => void;
  templatesLoading: boolean;
}) {
  if (!open) return null;
  const grouped = displayTemplates.reduce<Record<string, Array<(typeof displayTemplates)[number]>>>((acc, template) => {
    const key = template.badge;
    acc[key] = acc[key] ? [...acc[key], template] : [template];
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20">
      <button type="button" aria-label="Close templates" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-[#dfe6f5] bg-white p-5 shadow-2xl 2xl:max-w-[620px] 2xl:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#070b33]">Browse Templates</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#070b33]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#dfe6f5] px-3 py-2 text-sm text-[#344272]">
          <Search className="h-4 w-4" />
          <span>{templatesLoading ? "Loading templates..." : "Search templates..."}</span>
        </div>
        <div className="mt-6 space-y-7">
          {Object.entries(grouped).map(([group, templates]) => (
            <section key={group}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-[#070b33]">{group}</h3>
                <span className="text-xs font-bold text-[#2557a7]">{templates.length}</span>
              </div>
              <div className="grid gap-3 2xl:gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateChange(template.id)}
                    className={[
                      "relative grid grid-cols-[112px_minmax(0,1fr)] gap-4 rounded-lg border p-3 text-left transition hover:border-[#2557a7] hover:bg-blue-50 2xl:grid-cols-[128px_minmax(0,1fr)]",
                      selectedTemplateId === template.id ? "border-[#2557a7] bg-blue-50 ring-1 ring-[#2557a7]" : "border-[#dfe6f5] bg-white",
                    ].join(" ")}
                  >
                    <MiniDoc template={template} />
                    <span className="min-w-0 pr-6">
                      <span className="block text-sm font-black text-[#070b33]">{template.name}</span>
                      <span className="mt-1 block text-xs font-black uppercase tracking-[0.14em] text-[#2557a7]">
                        {template.badge}
                      </span>
                      <span className="mt-2 block text-xs font-semibold leading-5 text-[#344272]">
                        {template.description}
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-slate-500">Best for {template.bestFor}</span>
                    </span>
                    {selectedTemplateId === template.id && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-[#2557a7]" />}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function LetterEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-blue-100 bg-white p-4 shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)]">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck
      className="min-h-[480px] w-full resize-y rounded-lg border border-[#dfe6f5] bg-[#fbfdff] px-4 py-4 text-[14px] font-medium leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2557a7] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 2xl:min-h-[620px] 2xl:px-5 2xl:py-5 2xl:text-[15px]"
        placeholder="Write your cover letter here..."
      />
    </div>
  );
}

function LetterPreviewPaper({
  template,
  plainText,
  coverLetter,
}: {
  template: (typeof displayTemplates)[number];
  plainText: string | null;
  coverLetter: CoverLetterResponse["cover_letter"];
}) {
  const body = plainText ? (
    <PlainTextLetterBody plainText={plainText} compact={template.previewStyle === "compact"} />
  ) : coverLetter ? (
    <LetterBody coverLetter={coverLetter} compact={template.previewStyle === "compact"} />
  ) : (
    <p className="text-sm italic text-slate-500">
      No letter body was produced.
    </p>
  );
  const header = getLetterPreviewHeader(plainText, coverLetter);

  if (template.previewStyle === "executive") {
    return (
      <div className="mx-auto grid max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)] lg:grid-cols-[150px_1fr] 2xl:grid-cols-[180px_1fr]">
        <aside className={["p-5 text-white 2xl:p-6", template.accent].join(" ")}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 text-sm font-black">
            {header.initials}
          </div>
          <div className="mt-8 space-y-2">
            <p className="text-sm font-black leading-5 text-white">{header.name}</p>
            {header.contact && <p className="text-xs font-semibold leading-5 text-white/75">{header.contact}</p>}
            <p className="text-xs font-semibold leading-5 text-white/65">Cover letter</p>
          </div>
          <div className="mt-10 space-y-2">
            {["Leadership", "Evidence", "Impact"].map((item) => (
              <div key={item} className="rounded-full border border-white/25 px-3 py-1 text-xs font-bold text-white/85">
                {item}
              </div>
            ))}
          </div>
        </aside>
        <div className="px-6 py-7 2xl:px-7 2xl:py-8">{body}</div>
      </div>
    );
  }

  if (template.previewStyle === "modern") {
    return (
      <div className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)]">
        <div className={["px-6 py-4 text-white 2xl:px-7 2xl:py-5", template.accent].join(" ")}>
          <p className="text-lg font-black leading-tight">{header.name}</p>
          {header.contact && <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/75">{header.contact}</p>}
        </div>
        <div className="px-6 py-7 2xl:px-8 2xl:py-9">{body}</div>
      </div>
    );
  }

  if (template.previewStyle === "compact") {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-blue-100 bg-white px-6 py-6 shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)] 2xl:px-7 2xl:py-7">
        <div className="mb-5 flex items-start justify-between gap-6 border-b border-blue-100 pb-4">
          <div>
            <p className="text-base font-black leading-tight text-slate-950">{header.name}</p>
            {header.contact && <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{header.contact}</p>}
          </div>
          <p className="text-right text-xs font-bold uppercase tracking-wide text-slate-400">Cover letter</p>
        </div>
        {body}
      </div>
    );
  }

  if (template.previewStyle === "minimal") {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white px-7 py-8 shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)] 2xl:px-10 2xl:py-10">
        <p className="mb-10 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Cover letter</p>
        <div className={["mb-8 h-0.5 w-20 rounded-full", template.accent].join(" ")} />
        {body}
      </div>
    );
  }

  if (template.previewStyle === "signature") {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-emerald-100 bg-white px-6 py-7 shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)] 2xl:px-8 2xl:py-9">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black leading-tight text-slate-950">{header.name}</p>
            {header.contact && <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{header.contact}</p>}
          </div>
          <div className={["flex h-14 w-14 items-center justify-center rounded-full text-sm font-black text-white", template.accent].join(" ")}>
            {header.initials}
          </div>
        </div>
        {body}
        <div className="mt-8 flex items-center gap-3">
          <p className="text-sm font-semibold text-slate-950">{header.name}</p>
          <div className="h-px flex-1 bg-emerald-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white px-6 py-7 shadow-[0_28px_70px_-22px_rgba(15,23,42,0.35),0_8px_18px_rgba(15,23,42,0.08)] 2xl:px-8 2xl:py-9">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-lg font-black leading-tight text-slate-950">{header.name}</p>
          {header.contact && <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{header.contact}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xs font-black text-slate-700">
          {header.initials}
        </div>
      </div>
      <div className={["mb-7 h-1 w-full rounded-full", template.accent].join(" ")} />
      {body}
    </div>
  );
}

function getLetterPreviewHeader(
  plainText: string | null,
  coverLetter: CoverLetterResponse["cover_letter"],
): { name: string; contact: string; initials: string } {
  const lines = (plainText ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const signature = coverLetter?.signature?.replace(/^(sincerely|regards|best regards),?\s*/i, "").trim();
  const firstPlainName = lines.find((line) => !/^dear\s+/i.test(line) && !line.includes("@") && line.length <= 80);
  const contact = lines.find((line) => line.includes("@") || /\d{6,}/.test(line)) ?? "";
  const name = signature || firstPlainName || "Candidate";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CL";

  return { name, contact, initials };
}

function PlainTextLetterBody({
  plainText,
  compact = false,
}: {
  plainText: string;
  compact?: boolean;
}) {
  const paragraphs = plainText
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={compact ? "space-y-3 text-[13.5px] font-medium leading-6 text-slate-950 2xl:text-[14px]" : "space-y-4 text-[14px] font-medium leading-7 text-slate-950 2xl:space-y-5 2xl:text-[15px] 2xl:leading-8"}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function LetterBody({
  coverLetter,
  compact = false,
}: {
  coverLetter: NonNullable<CoverLetterResponse["cover_letter"]>;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-3 text-[13.5px] font-medium leading-6 text-slate-950 2xl:text-[14px]" : "space-y-4 text-[14px] font-medium leading-7 text-slate-950 2xl:space-y-5 2xl:text-[15px] 2xl:leading-8"}>
      <p className="whitespace-pre-line">{coverLetter.greeting}</p>
      <p className="whitespace-pre-line">{coverLetter.opening}</p>
      {coverLetter.body.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
      <p className="whitespace-pre-line">{coverLetter.closing}</p>
      <p className="whitespace-pre-line">{coverLetter.signature}</p>
    </div>
  );
}

function MiniDoc({
  template,
  compact = false,
}: {
  template: (typeof displayTemplates)[number];
  compact?: boolean;
}) {
  return <CoverLetterTemplatePreview template={template} size={compact ? "compact" : "picker"} />;
}

function getEvidenceScore(letter: CoverLetterResponse): number {
  const high = letter.grounding.high_confidence_claims ?? 0;
  const low = letter.grounding.low_confidence_claims_used ?? 0;
  const total = Math.max(high + low, 1);
  const base = Math.round((high / total) * 100);
  if (letter.grounding.coverage_status === "low_confidence") return Math.min(base, 55);
  if (letter.grounding.coverage_status === "thin") return Math.min(base, 70);
  return Math.max(base, 76);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTopSuggestions(letter: CoverLetterResponse): ReviewSuggestion[] {
  const suggestions: ReviewSuggestion[] = [];
  const seen = new Set<string>();

  function addSuggestion(suggestion: ReviewSuggestion) {
    const key = suggestion.title.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    suggestions.push(suggestion);
  }

  letter.keyword_report?.safe_suggestions?.forEach((suggestion) => {
    const keyword = suggestion.keyword?.trim();
    const message = suggestion.message?.trim();
    if (!keyword && !message) return;
    addSuggestion({
      title: keyword ? `Add "${keyword}"` : "Improve keyword coverage",
      description: message || "Use this keyword naturally where it is supported by your resume.",
      icon: "growth",
    });
  });

  const missingKeywords = [
    ...(letter.keyword_report?.missing_required ?? []),
    ...(letter.keyword_report?.missing_preferred ?? []),
  ].filter(Boolean);

  if (missingKeywords.length > 0) {
    addSuggestion({
      title: "Improve ATS keyword coverage",
      description: `Consider adding ${missingKeywords.slice(0, 3).join(", ")} where your experience supports it.`,
      icon: "growth",
    });
  }

  const matchPct = letter.jd_match_summary?.jd_match_pct;
  if (matchPct == null || matchPct < 90) {
    addSuggestion({
      title: "Improve company alignment",
      description: "Tie your strongest resume evidence more directly to the role and company priorities.",
      icon: "company",
    });
  }

  if ((letter.grounding.high_confidence_claims ?? 0) < 3 || letter.grounding.coverage_status !== "sufficient") {
    addSuggestion({
      title: "Add measurable achievements",
      description: "Include specific outcomes, metrics, scope, or tools only when they are supported by your resume.",
      icon: "growth",
    });
  }

  addSuggestion({
    title: "Add measurable achievements",
    description: "Include specific outcomes, metrics, scope, or tools only when they are supported by your resume.",
    icon: "growth",
  });
  addSuggestion({
    title: "Improve company alignment",
    description: "Tie your strongest resume evidence more directly to the role and company priorities.",
    icon: "company",
  });

  return suggestions.slice(0, 2);
}
