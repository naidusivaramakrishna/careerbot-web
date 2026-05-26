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
import type { CoverLetterResponse } from "@/types/coverLetter";
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

export default function CoverLetterView({
  letter,
  actions,
}: CoverLetterViewProps) {
  const titleLine =
    letter.metadata?.word_count !== undefined
      ? `${formatGeneratedFull(letter.created_at)} · ${letter.metadata.word_count} words`
      : formatGeneratedFull(letter.created_at);

  // Defensive: a `ready_to_review` / `needs_review` response with
  // null cover_letter would be a backend contract violation. The
  // response-model validator on the api side guards this, but the
  // FE renders a graceful empty body rather than crashing.
  const cl = letter.cover_letter;

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
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <CopyButton text={letter.plain_text} />
        </div>
      )}
    </article>
  );
}
