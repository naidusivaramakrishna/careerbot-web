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
import type { CoverLetterResponse, CoverLetterTemplate } from "@/types/coverLetter";
import { useCoverLetterTemplates } from "@/hooks/useCoverLetterTemplates";
import { useDownloadCoverLetter } from "@/hooks/useDownloadCoverLetter";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import CoverLetterStatusPill from "./CoverLetterStatusPill";
import WarningBanner from "./WarningBanner";
import JDMatchMatrix from "./JDMatchMatrix";
import GroundingDetails from "./GroundingDetails";
import CopyButton from "./CopyButton";

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

function redirectToLoginForExport() {
  if (typeof window === "undefined") return;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ showLogin: "true" });
  if (currentPath && currentPath !== "/") {
    params.set("next", currentPath);
  }
  window.location.href = `/?${params.toString()}`;
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
  const metaByTemplate: Record<string, {
    accent: string;
    badge: string;
    previewBg: string;
    titleAlign: string;
    titleWidth: string;
  }> = {
    classic: {
      accent: "bg-slate-900",
      badge: "Executive",
      previewBg: "bg-stone-50",
      titleAlign: "",
      titleWidth: "w-11",
    },
    modern: {
      accent: "bg-teal-600",
      badge: "Signature",
      previewBg: "bg-cyan-50",
      titleAlign: "mx-auto",
      titleWidth: "w-9",
    },
    compact: {
      accent: "bg-blue-700",
      badge: "One-page",
      previewBg: "bg-blue-50",
      titleAlign: "",
      titleWidth: "w-12",
    },
  };
  const meta = metaByTemplate[template.template_id] ?? {
    accent: "bg-[#2557a7]",
    badge: "Template",
    previewBg: "bg-slate-50",
    titleAlign: "",
    titleWidth: "w-10",
  };
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
      <div className={["mb-3 flex h-32 items-center justify-center rounded-lg", meta.previewBg].join(" ")}>
        <div className="h-28 w-20 rounded border border-slate-200 bg-white p-2.5 shadow-sm">
          <div
            className={[
              "mb-2 h-1.5 rounded-full",
              meta.titleAlign,
              meta.titleWidth,
              meta.accent,
            ].join(" ")}
          />
          {isModern && (
            <div className={["mb-2 h-0.5 rounded-full", meta.accent].join(" ")} />
          )}
          <div className={["space-y-1", isCompact ? "space-y-0.5" : ""].join(" ")}>
            <div className="h-1 w-14 rounded bg-slate-300" />
            <div className="h-1 w-12 rounded bg-slate-200" />
            <div className="h-1 w-10 rounded bg-slate-200" />
          </div>
          <div className={["mt-2 space-y-1", isCompact ? "mt-1 space-y-0.5" : ""].join(" ")}>
            {Array.from({ length: isCompact ? 9 : 6 }).map((_, index) => (
              <div
                key={index}
                className={[
                  "h-1 rounded bg-slate-200",
                  index % 3 === 0 ? "w-14" : index % 3 === 1 ? "w-12" : "w-16",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="pr-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {meta.badge}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
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
      if (err.reason === "unauthorized") {
        toast.info("Sign in to export your cover letter.");
        redirectToLoginForExport();
        return;
      }
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
        className="rounded-2xl border border-slate-200 bg-white px-7 py-7 shadow-sm"
      >
        {cl ? (
          <div className="prose prose-base max-w-none leading-7 text-slate-950">
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
        defaultOpen={false}
      />
      <GroundingDetails grounding={letter.grounding} />

      {/* Bottom actions */}
      {letter.plain_text && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            {canDownload && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Export cover letter</h2>
                    <p className="text-sm text-slate-500">
                      Choose a professional layout and download a ready-to-send file.
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
