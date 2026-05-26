"use client";

/**
 * /cover-letter/new — the generate form (Screen B.1).
 *
 * Pure controlled component. Owns its form state + client-side
 * validation. On submit, builds a CoverLetterGenerateRequest and
 * hands it to the parent via `onSubmit`. NO generation logic here
 * — the parent (page.tsx) wires onSubmit → useGenerateCoverLetter
 * in WEB-3.2.
 *
 * Client-side validation matches backend `extra="forbid"`:
 *   - JD min 50 chars heuristic
 *   - candidate_note max 300 chars
 *   - min_words ≤ max_words (slider locks this; both 200–500)
 *   - we NEVER submit unknown fields
 *
 * Spec: wireframes §4.B1 + impl-blueprint §9 WEB-3.1.
 */
import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type {
  CoverLetterGenerateRequest,
  ResumeSchemaVersion,
} from "@/types/coverLetter";

export interface CoverLetterFormProps {
  /** The parsed resume to embed in the request (from useLatestParsedResume). */
  resume: Record<string, unknown>;
  resumeSchemaVersion: ResumeSchemaVersion;
  /** true while a submission is in flight; disables the submit button. */
  isSubmitting?: boolean;
  /** Called with a fully-built request body when the user submits. */
  onSubmit: (request: CoverLetterGenerateRequest) => void;
  /** Optional inline error from the api / hook layer (rendered above
   *  the submit button, NOT next to a field; field-level errors are
   *  resolved by the parent before re-rendering the form). */
  apiError?: string | null;
}

const MIN_JD_CHARS = 50;
const MAX_NOTE_CHARS = 300;
const MIN_WORDS_FLOOR = 200;
const MAX_WORDS_CEIL = 500;

export default function CoverLetterForm({
  resume,
  resumeSchemaVersion,
  isSubmitting = false,
  onSubmit,
  apiError = null,
}: CoverLetterFormProps) {
  // Required.
  const [jd, setJd] = useState("");
  // Optional details (collapsed by default).
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [includeContact, setIncludeContact] = useState(false);
  // Advanced (collapsed by default).
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  const [note, setNote] = useState("");

  // Field-level validation.
  const errors = useMemo(() => {
    const e: { jd?: string; note?: string; bounds?: string } = {};
    const trimmed = jd.trim();
    if (trimmed.length === 0) {
      e.jd = "Job description is required.";
    } else if (trimmed.length < MIN_JD_CHARS) {
      e.jd = `Please paste at least ${MIN_JD_CHARS} characters of the job description.`;
    }
    if (note.length > MAX_NOTE_CHARS) {
      e.note = `Note must be ${MAX_NOTE_CHARS} characters or fewer.`;
    }
    if (minWords > maxWords) {
      e.bounds = "Minimum words can't exceed maximum.";
    }
    return e;
  }, [jd, note, minWords, maxWords]);

  const hasErrors =
    !!errors.jd || !!errors.note || !!errors.bounds;

  const formId = useId();

  function buildRequest(): CoverLetterGenerateRequest {
    // Build application_context ONLY when the user typed something.
    // Empty optionals are NOT sent — backend treats missing as
    // null, and we'd rather send the smallest valid body.
    const appCtxFields = {
      ...(companyName.trim() && { company_name: companyName.trim() }),
      ...(roleTitle.trim() && { role_title: roleTitle.trim() }),
      ...(hiringManagerName.trim() && {
        hiring_manager_name: hiringManagerName.trim(),
      }),
      ...(signatureName.trim() && {
        candidate_signature_name: signatureName.trim(),
      }),
      ...(includeContact && { include_contact_details: true }),
    };
    const hasAppCtx = Object.keys(appCtxFields).length > 0;

    return {
      resume,
      resume_schema_version: resumeSchemaVersion,
      job_description: jd.trim(),
      ...(hasAppCtx && {
        application_context: {
          ...appCtxFields,
          source: "user" as const,
        },
      }),
      options: {
        tone: "professional",
        min_words: minWords,
        max_words: maxWords,
        ...(note.trim() && { candidate_note: note.trim() }),
        // SECURITY INVARIANT: ALWAYS false (api client also forces).
        include_debug_metadata: false,
      },
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors || isSubmitting) return;
    onSubmit(buildRequest());
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-6 space-y-5"
      noValidate
    >
      {/* Resume section — V1 uses the latest; picker is a V1.1 add. */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2">
          Resume
        </legend>
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm text-gray-700">
          Using your latest parsed resume
          <span className="text-gray-500"> (schema {resumeSchemaVersion})</span>
        </div>
      </fieldset>

      {/* JD textarea — required */}
      <div>
        <label
          htmlFor={`${formId}-jd`}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Job description <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${formId}-jd`}
          autoFocus
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={8}
          placeholder="Paste the JD here, or paste the job URL."
          aria-required="true"
          aria-invalid={!!errors.jd}
          aria-describedby={`${formId}-jd-count ${errors.jd ? `${formId}-jd-error` : ""}`}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:border-transparent disabled:opacity-50 resize-y"
        />
        <div className="flex justify-between mt-1">
          <p id={`${formId}-jd-count`} className="text-xs text-gray-500">
            {jd.length.toLocaleString()} characters
          </p>
          {errors.jd && (
            <p
              id={`${formId}-jd-error`}
              className="text-xs text-red-600"
              role="alert"
            >
              {errors.jd}
            </p>
          )}
        </div>
      </div>

      {/* Optional details — collapsible */}
      <CollapsibleSection
        label="Optional details"
        open={optionalOpen}
        onToggle={() => setOptionalOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <TextField
            id={`${formId}-company`}
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            placeholder="TestCo"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-role`}
            label="Role title"
            value={roleTitle}
            onChange={setRoleTitle}
            placeholder="Backend Engineer"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-hm`}
            label="Hiring manager"
            value={hiringManagerName}
            onChange={setHiringManagerName}
            placeholder="Jane Doe"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-sig`}
            label="Sign as"
            value={signatureName}
            onChange={setSignatureName}
            placeholder="Your name"
            disabled={isSubmitting}
          />
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeContact}
            onChange={(e) => setIncludeContact(e.target.checked)}
            disabled={isSubmitting}
            className="rounded border-gray-300 text-[#2257a7] focus:ring-[#2257a7] disabled:opacity-50"
          />
          Include my contact details at the top
        </label>
      </CollapsibleSection>

      {/* Advanced — collapsible */}
      <CollapsibleSection
        label="Advanced (defaults are usually right)"
        open={advancedOpen}
        onToggle={() => setAdvancedOpen((v) => !v)}
      >
        <div className="mt-3 space-y-3">
          <div>
            <label
              htmlFor={`${formId}-min`}
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Length: {minWords}–{maxWords} words
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id={`${formId}-min`}
                type="range"
                min={MIN_WORDS_FLOOR}
                max={MAX_WORDS_CEIL}
                step={10}
                value={minWords}
                onChange={(e) => setMinWords(Number(e.target.value))}
                disabled={isSubmitting}
                aria-label="Minimum word count"
                className="w-full disabled:opacity-50"
              />
              <input
                type="range"
                min={MIN_WORDS_FLOOR}
                max={MAX_WORDS_CEIL}
                step={10}
                value={maxWords}
                onChange={(e) => setMaxWords(Number(e.target.value))}
                disabled={isSubmitting}
                aria-label="Maximum word count"
                className="w-full disabled:opacity-50"
              />
            </div>
            {errors.bounds && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {errors.bounds}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor={`${formId}-note`}
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Note to writer (optional, {MAX_NOTE_CHARS} chars max)
            </label>
            <textarea
              id={`${formId}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={MAX_NOTE_CHARS}
              placeholder='e.g., "lean into my fintech background"'
              disabled={isSubmitting}
              aria-invalid={!!errors.note}
              aria-describedby={`${formId}-note-count`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:border-transparent disabled:opacity-50 resize-y"
            />
            <p
              id={`${formId}-note-count`}
              className="text-xs text-gray-500 mt-1"
            >
              {note.length}/{MAX_NOTE_CHARS}
            </p>
            {errors.note && (
              <p className="text-xs text-red-600" role="alert">
                {errors.note}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* API-level error (from the hook layer, NOT field validation) */}
      {apiError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg p-3"
        >
          {apiError}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={hasErrors || isSubmitting}
          className="bg-[#2257a7] hover:bg-[#184284] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:ring-offset-2"
        >
          {isSubmitting ? "Generating…" : "Generate letter"}
        </button>
      </div>
    </form>
  );
}

/* ── small subcomponents ─────────────────────────────────────── */

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2257a7] rounded"
      >
        {label}
        {open ? (
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
      {open && children}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:border-transparent disabled:opacity-50"
      />
    </div>
  );
}
