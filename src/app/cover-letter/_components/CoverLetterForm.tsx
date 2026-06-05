'use client';

import { useId, useMemo, useState } from 'react';
import {
  ChevronDown,
  CheckCircle,
  FileText,
  Sparkles,
  Settings2,
  UserCircle,
} from 'lucide-react';
import type {
  CoverLetterFormSubmit,
} from '@/types/coverLetter';

export interface CoverLetterFormProps {
  isSubmitting?: boolean;
  onSubmit: (request: CoverLetterFormSubmit) => void;
  apiError?: string | null;
  validationErrors?: Array<{ field: string; message: string }>;
}

const MIN_JD_CHARS = 50;
const MAX_NOTE_CHARS = 300;
const MIN_WORDS_FLOOR = 200;
const MAX_WORDS_CEIL = 500;

export default function CoverLetterForm({
  isSubmitting = false,
  onSubmit,
  apiError = null,
  validationErrors = [],
}: CoverLetterFormProps) {
  const [jd, setJd] = useState('');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [hiringManagerName, setHiringManagerName] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [includeContact, setIncludeContact] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  const [note, setNote] = useState('');

  const errors = useMemo(() => {
    const e: { jd?: string; note?: string; bounds?: string } = {};
    const trimmed = jd.trim();
    if (trimmed.length === 0) {
      e.jd = 'Job description is required.';
    } else if (trimmed.length < MIN_JD_CHARS) {
      e.jd = `Paste at least ${MIN_JD_CHARS} characters of the job description.`;
    }
    if (note.length > MAX_NOTE_CHARS) {
      e.note = `Note must be ${MAX_NOTE_CHARS} characters or fewer.`;
    }
    if (minWords > maxWords) {
      e.bounds = "Minimum words can't exceed maximum.";
    }
    return e;
  }, [jd, note, minWords, maxWords]);

  const hasErrors = !!errors.jd || !!errors.note || !!errors.bounds;
  const formId = useId();

  function buildRequest(): CoverLetterFormSubmit {
    const appCtxFields = {
      ...(companyName.trim() && { company_name: companyName.trim() }),
      ...(roleTitle.trim() && { role_title: roleTitle.trim() }),
      ...(hiringManagerName.trim() && { hiring_manager_name: hiringManagerName.trim() }),
      ...(signatureName.trim() && { candidate_signature_name: signatureName.trim() }),
      ...(includeContact && { include_contact_details: true }),
    };
    const hasAppCtx = Object.keys(appCtxFields).length > 0;

    return {
      job_description: jd.trim(),
      ...(hasAppCtx && {
        application_context: { ...appCtxFields, source: 'user' as const },
      }),
      options: {
        tone: 'professional',
        min_words: minWords,
        max_words: maxWords,
        ...(note.trim() && { candidate_note: note.trim() }),
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
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">

      {/* ── 1. Resume ─────────────────────────────────────── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-lg border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <FileText className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Resume ready</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Using your latest parsed resume for this letter
          </p>
        </div>
        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      </div>

      {/* ── 2. Job Description ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <label htmlFor={`${formId}-jd`} className="block mb-1">
          <span className="text-sm font-semibold text-slate-800">Job Description</span>
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Paste the full job posting. More detail = better letter.
        </p>
        <textarea
          id={`${formId}-jd`}
          autoFocus
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={9}
          placeholder="Paste the job description here…"
          aria-required="true"
          aria-invalid={!!errors.jd}
          aria-describedby={`${formId}-jd-count ${errors.jd ? `${formId}-jd-error` : ''}`}
          disabled={isSubmitting}
          className={[
            'w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50',
            'focus:outline-none focus:ring-2 focus:ring-[#2557a7]/40 focus:border-[#2557a7] focus:bg-white',
            'disabled:opacity-50 resize-y transition-colors',
            errors.jd && jd.length > 0
              ? 'border-red-300 bg-red-50/30'
              : 'border-slate-200',
          ].join(' ')}
        />
        <div className="flex justify-between items-center mt-2">
          <p id={`${formId}-jd-count`} className="text-xs text-slate-400">
            {jd.length.toLocaleString()} characters
            {jd.length >= MIN_JD_CHARS && (
              <span className="ml-1.5 text-emerald-600">✓ Ready</span>
            )}
          </p>
          {errors.jd && jd.length > 0 && (
            <p id={`${formId}-jd-error`} className="text-xs text-red-600" role="alert">
              {errors.jd}
            </p>
          )}
        </div>
      </div>

      {/* ── 3. Optional details — collapsible ────────────── */}
      <CollapsibleCard
        icon={<UserCircle className="w-4 h-4 text-slate-400" />}
        label="Optional details"
        hint="Company, role, hiring manager"
        open={optionalOpen}
        onToggle={() => setOptionalOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            id={`${formId}-company`}
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            placeholder="e.g. TCS, Infosys"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-role`}
            label="Role title"
            value={roleTitle}
            onChange={setRoleTitle}
            placeholder="e.g. Backend Engineer"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-hm`}
            label="Hiring manager"
            value={hiringManagerName}
            onChange={setHiringManagerName}
            placeholder="e.g. Jane Doe"
            disabled={isSubmitting}
          />
          <TextField
            id={`${formId}-sig`}
            label="Sign as"
            value={signatureName}
            onChange={setSignatureName}
            placeholder="Your full name"
            disabled={isSubmitting}
          />
        </div>
        <label className="flex items-center gap-2.5 mt-4 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeContact}
            onChange={(e) => setIncludeContact(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-slate-300 text-[#2557a7] focus:ring-[#2557a7] disabled:opacity-50"
          />
          Include my contact details at the top of the letter
        </label>
      </CollapsibleCard>

      {/* ── 4. Advanced — collapsible ─────────────────────── */}
      <CollapsibleCard
        icon={<Settings2 className="w-4 h-4 text-slate-400" />}
        label="Advanced settings"
        hint="Length and custom notes (defaults are fine)"
        open={advancedOpen}
        onToggle={() => setAdvancedOpen((v) => !v)}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">
              Letter length: <span className="text-[#2557a7] font-semibold">{minWords}–{maxWords} words</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Minimum</p>
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
                  className="w-full accent-[#2557a7] disabled:opacity-50"
                />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Maximum</p>
                <input
                  type="range"
                  min={MIN_WORDS_FLOOR}
                  max={MAX_WORDS_CEIL}
                  step={10}
                  value={maxWords}
                  onChange={(e) => setMaxWords(Number(e.target.value))}
                  disabled={isSubmitting}
                  aria-label="Maximum word count"
                  className="w-full accent-[#2557a7] disabled:opacity-50"
                />
              </div>
            </div>
            {errors.bounds && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {errors.bounds}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-note`} className="block text-xs font-medium text-slate-600 mb-1.5">
              Note to AI writer
              <span className="ml-1 font-normal text-slate-400">(optional, up to {MAX_NOTE_CHARS} chars)</span>
            </label>
            <textarea
              id={`${formId}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={MAX_NOTE_CHARS}
              placeholder='e.g. "Lean into my fintech background and leadership experience"'
              disabled={isSubmitting}
              aria-invalid={!!errors.note}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2557a7]/40 focus:border-[#2557a7] focus:bg-white disabled:opacity-50 resize-y transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1">
              {note.length}/{MAX_NOTE_CHARS}
            </p>
            {errors.note && (
              <p className="text-xs text-red-600" role="alert">
                {errors.note}
              </p>
            )}
          </div>
        </div>
      </CollapsibleCard>

      {/* ── API error ─────────────────────────────────────── */}
      {apiError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl p-4"
        >
          <p>{apiError}</p>
          {validationErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {validationErrors.map((error) => (
                <li key={`${error.field}-${error.message}`}>
                  <span className="font-semibold">{error.field}:</span>{" "}
                  {error.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={hasErrors || isSubmitting}
          className="w-full flex items-center justify-center gap-2.5 bg-[#2557a7] hover:bg-[#1e4a94] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-base transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating your letter…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Cover Letter
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-2.5">
          Takes ~30 seconds · Powered by AI · Free to use
        </p>
      </div>
    </form>
  );
}

/* ── CollapsibleCard ─────────────────────────────────────────── */
function CollapsibleCard({
  icon,
  label,
  hint,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2557a7]/30"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {!open && (
            <span className="text-xs text-slate-400 hidden sm:inline">{hint}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── TextField ───────────────────────────────────────────────── */
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
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2557a7]/40 focus:border-[#2557a7] focus:bg-white disabled:opacity-50 transition-colors"
      />
    </div>
  );
}
