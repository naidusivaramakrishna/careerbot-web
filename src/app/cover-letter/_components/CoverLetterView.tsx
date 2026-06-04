"use client";

/**
 * Shared shell for Screens C / D / F (E uses FailureCard directly).
 *
 * Renders the letter body + matrix + grounding, switching on status:
 *   ready_to_review → JD matrix EXPANDED by default
 *   needs_review   → WarningBanner at top + matrix COLLAPSED
 *   failed         → see FailureCard (caller branches before this)
 *
 * Spec: wireframes §5 + §6.
 */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import type { CoverLetterResponse } from "@/types/coverLetter";
import { useCoverLetterTemplates } from "@/hooks/useCoverLetterTemplates";
import { useDownloadCoverLetter } from "@/hooks/useDownloadCoverLetter";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import CoverLetterStatusPill from "./CoverLetterStatusPill";
import WarningBanner from "./WarningBanner";
import JDMatchMatrix from "./JDMatchMatrix";
import GroundingDetails from "./GroundingDetails";
import CopyButton from "./CopyButton";
import type { CoverLetterTemplate } from "@/types/coverLetter";

export interface CoverLetterViewProps {
  letter: CoverLetterResponse;
  /** Optional title-bar element (parent passes ⋯ menu / [Regenerate]
   *  / [Delete] etc); kept generic so list-page and detail-page
   *  reuse the same shell. */
  actions?: React.ReactNode;
}

/** Format the created_at ISO string for the header. */
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

function TemplatePreviewCard({
  template,
  selected,
  disabled,
  onSelect,
}: {
  template: CoverLetterTemplate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const accentByTemplate: Record<string, string> = {
    classic: "bg-slate-900",
    modern: "bg-teal-600",
    compact: "bg-blue-700",
  };
  const accent = accentByTemplate[template.template_id] ?? "bg-[#2557a7]";
  const isCompact = template.template_id === "compact";
  const isModern = template.template_id === "modern";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "group relative rounded-xl border bg-white p-3 text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2",
        selected
          ? "border-[#2557a7] shadow-md ring-1 ring-[#2557a7]"
          : "border-slate-200 hover:border-blue-200 hover:shadow-sm",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      {selected && (
        <CheckCircle2
          className="absolute right-2 top-2 h-4 w-4 text-[#2557a7]"
          aria-hidden="true"
        />
      )}
      <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-slate-50">
        <div className="h-24 w-16 rounded border border-slate-200 bg-white p-2 shadow-sm">
          <div
            className={[
              "mb-2 h-1.5 rounded-full",
              isModern ? "mx-auto w-8" : "w-10",
              accent,
            ].join(" ")}
          />
          <div className={["space-y-1", isCompact ? "space-y-0.5" : ""].join(" ")}>
            <div className="h-1 w-12 rounded bg-slate-300" />
            <div className="h-1 w-10 rounded bg-slate-200" />
            <div className="h-1 w-11 rounded bg-slate-200" />
          </div>
          <div className={["mt-2 space-y-1", isCompact ? "mt-1 space-y-0.5" : ""].join(" ")}>
            {Array.from({ length: isCompact ? 7 : 5 }).map((_, index) => (
              <div
                key={index}
                className={[
                  "h-1 rounded bg-slate-200",
                  index % 3 === 0 ? "w-12" : index % 3 === 1 ? "w-10" : "w-14",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="pr-4">
        <p className="text-sm font-semibold text-slate-900">{template.name}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {template.description}
        </p>
      </div>
    </button>
  );
}

export default function CoverLetterView({
  letter,
  actions,
}: CoverLetterViewProps) {
  const { templates, isLoading: templatesLoading } = useCoverLetterTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState("classic");
  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.template_id === selectedTemplateId)
      ?? templates.find((template) => template.is_default)
      ?? templates[0],
    [selectedTemplateId, templates],
  );
  const downloader = useDownloadCoverLetter({
    onSuccess: () => toast.success("Cover letter downloaded."),
    onError: (_letterId, _params, err) => {
      toast.error(ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown);
    },
  });
  const titleLine =
    letter.metadata?.word_count !== undefined
      ? `${formatGeneratedFull(letter.created_at)} · ${letter.metadata.word_count} words`
      : formatGeneratedFull(letter.created_at);

  // Defensive: a `ready_to_review` / `needs_review` response with
  // null cover_letter would be a backend contract violation. The
  // response-model validator on the api side guards this, but the
  // FE renders a graceful empty body rather than crashing.
  const cl = letter.cover_letter;
  const canDownload = letter.status !== "failed";
  const supportsPdf = selectedTemplate?.supports.includes("pdf") ?? false;
  const supportsDocx = selectedTemplate?.supports.includes("docx") ?? false;

  useEffect(() => {
    const defaultTemplate = templates.find((template) => template.is_default) ?? templates[0];
    if (
      defaultTemplate
      && !templates.some((template) => template.template_id === selectedTemplateId)
    ) {
      setSelectedTemplateId(defaultTemplate.template_id);
    }
  }, [selectedTemplateId, templates]);

  async function handleDownload(format: "pdf" | "docx") {
    if (!selectedTemplate) return;
    try {
      await downloader.mutate(letter.letter_id, {
        format,
        template_id: selectedTemplate.template_id,
      });
    } catch {
      // The hook's onError callback already shows the user-facing toast.
    }
  }

  return (
    <article className="space-y-4">
      {/* Header strip */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Cover Letter</h1>
            <CoverLetterStatusPill status={letter.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{titleLine}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Needs-review banner (sits ABOVE the body so the user reads
          warnings before the draft). */}
      {letter.status === "needs_review" && letter.warnings.length > 0 && (
        <WarningBanner warnings={letter.warnings} />
      )}

      {/* Letter body */}
      <section
        aria-label="Cover letter body"
        className="rounded-2xl border border-gray-200 bg-white p-6"
      >
        {cl ? (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line">{cl.greeting}</p>
            <p className="whitespace-pre-line">{cl.opening}</p>
            {cl.body.map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
            <p className="whitespace-pre-line">{cl.closing}</p>
            <p className="whitespace-pre-line">{cl.signature}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            (No letter body was produced.)
          </p>
        )}
      </section>

      {/* Matrix + grounding */}
      <JDMatchMatrix
        entries={letter.jd_match_matrix}
        defaultOpen={letter.status === "ready_to_review"}
      />
      <GroundingDetails grounding={letter.grounding} />

      {/* Bottom actions */}
      {letter.plain_text && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="space-y-4">
            {canDownload && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Choose a template</h2>
                    <p className="text-xs text-slate-500">
                      Pick a style, then download as PDF or DOCX.
                    </p>
                  </div>
                  {templatesLoading && (
                    <span className="text-xs font-medium text-slate-500">
                      Loading templates...
                    </span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {templates.map((template) => (
                    <TemplatePreviewCard
                      key={template.template_id}
                      template={template}
                      selected={selectedTemplate?.template_id === template.template_id}
                      disabled={templatesLoading || downloader.isLoading}
                      onSelect={() => setSelectedTemplateId(template.template_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-4">
              {canDownload && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDownload("pdf")}
                    disabled={!supportsPdf || downloader.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2557a7] hover:bg-[#1e4a94] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    {downloader.isLoading ? "Downloading..." : "Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownload("docx")}
                    disabled={!supportsDocx || downloader.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    DOCX
                  </button>
                </>
              )}
              <CopyButton text={letter.plain_text} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
