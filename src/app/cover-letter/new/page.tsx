"use client";

import Link from "next/link";
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  FileText,
  GraduationCap,
  History,
  Loader2,
  PenLine,
  RotateCcw,
  Search,
  Star,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getCoverLetterGenerationProgress, listCoverLetterResumeOptions, setDefaultCoverLetterResume } from "@/api/coverLetterApi";
import { getExtensionSession, type ExtensionSession } from "@/api/extensionApi";
import { getParsedJDDetails, getResume as getParsedResume, parseJDByJob, parseJDFile, parseJDText } from "@/api/parserApi";
import { getResumeById } from "@/api/resumeApi";
import { extractResume } from "@/api/resumeParsingApi";
import SignUpModal from "@/components/SignUpModal";
import { CoverLetterTemplatePreview, CoverLetterTemplatePreviewModal } from "@/app/cover-letter/_components/CoverLetterTemplatePreview";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useDefaultCoverLetterResume } from "@/hooks/useDefaultCoverLetterResume";
import { useDefaultCoverLetterTemplate } from "@/hooks/useDefaultCoverLetterTemplate";
import { useCoverLetterTemplates } from "@/hooks/useCoverLetterTemplates";
import { useGenerateCoverLetter } from "@/hooks/useGenerateCoverLetter";
import { useHasParsedResume } from "@/hooks/useHasParsedResume";
import { useLatestParsedResume } from "@/hooks/useLatestParsedResume";
import { mintIdempotencyKey } from "@/lib/idempotencyKey";
import { getCorrelationId } from "@/lib/correlationId";
import { logger } from "@/lib/logger";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import { cacheGeneratedCoverLetter } from "@/lib/coverLetterNavigationCache";
import { getCoverLetterParsedResumeId, getCoverLetterResumeSource } from "@/lib/coverLetterResume";
import type { CoverLetterFormSubmit, CoverLetterGenerationProgress, CoverLetterResumeOption, CoverLetterTemplate, CoverLetterTemplateId } from "@/types/coverLetter";

const MAX_RESUME_UPLOAD_MB = 10;
const MIN_JD_CHARS = 50;
const MAX_NOTE_CHARS = 300;
// Mirrors ApplicationContext caps in the CL-1.2 API schema.
const MAX_ROLE_TITLE_CHARS = 300;  // ApplicationContext.role_title is max_length=300 API-side
const MAX_COMPANY_LOCATION_CHARS = 200;
// Mirrors the backend GenerateOptions bounds exactly (ge=200, le=500).
const WORD_COUNT_FLOOR = 200;
const WORD_COUNT_CEIL = 500;
const COVER_LETTER_TEMPLATE_PREF_KEY = "careerbot:cover-letter-template";
const COVER_LETTER_REFRESH_DRAFT_KEY = "careerbot:cover-letter-refresh-draft";
const COVER_LETTER_REFRESH_MARKER_KEY = "careerbot:cover-letter-refresh-pending";
const JOB_ANALYSIS_TOAST_ID = "cover-letter-job-analysis";
// Consecutive empty progress reads (e.g. an API without the progress route) before polling stops.
const MAX_PROGRESS_MISSES = 15;
// The subset of an ExtensionSession this form prefills from. Narrower than the
// API response on purpose: it is what gets cached in sessionStorage, and
// user_id / profile have no business being persisted there.
type ExtensionPrefill = Pick<
  ExtensionSession,
  "job_description" | "job_title" | "company" | "job_location" | "resume_id"
>;
type CoverLetterRefreshDraft = {
  source?: CreationSource;
  trackerJobId?: string;
  jd: string;
  companyName: string;
  roleTitle: string;
  location: string;
  hiringManagerName: string;
  candidateSignatureName: string;
  autoFilledFields: AutoFilledJobField[];
  signatureResumeKey: string | null;
};
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_JD_FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

type ParsedResumeBlob = Record<string, unknown>;
type BuilderStep = "resume" | "generate";
type CreationSource = "jd" | "tracker" | "upload";
type ToneChoice = "professional" | "warm" | "concise";
type JobAnalysisStatus = "idle" | "analyzing" | "ready" | "incomplete" | "failed";
type AutoFilledJobField = "company" | "title" | "location";
type TemplateStyleId =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "minimal"
  | "signature";

function getJobSourceFingerprint(
  source: CreationSource,
  values: { jd: string; jdFile: File | null; trackerJobId: string },
): string {
  if (source === "jd") return `jd:${values.jd.trim()}`;
  if (source === "upload") {
    const file = values.jdFile;
    return file ? `upload:${file.name}:${file.size}:${file.lastModified}` : "upload:";
  }
  return `tracker:${values.trackerJobId.trim()}`;
}

function inferJdHeaderValue(text: string, header: string, maxLength: number): string | undefined {
  const value = new RegExp(`(?:^|\\n)\\s*${header}\\s*:\\s*([^\\r\\n]+)`, "i").exec(text)?.[1]?.trim();
  return value ? value.slice(0, maxLength) : undefined;
}

function isWorkArrangement(value: string | undefined): boolean {
  return /^(?:remote|hybrid|on[-\s]?site)$/i.test(value?.trim() ?? "");
}

function shouldRestoreRefreshDraft(): boolean {
  try {
    const wasOnCoverLetterForm = window.sessionStorage.getItem(COVER_LETTER_REFRESH_MARKER_KEY) === "true";
    window.sessionStorage.removeItem(COVER_LETTER_REFRESH_MARKER_KEY);
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return wasOnCoverLetterForm && navigation?.type === "reload";
  } catch {
    return false;
  }
}

function readRefreshDraft(): CoverLetterRefreshDraft | null {
  try {
    const raw = window.sessionStorage.getItem(COVER_LETTER_REFRESH_DRAFT_KEY);
    const value = raw ? JSON.parse(raw) as Record<string, unknown> : null;
    if (!value || typeof value !== "object") return null;
    const text = (field: string, maxLength: number) =>
      typeof value[field] === "string" ? value[field].slice(0, maxLength) : "";
    const autoFilledFields = Array.isArray(value.autoFilledFields)
      ? value.autoFilledFields.filter((field): field is AutoFilledJobField => field === "company" || field === "title" || field === "location")
      : [];
    const source = value.source === "jd" || value.source === "tracker" || value.source === "upload" ? value.source : undefined;
    return {
      source,
      trackerJobId: text("trackerJobId", MAX_COMPANY_LOCATION_CHARS),
      jd: text("jd", 50_000),
      companyName: text("companyName", MAX_COMPANY_LOCATION_CHARS),
      roleTitle: text("roleTitle", MAX_ROLE_TITLE_CHARS),
      location: text("location", MAX_COMPANY_LOCATION_CHARS),
      hiringManagerName: text("hiringManagerName", MAX_COMPANY_LOCATION_CHARS),
      candidateSignatureName: text("candidateSignatureName", MAX_COMPANY_LOCATION_CHARS),
      autoFilledFields,
      signatureResumeKey: typeof value.signatureResumeKey === "string" ? value.signatureResumeKey : null,
    };
  } catch {
    return null;
  }
}

/** Extracts an explicitly stated role title when the stored parser record has no title. */
function inferRoleTitleFromJd(text: string): string | undefined {
  const candidates = [
    /what does an?\s+(.+?)\s+do here\?/i,
    /(?:^|\n)\s*role\s*:\s*([^\n]+)/im,
    /(?:^|\n)\s*job title\s*:\s*([^\n]+)/im,
  ];

  for (const pattern of candidates) {
    const value = pattern.exec(text)?.[1]?.trim();
    if (value) return value.slice(0, MAX_ROLE_TITLE_CHARS);
  }
  return undefined;
}

function inferCompanyNameFromJd(text: string): string | undefined {
  return inferJdHeaderValue(text, "company(?:\\s+name)?", MAX_COMPANY_LOCATION_CHARS);
}

function inferLocationFromJd(text: string): string | undefined {
  return inferJdHeaderValue(text, "(?:job\\s+)?location", MAX_COMPANY_LOCATION_CHARS);
}

function rememberGeneratedLetterTemplate(letterId: string, templateId: TemplateStyleId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${COVER_LETTER_TEMPLATE_PREF_KEY}:${letterId}`, templateId);
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }
}

const steps: Array<{ id: BuilderStep; label: string; helper: string }> = [
  { id: "resume", label: "Resume & Job Details", helper: "Add inputs" },
  { id: "generate", label: "Review & Export", helper: "After generation" },
];

const builderStepIds = new Set<BuilderStep>(steps.map((step) => step.id));

const sourceOptions: Array<{
  id: CreationSource;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "jd",
    label: "Paste job post",
    description: "Fastest and most accurate.",
    icon: Clipboard,
  },
  {
    id: "tracker",
    label: "Import from tracker",
    description: "Use a saved role.",
    icon: BriefcaseBusiness,
  },
  {
    id: "upload",
    label: "Upload JD",
    description: "PDF, DOCX, DOC, or TXT.",
    icon: Upload,
  },
];

const toneOptions: Array<{ id: ToneChoice; label: string; helper: string }> = [
  { id: "professional", label: "Professional", helper: "Balanced and recruiter-friendly" },
  { id: "concise", label: "Concise", helper: "Shorter, sharper paragraphs" },
  { id: "warm", label: "Warm", helper: "Human but still polished" },
];

const jobTitleSuggestions = [
  "Junior Backend Developer",
  "Backend Developer",
  "Senior Backend Engineer",
  "Python Developer",
  "FastAPI Developer",
  "Junior Full Stack Developer",
  "Full Stack Developer",
  "Senior Full Stack Developer",
  "Junior Frontend Developer",
  "Frontend Developer",
  "Senior Frontend Developer",
  "React Developer",
  "Junior Software Engineer",
  "Software Engineer",
  "Senior Software Engineer",
  "Java Developer",
  "Node.js Developer",
  "DevOps Engineer",
  "Senior DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Engineering Manager",
  "Product Manager",
  "Business Analyst",
  "QA Engineer",
  "Automation Test Engineer",
  "UI/UX Designer",
  "Technical Support Engineer",
  "Project Manager",
];

const locationSuggestions = [
  "Bengaluru, India",
  "Hyderabad, India",
  "Chennai, India",
  "Pune, India",
  "Mumbai, India",
  "Delhi NCR, India",
  "Noida, India",
  "Gurugram, India",
  "Kochi, India",
  "Coimbatore, India",
  "Ahmedabad, India",
  "Vijayawada, India",
  "Visakhapatnam, India",
  "Kolkata, India",
  "Jaipur, India",
  "Lucknow, India",
  "Chandigarh, India",
  "Indore, India",
  "Nagpur, India",
  "Bhubaneswar, India",
  "Thiruvananthapuram, India",
  "Vadodara, India",
  "Mysuru, India",
  "Surat, India",
  "Patna, India",
  "New York, NY",
  "San Francisco, CA",
  "Austin, TX",
  "Seattle, WA",
  "London, UK",
  "Dubai, UAE",
  "Singapore",
  "Toronto, Canada",
];

const templateStyles: Array<{
  id: TemplateStyleId;
  name: string;
  category: string;
  description: string;
  backendTemplateId: CoverLetterTemplateId;
  accent: string;
  paper: string;
  previewStyle: "classic" | "modern" | "compact" | "executive" | "minimal" | "signature";
  bestFor: string;
}> = [
  {
    id: "classic",
    name: "Classic",
    category: "Formal",
    description: "Traditional letterhead with a strong top rule and recruiter-safe spacing.",
    backendTemplateId: "classic",
    accent: "bg-slate-900",
    paper: "bg-[#f6f3ef]",
    previewStyle: "classic",
    bestFor: "Finance, legal, operations",
  },
  {
    id: "modern",
    name: "Modern",
    category: "Modern",
    description: "Bold masthead, clean contact row, and a polished SaaS-style structure.",
    backendTemplateId: "modern",
    accent: "bg-[#0f8b8d]",
    paper: "bg-[#e9f7f6]",
    previewStyle: "modern",
    bestFor: "Tech, product, growth",
  },
  {
    id: "compact",
    name: "Compact",
    category: "ATS-friendly",
    description: "Dense one-page rhythm with tight paragraphs and clear section breaks.",
    backendTemplateId: "compact",
    accent: "bg-[#2557a7]",
    paper: "bg-[#edf4ff]",
    previewStyle: "compact",
    bestFor: "High-volume applications",
  },
  {
    id: "executive",
    name: "Executive",
    category: "Leadership",
    description: "Premium side rail with executive profile treatment and spacious body copy.",
    backendTemplateId: "executive",
    accent: "bg-[#26324a]",
    paper: "bg-[#eef1f7]",
    previewStyle: "executive",
    bestFor: "Senior leadership",
  },
  {
    id: "minimal",
    name: "Minimal",
    category: "Editorial",
    description: "Open whitespace, quiet typography, and a confident editorial feel.",
    backendTemplateId: "minimal",
    accent: "bg-[#64748b]",
    paper: "bg-[#f8fafc]",
    previewStyle: "minimal",
    bestFor: "Consulting, research",
  },
  {
    id: "signature",
    name: "Signature",
    category: "Personal brand",
    description: "Monogram header and signature finish for a memorable professional note.",
    backendTemplateId: "signature",
    accent: "bg-[#047857]",
    paper: "bg-[#ecfdf5]",
    previewStyle: "signature",
    bestFor: "Design, marketing, CS",
  },
];

export default function CoverLetterNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gate = useHasParsedResume();
  const latest = useLatestParsedResume();
  const defaultResume = useDefaultCoverLetterResume();
  const defaultTemplate = useDefaultCoverLetterTemplate();
  const templateCatalog = useCoverLetterTemplates();
  const { userId } = useCurrentUserId();
  const userPickedResumeRef = useRef(false);
  const signatureResumeLoadRef = useRef<string | null>(null);
  const signatureResumeKeyRef = useRef<string | null>(null);
  const restoredSignatureRef = useRef<{
    key: string | null;
    name: string;
  } | null>(null);
  const [uploadedResume, setUploadedResume] = useState<ParsedResumeBlob | null>(null);
  const [selectedResume, setSelectedResume] = useState<ParsedResumeBlob | null>(null);
  const [resumeOptions, setResumeOptions] = useState<CoverLetterResumeOption[]>([]);
  const [resumePickerOpen, setResumePickerOpen] = useState(false);
  const [resumePickerLoading, setResumePickerLoading] = useState(false);
  const [settingDefaultResume, setSettingDefaultResume] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [activeStep, setActiveStep] = useState<BuilderStep>(
    getInitialBuilderStep(searchParams.get("step")),
  );
  const [source, setSource] = useState<CreationSource>(
    sourceOptions.some((option) => option.id === searchParams.get("source"))
      ? (searchParams.get("source") as CreationSource)
      : "jd",
  );
  const [jd, setJd] = useState(searchParams.get("jd") ?? "");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [trackerJobId, setTrackerJobId] = useState("");
  const [parsedJdId, setParsedJdId] = useState<string | null>(null);
  const [parsedJdFingerprint, setParsedJdFingerprint] = useState<string | null>(null);
  const [jobAnalysisStatus, setJobAnalysisStatus] = useState<JobAnalysisStatus>("idle");
  // False while the JD came from ?jd=, the extension or a refresh draft; typing sets it.
  const jdTypedRef = useRef(false);
  const jobAnalysisRequestRef = useRef(0);
  const autoFilledJobFieldsRef = useRef(new Set<AutoFilledJobField>());
  const extensionJobFieldsRef = useRef(new Set<AutoFilledJobField>());
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState("");
  const clearJobAnalysis = useCallback(() => {
    jobAnalysisRequestRef.current += 1;
    setParsedJdId(null);
    setParsedJdFingerprint(null);
    setJobAnalysisStatus("idle");
    toast.dismiss(JOB_ANALYSIS_TOAST_ID);
    // Values auto-filled from the previous job must not be sent with the next
    // one. Typed and extension values stay.
    const setters = { company: setCompanyName, title: setRoleTitle, location: setLocation };
    for (const field of autoFilledJobFieldsRef.current) {
      if (!extensionJobFieldsRef.current.has(field)) setters[field]("");
    }
    autoFilledJobFieldsRef.current = new Set([...autoFilledJobFieldsRef.current].filter((field) => extensionJobFieldsRef.current.has(field)));
  }, []);
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [candidateSignatureName, setCandidateSignatureName] = useState("");
  const [signatureResumeKey, setSignatureResumeKey] = useState<string | null>(null);
  // Bumped when the user picks a resume, so a failed signature lookup can retry for the same resume.
  const [resumePickCount, setResumePickCount] = useState(0);
  const [refreshDraftReady, setRefreshDraftReady] = useState(false);
  const [includeContactDetails, setIncludeContactDetails] = useState(false);
  const [tone, setTone] = useState<ToneChoice>("professional");
  // "auto" (default/recommended) omits min_words/max_words entirely so the
  // AI service applies its own candidate-level-aware word-count range
  // (e.g. ~220-320 words for a fresher vs ~400-650 for a leadership-level
  // candidate). "custom" lets the user override with an explicit range.
  const [wordCountMode, setWordCountMode] = useState<"auto" | "custom">("auto");
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateStyleId>("modern");
  const pendingTemplateIdRef = useRef<TemplateStyleId>("modern");
  // The saved default arrives asynchronously. Once the user has picked a
  // template themselves, a late-arriving default must not silently replace
  // their choice — so we only seed the selection while it is untouched.
  const userPickedTemplateRef = useRef(false);
  const handleTemplateChange = useCallback((id: TemplateStyleId) => {
    userPickedTemplateRef.current = true;
    setSelectedTemplateId(id);
  }, []);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [generatedLetterId, setGeneratedLetterId] = useState<string | null>(null);
  const [generationAttemptKey, setGenerationAttemptKey] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<CoverLetterGenerationProgress | null>(null);
  const uploader = useCoverLetterResumeUpload(
    async (resume) => {
      userPickedResumeRef.current = true;
      setUploadedResume(resume);
      await Promise.all([gate.refetch(), latest.refetch(), defaultResume.refetch()]);
    },
    () => setShowSignIn(true),
  );
  useEffect(() => {
    if (userPickedTemplateRef.current) return;
    const preferred = defaultTemplate.defaultTemplate?.template_id as TemplateStyleId | undefined;
    if (preferred && templateStyles.some((template) => template.id === preferred)) {
      setSelectedTemplateId(preferred);
      pendingTemplateIdRef.current = preferred;
    }
  }, [defaultTemplate.defaultTemplate?.template_id]);
  // If the initial resume fetch fails with an auth error (session expired),
  // open the sign-in modal immediately so the user can re-authenticate without
  // having to navigate away from this page.
  useEffect(() => {
    const err = gate.error ?? latest.error ?? defaultResume.error;
    if (err && isUnauthorizedError(err)) {
      setShowSignIn(true);
    }
  }, [defaultResume.error, gate.error, latest.error]);

  useEffect(() => {
    if (activeStep === "generate") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeStep]);

  // The browser extension hands off a scraped job + resume via
  // /extension/prefill -> ?session=<id> instead of putting raw data in the
  // URL — a JD can run up to 50k chars, well past safe URL-length limits.
  const sessionId = searchParams.get("session");
  const [sessionExtResumeId, setSessionExtResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // The extension session is single-use server-side ("Session may have
    // expired or already been consumed" below). If this effect ever runs a
    // second time for the same sessionId — e.g. a remount triggered by one
    // of this page's several data-loading hooks — a second live fetch would
    // hit an already-consumed session and come back empty, silently. Cache
    // the first successful read so a rerun reuses it instead of
    // re-consuming (and losing) it.
    const cacheKey = `careerbot:ext-session:${sessionId}`;
    const applySession = (prefill: ExtensionPrefill) => {
      // Every value here was scraped from a third-party job page, so it is
      // untrusted input and gets the same caps the typed inputs below enforce
      // via `maxLength`. Writing it straight to state would bypass them: the
      // extension truncates meta fields at 300 chars
      // (extension/background/service-worker.js), which is over
      // MAX_COMPANY_LOCATION_CHARS, and these values are read back into
      // application_context on the generate request.
      if (prefill.job_description) {
        // A job analyzed while the session loaded must not leave its values behind.
        clearJobAnalysis();
        setJd(prefill.job_description);
      }
      if (prefill.job_title) {
        autoFilledJobFieldsRef.current.add("title");
        extensionJobFieldsRef.current.add("title");
        setRoleTitle(prefill.job_title.slice(0, MAX_ROLE_TITLE_CHARS));
      }
      if (prefill.company) {
        autoFilledJobFieldsRef.current.add("company");
        extensionJobFieldsRef.current.add("company");
        setCompanyName(prefill.company.slice(0, MAX_COMPANY_LOCATION_CHARS));
      }
      if (prefill.job_location) {
        autoFilledJobFieldsRef.current.add("location");
        extensionJobFieldsRef.current.add("location");
        setLocation(prefill.job_location.slice(0, MAX_COMPANY_LOCATION_CHARS));
      }
      if (prefill.resume_id) setSessionExtResumeId(prefill.resume_id);
      // Extension data has no signature name. The selected resume's parsed
      // personal name is applied separately, and the user can always edit it.
    };

    let cached: ExtensionPrefill | null = null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      cached = raw ? (JSON.parse(raw) as ExtensionPrefill) : null;
    } catch {
      cached = null;
    }
    if (cached) {
      applySession(cached);
      return;
    }

    let cancelled = false;
    getExtensionSession(sessionId)
      .then((session) => {
        if (cancelled) return;
        // Cache only the five fields this form consumes. The session response
        // also carries user_id and a `profile` object; there is no reason to
        // persist those into sessionStorage for the lifetime of the tab.
        const prefill: ExtensionPrefill = {
          job_description: session.job_description,
          job_title: session.job_title,
          company: session.company,
          job_location: session.job_location ?? null,
          resume_id: session.resume_id,
        };
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(prefill));
        } catch {
          // Storage can be unavailable in private/locked-down contexts — the
          // form still works from this successful read, just not cached.
        }
        applySession(prefill);
      })
      .catch((err) => {
        // Session may have expired or already been consumed — the form still
        // works with manual entry, same as landing on this page directly.
        console.error("[cover-letter/new] Could not resolve extension session", sessionId, err);
      });
    return () => {
      cancelled = true;
    };
  }, [clearJobAnalysis, sessionId]);

  useEffect(() => {
    if (!shouldRestoreRefreshDraft()) {
      try {
        window.sessionStorage.removeItem(COVER_LETTER_REFRESH_DRAFT_KEY);
      } catch {
        // Storage can be unavailable in private or locked-down browser contexts.
      }
      setRefreshDraftReady(true);
      return;
    }

    const draft = readRefreshDraft();
    if (draft) {
      autoFilledJobFieldsRef.current = new Set(draft.autoFilledFields);
      if (draft.source) setSource(draft.source);
      setTrackerJobId(draft.trackerJobId ?? "");
      setJd(draft.jd);
      setCompanyName(draft.companyName);
      setRoleTitle(draft.roleTitle);
      setLocation(draft.location);
      setHiringManagerName(draft.hiringManagerName);
      setCandidateSignatureName(draft.candidateSignatureName);
      restoredSignatureRef.current = {
        key: draft.signatureResumeKey,
        name: draft.candidateSignatureName,
      };
      setSignatureResumeKey(draft.signatureResumeKey);
    }
    setRefreshDraftReady(true);
  }, []);

  useEffect(() => {
    const markRefresh = () => {
      try {
        window.sessionStorage.setItem(COVER_LETTER_REFRESH_MARKER_KEY, "true");
      } catch {
        // Storage can be unavailable in private or locked-down browser contexts.
      }
    };
    window.addEventListener("pagehide", markRefresh);
    return () => window.removeEventListener("pagehide", markRefresh);
  }, []);

  useEffect(() => {
    if (!refreshDraftReady) return;
    try {
      // Tracker and upload sources leave the JD empty; keep their typed details too.
      if (![jd, trackerJobId, companyName, roleTitle, location, hiringManagerName].some((value) => value.trim())) {
        window.sessionStorage.removeItem(COVER_LETTER_REFRESH_DRAFT_KEY);
        return;
      }
      const draft: CoverLetterRefreshDraft = {
        source,
        trackerJobId,
        jd,
        companyName,
        roleTitle,
        location,
        hiringManagerName,
        candidateSignatureName,
        autoFilledFields: [...autoFilledJobFieldsRef.current],
        signatureResumeKey,
      };
      window.sessionStorage.setItem(COVER_LETTER_REFRESH_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  }, [candidateSignatureName, companyName, hiringManagerName, jd, location, refreshDraftReady, roleTitle, signatureResumeKey, source, trackerJobId]);

  const defaultResumeBlob = toDefaultResumeBlob(defaultResume.defaultResume);
  const requestedResumeId = searchParams.get("resume_id") ?? sessionExtResumeId;
  const requestedResumeSourceParam = searchParams.get("resume_source") ?? (sessionExtResumeId ? "parser" : null);
  const requestedResumeSource =
    requestedResumeSourceParam === "builder" || requestedResumeSourceParam === "parser"
      ? requestedResumeSourceParam
      : null;

  useEffect(() => {
    // Once the user picks a resume themselves, the URL-requested one (from the
    // builder hand-off) must not be re-applied over their choice.
    if (!requestedResumeId || !requestedResumeSource || uploadedResume || userPickedResumeRef.current) {
      return;
    }

    const selectedResumeId = getCoverLetterParsedResumeId(selectedResume);
    const selectedResumeSource = getCoverLetterResumeSource(selectedResume);
    if (selectedResumeId === requestedResumeId && selectedResumeSource === requestedResumeSource) {
      return;
    }

    let cancelled = false;
    listCoverLetterResumeOptions()
      .then(async (result) => {
        if (cancelled || uploadedResume || userPickedResumeRef.current) return;
        const requestedResume = result.resumes.find(
          (option) => option.resume_id === requestedResumeId && option.source === requestedResumeSource,
        );
        if (requestedResume) {
          const selectedBlob = toResumeOptionBlob({
            ...requestedResume,
            is_user_default: false,
          });
          if (requestedResume.source === "builder") {
            try {
              const builderResume = await getResumeById(requestedResume.resume_id);
              if (cancelled || userPickedResumeRef.current) return;
              const builderDisplayName = getBuilderResumeDisplayName(builderResume) ?? requestedResume.display_name;
              setSelectedResume({
                ...selectedBlob,
                builder_resume: builderResume,
                personalInfo: builderResume.personalInfo,
                professionalSummary: builderResume.professionalSummary,
                display_name: builderDisplayName,
                name: builderDisplayName,
              });
              return;
            } catch {
              // If details fail, still use the option response so generation can continue.
            }
          }
          setSelectedResume(selectedBlob);
        } else {
          toast.error("Could not find the selected resume. Choose another resume to continue.");
        }
      })
      .catch(() => {
        toast.error("Could not load the selected resume. Choose another resume to continue.");
      });

    return () => {
      cancelled = true;
    };
  }, [requestedResumeId, requestedResumeSource, selectedResume, uploadedResume]);

  useEffect(() => {
    if (requestedResumeId || uploadedResume || selectedResume || defaultResume.isLoading || defaultResumeBlob) {
      return;
    }

    let cancelled = false;
    listCoverLetterResumeOptions()
      .then((result) => {
        if (cancelled || uploadedResume || selectedResume) return;
        const preferredResume =
          result.resumes.find((option) => option.is_user_default)
          ?? result.resumes.find((option) => option.is_usable_for_cover_letter);
        if (preferredResume) {
          setSelectedResume(toResumeOptionBlob(preferredResume));
        }
      })
      .catch(() => {
        // The main default-resume hook already handles user-facing auth/errors.
      });

    return () => {
      cancelled = true;
    };
  }, [defaultResume.isLoading, defaultResumeBlob, requestedResumeId, selectedResume, uploadedResume]);

  const fallbackResume = requestedResumeId ? null : defaultResumeBlob ?? latest.resume;
  const resume = uploadedResume ?? selectedResume ?? fallbackResume;
  const parsedResumeId = getCoverLetterParsedResumeId(resume);
  const resumeSource = getCoverLetterResumeSource(resume);
  // `toDefaultResumeBlob` intentionally returns a new object for a default
  // resume. Effects that load its details must therefore depend on this
  // stable fact, not on the object identity itself.
  const hasResumeSignature = Boolean(getResumeSignatureName(resume));
  const activeResumeRef = useRef<ParsedResumeBlob | null>(resume);
  activeResumeRef.current = resume;

  useEffect(() => {
    if (
      !parsedResumeId
      || hasResumeSignature
      || signatureResumeLoadRef.current === `${resumeSource}:${parsedResumeId}`
    ) {
      return;
    }

    let cancelled = false;
    const loadKey = `${resumeSource}:${parsedResumeId}`;
    signatureResumeLoadRef.current = loadKey;
    const loadResume = resumeSource === "builder"
      ? getResumeById(parsedResumeId)
      : getParsedResume(parsedResumeId);
    loadResume
      .then((loadedResume) => {
        if (cancelled) return;
        const response = getNestedRecord(loadedResume);
        const responseData = getNestedRecord(response.data);
        const details = Object.keys(responseData).length > 0 ? responseData : response;

        setSelectedResume((current) => {
          // Default resumes live in fallbackResume, so current can still be
          // null here. Merge only while this is still the active resume.
          const activeResume = current ?? activeResumeRef.current;
          if (getCoverLetterParsedResumeId(activeResume) !== parsedResumeId) return current;
          if (resumeSource === "builder") {
            return {
              ...activeResume,
              builder_resume: details,
              personalInfo: details.personalInfo,
              personal_info: details.personal_info,
              contact: details.contact,
            };
          }
          return {
            ...activeResume,
            parsed_data: details.parsed_data ?? details,
            personalInfo: details.personalInfo,
            personal_info: details.personal_info,
            contact: details.contact,
          };
        });
      })
      .catch((err) => {
        if (!cancelled) {
          signatureResumeLoadRef.current = null;
          if (isUnauthorizedError(err)) setShowSignIn(true);
        }
      });

    return () => {
      cancelled = true;
      // A cancelled lookup must be allowed to restart. This is important when
      // its resume is replaced while the request is in flight.
      if (signatureResumeLoadRef.current === loadKey) {
        signatureResumeLoadRef.current = null;
      }
    };
  }, [hasResumeSignature, parsedResumeId, resumePickCount, resumeSource]);

  useEffect(() => {
    const signatureResumeKey = parsedResumeId && resumeSource
      ? `${resumeSource}:${parsedResumeId}`
      : null;
    if (!signatureResumeKey) return;

    const signatureName = getResumeSignatureName(resume);
    if (signatureResumeKeyRef.current !== signatureResumeKey) {
      // A refresh draft belongs to one exact resume. While the default-resume
      // request is still resolving, do not let a transient latest-resume
      // fallback overwrite the saved signature.
      const restored = restoredSignatureRef.current;
      signatureResumeKeyRef.current = signatureResumeKey;
      setSignatureResumeKey(signatureResumeKey);
      if (restored?.key === signatureResumeKey) {
        restoredSignatureRef.current = null;
        setCandidateSignatureName(restored.name);
        return;
      }
      // Hold the restored signature only for the automatic default; a resume the
      // user picked gets its own signature at once.
      if (restored && defaultResume.isLoading && !userPickedResumeRef.current) return;
      if (restored) restoredSignatureRef.current = null;
      // A newly selected resume must never retain the preceding resume's
      // signature. Most picker rows contain only metadata, so clear first and
      // populate after the selected resume's parsed details arrive.
      setCandidateSignatureName(signatureName ?? "");
      return;
    }
    const restored = restoredSignatureRef.current;
    if (restored && (!defaultResume.isLoading || userPickedResumeRef.current) && restored.key !== signatureResumeKey) {
      // The saved resume did not resolve and the fallback is now final (or the
      // user picked this resume). Do not retain this draft-specific
      // restoration marker for a later resume selection.
      restoredSignatureRef.current = null;
      setCandidateSignatureName(signatureName ?? "");
      return;
    }
    if (signatureName) {
      setCandidateSignatureName((current) => current.trim() || signatureName);
    }
  }, [defaultResume.isLoading, parsedResumeId, resume, resumeSource]);

  const selectedTemplate = templateStyles.find((template) => template.id === selectedTemplateId) ?? templateStyles[1];
  const jdReady = jd.trim().length >= MIN_JD_CHARS;
  const jobSourceReady =
    source === "jd"
      ? jdReady
      : source === "upload"
        ? Boolean(jdFile && !validateJdUpload(jdFile))
        : trackerJobId.trim().length > 0;
  const jobSourceFingerprint = getJobSourceFingerprint(source, { jd, jdFile, trackerJobId });
  const jobSourceFingerprintRef = useRef(jobSourceFingerprint);
  jobSourceFingerprintRef.current = jobSourceFingerprint;

  const analyzeJobDetails = useCallback(async () => {
    if (!jobSourceReady) return null;

    const fingerprint = getJobSourceFingerprint(source, { jd, jdFile, trackerJobId });
    // Blur is an explicit request to analyze typed text, but it must not
    // repeat a successful parse when the source has not changed.
    if (parsedJdFingerprint === fingerprint && parsedJdId) return parsedJdId;

    const requestId = ++jobAnalysisRequestRef.current;
    setJobAnalysisStatus("analyzing");

    try {
      const parsedJd = await resolveParsedJdId({ source, jd, jdFile, trackerJobId });
      if (!parsedJd.jd_id) {
        throw new Error("Could not analyze this job description.");
      }
      if (requestId !== jobAnalysisRequestRef.current || jobSourceFingerprintRef.current !== fingerprint) {
        return null;
      }

      // Parsing creates the ID required for generation. Persist it before the
      // optional detail lookup so a transient lookup failure cannot force the
      // user to re-parse an otherwise valid job description.
      setParsedJdId(parsedJd.jd_id);
      setParsedJdFingerprint(fingerprint);

      let details: Awaited<ReturnType<typeof getParsedJDDetails>>;
      try {
        details = await getParsedJDDetails(parsedJd.jd_id);
      } catch (detailError) {
        if (requestId === jobAnalysisRequestRef.current && jobSourceFingerprintRef.current === fingerprint) {
          setJobAnalysisStatus("incomplete");
          // The jd_id stays valid, but an expired session must still ask the user to sign in.
          if (isUnauthorizedError(detailError)) {
            toast.error("Your session has expired. Please sign in to analyze the job description.", { id: JOB_ANALYSIS_TOAST_ID });
            setShowSignIn(true);
            return parsedJd.jd_id;
          }
          toast.info(
            "Job description analyzed. Enter company name, job title, and location if they are not already filled.",
            { id: JOB_ANALYSIS_TOAST_ID },
          );
          logger.debug("[cover-letter/job-analysis] detail lookup failed after parse", { detailError });
        }
        return parsedJd.jd_id;
      }
      if (requestId !== jobAnalysisRequestRef.current || jobSourceFingerprintRef.current !== fingerprint) {
        return null;
      }

      const inferredRoleTitle = source === "jd" ? inferRoleTitleFromJd(jd) : undefined;
      const inferredCompanyName = source === "jd" ? inferCompanyNameFromJd(jd) : undefined;
      const inferredLocation = source === "jd" ? inferLocationFromJd(jd) : undefined;
      const roleTitle = details.job_title ?? inferredRoleTitle;
      const companyName = details.company ?? inferredCompanyName;
      const location = isWorkArrangement(details.location) ? inferredLocation : details.location ?? inferredLocation;
      const missingFields = [
        !companyName && "company name",
        !roleTitle && "job title",
        !location && "location",
      ].filter(Boolean) as string[];
      const applyAutoFilledJobField = (
        field: AutoFilledJobField,
        parsedValue: string | undefined,
        setValue: (updater: (current: string) => string) => void,
      ) => {
        // Parsed values get the same caps as the typed inputs (API max_length).
        const value = parsedValue?.slice(0, field === "title" ? MAX_ROLE_TITLE_CHARS : MAX_COMPANY_LOCATION_CHARS);
        setValue((current) => {
          const wasAutoFilled = autoFilledJobFieldsRef.current.has(field);
          // Data scraped by the browser extension is already tied to the job
          // the user chose. JD analysis may fill blanks but must not clear or
          // replace that hand-off data.
          if (extensionJobFieldsRef.current.has(field)) return current;
          if (!value) {
            // A value auto-filled from an earlier job must not outlive it.
            if (!wasAutoFilled) return current;
            autoFilledJobFieldsRef.current.delete(field);
            return "";
          }
          if (!current.trim() || wasAutoFilled) {
            autoFilledJobFieldsRef.current.add(field);
            return value;
          }
          return current;
        });
      };
      applyAutoFilledJobField("company", companyName, setCompanyName);
      applyAutoFilledJobField("title", roleTitle, setRoleTitle);
      applyAutoFilledJobField("location", location, setLocation);
      setJobAnalysisStatus(companyName || roleTitle || location ? "ready" : "incomplete");
      if (missingFields.length > 0) {
        toast.info(`Job description analyzed. Enter ${missingFields.join(" and ")}.`, { id: JOB_ANALYSIS_TOAST_ID });
      } else {
        toast.success("Job details filled from the description.", { id: JOB_ANALYSIS_TOAST_ID });
      }
      return parsedJd.jd_id;
    } catch (err) {
      if (requestId === jobAnalysisRequestRef.current && jobSourceFingerprintRef.current === fingerprint) {
        setParsedJdId(null);
        setParsedJdFingerprint(null);
        setJobAnalysisStatus("failed");
        if (isUnauthorizedError(err)) {
          toast.error("Your session has expired. Please sign in to analyze the job description.", { id: JOB_ANALYSIS_TOAST_ID });
          setShowSignIn(true);
        } else {
          toast.error(err instanceof Error ? err.message : "Could not analyze this job description.", {
            id: JOB_ANALYSIS_TOAST_ID,
            action: { label: "Retry", onClick: () => void analyzeJobDetails() },
          });
        }
      }
      return null;
    }
  }, [jd, jdFile, jobSourceReady, parsedJdFingerprint, parsedJdId, source, trackerJobId]);

  // Files are complete inputs as soon as they are selected, unlike a typed JD.
  // Analyze an upload once it is valid, and a JD that arrived without typing
  // (?jd=, extension, refresh draft); typed descriptions wait for blur.
  useEffect(() => {
    if (!jobSourceReady || !(source === "upload" || (source === "jd" && !jdTypedRef.current))) return;
    void analyzeJobDetails();
  }, [analyzeJobDetails, jobSourceReady, source]);

  const generation = useGenerateCoverLetter({
    onSuccess: (response) => {
      setApiError(null);
      cacheGeneratedCoverLetter(response);
      rememberGeneratedLetterTemplate(response.letter_id, pendingTemplateIdRef.current);
      setGeneratedLetterId(response.letter_id);
    },
    onError: (err) => {
      setGeneratedLetterId(null);
      if (err.reason === "upstream_contract" || err.reason === "upstream_generation" || err.reason === "unknown") {
        logger.error("[cover-letter/generate] upstream failure", {
          reason: err.reason,
          status: err.status,
          backendErrorCode: err.backendErrorCode,
          errorId: err.errorId,
          requestId: err.requestId,
          correlationId: getCorrelationId(),
        });
      }
      const baseMessage = err.validationErrors?.length
        ? "Please fix the highlighted fields and try again."
        : err.reason === "not_found"
          ? getGenerateNotFoundMessage(err.message)
          : ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      const reference = (err.reason === "upstream_contract" || err.reason === "upstream_generation" || err.reason === "unknown" || err.reason === "unavailable" || err.reason === "timeout") ? (err.errorId ?? err.requestId) : null;
      const message = reference ? `${baseMessage} Error reference: ${reference}` : baseMessage;
      setApiError(message);
      setActiveStep("resume");
    },
  });

  useEffect(() => {
    if (!generationAttemptKey || activeStep !== "generate") return;

    let cancelled = false;
    let timer: number | undefined;
    let misses = 0;
    const poll = async () => {
      let terminal = false;
      try {
        const progress = await getCoverLetterGenerationProgress(generationAttemptKey);
        if (cancelled) return;
        if (progress) {
          misses = 0;
          terminal = progress.status === "completed" || progress.status === "failed";
          // Never move an in-progress ring backwards; a terminal status always wins.
          setGenerationProgress((current) => (
            current && !terminal && current.progress > progress.progress ? current : progress
          ));
        } else {
          misses += 1;
        }
      } catch (err) {
        if (cancelled) return;
        misses += 1;
        // Progress is supplementary. The generate request remains the source
        // of truth for success and failure, so an unavailable status endpoint
        // must not interrupt the letter request or create a fake percentage.
        logger.debug("[cover-letter/generation-progress] polling failed", { err });
      }
      // One request at a time. Stop on a terminal status, or when the API keeps
      // returning nothing (no progress route yet): the ring stays indeterminate.
      if (!terminal && misses < MAX_PROGRESS_MISSES) timer = window.setTimeout(() => void poll(), 1_000);
    };

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeStep, generationAttemptKey]);

  async function handleSubmit() {
    if (!parsedResumeId) {
      setActiveStep("resume");
      setApiError("Choose or upload a resume before generating the letter.");
      return;
    }
    if (!jobSourceReady) {
      setActiveStep("resume");
      setApiError(getJobSourceMissingMessage(source));
      return;
    }
    const currentJdId = parsedJdFingerprint === jobSourceFingerprint ? parsedJdId : null;
    // A parsed jd_id is enough: a still-pending optional details lookup must
    // not block generation (changing the job clears its auto-filled values).
    if (!currentJdId) {
      if (jobAnalysisStatus !== "analyzing") void analyzeJobDetails();
      setActiveStep("resume");
      setApiError("Analyzing the job description. Review the filled details, then generate the letter.");
      return;
    }
    if (
      !companyName.trim()
      || !roleTitle.trim()
      || !location.trim()
      || !candidateSignatureName.trim()
    ) {
      setActiveStep("resume");
      setApiError("Fill in company name, job title, location, and signature name to continue.");
      return;
    }
    if (wordCountMode === "custom" && minWords > maxWords) {
      setActiveStep("resume");
      setApiError("Minimum words can't be greater than maximum words.");
      return;
    }
    const request = buildRequest();
    const attemptKey = mintIdempotencyKey(userId ?? "anon");
    pendingTemplateIdRef.current = selectedTemplateId;
    setApiError(null);
    setGeneratedLetterId(null);
    setGenerationAttemptKey(attemptKey);
    setGenerationProgress(null);
    setIsPreparing(true);
    setActiveStep("generate");
    try {
      await generation.mutate({
        body: {
          parsed_resume_id: parsedResumeId,
          resume_source: resumeSource,
          jd_id: currentJdId,
          ...(request.application_context && {
            application_context: request.application_context,
          }),
          ...(request.options && { options: request.options }),
          force_refresh: false,
        },
        attemptKey,
      });
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Could not prepare this job description. Please try again.";
      setApiError(message);
      toast.error(message);
      setActiveStep("resume");
    } finally {
      setIsPreparing(false);
    }
  }

  const resetFormAfterGeneration = useCallback(() => {
    try {
      window.sessionStorage.removeItem(COVER_LETTER_REFRESH_DRAFT_KEY);
    } catch {
      // Storage can be unavailable in private or locked-down browser contexts.
    }

    userPickedResumeRef.current = false;
    signatureResumeLoadRef.current = null;
    signatureResumeKeyRef.current = null;
    autoFilledJobFieldsRef.current.clear();
    jdTypedRef.current = false;
    clearJobAnalysis();
    setSource("jd");
    setJd("");
    setJdFile(null);
    setTrackerJobId("");
    setCompanyName("");
    setRoleTitle("");
    setLocation("");
    setHiringManagerName("");
    setCandidateSignatureName("");
    setSignatureResumeKey(null);
    setIncludeContactDetails(false);
    setWordCountMode("auto");
    setMinWords(250);
    setMaxWords(400);
    setUploadedResume(null);
    setSelectedResume(null);
    setApiError(null);
    setActiveStep("resume");
    setIsPreparing(false);
    setGeneratedLetterId(null);
    setGenerationAttemptKey(null);
    setGenerationProgress(null);
  }, [clearJobAnalysis]);

  const completeGenerationNavigation = useCallback(() => {
    if (!generatedLetterId) return;
    resetFormAfterGeneration();
    toast.success("Cover letter generated.");
    router.push(`/cover-letter/${encodeURIComponent(generatedLetterId)}`);
  }, [generatedLetterId, resetFormAfterGeneration, router]);

  function buildRequest(): CoverLetterFormSubmit {
    const noteParts = [
      selectedTemplate && `Preferred layout style: ${selectedTemplate.name}.`,
    ].filter(Boolean);
    const note = noteParts.join(" ").slice(0, MAX_NOTE_CHARS);
    const appCtxFields = {
      ...(companyName.trim() && { company_name: companyName.trim() }),
      ...(location.trim() && { company_location: location.trim() }),
      ...(roleTitle.trim() && { role_title: roleTitle.trim() }),
      ...(hiringManagerName.trim() && { hiring_manager_name: hiringManagerName.trim() }),
      ...(candidateSignatureName.trim() && { candidate_signature_name: candidateSignatureName.trim() }),
      ...(includeContactDetails && { include_contact_details: true }),
    };

    return {
      job_description: getJobSourceSummary(source, { jd, jdFile, trackerJobId }),
      ...(Object.keys(appCtxFields).length > 0 && {
        application_context: { ...appCtxFields, source: "user" as const },
      }),
      options: {
        tone,
        // "auto": omit both so the AI derives level-appropriate bounds from
        // the resume. "custom": send the user-chosen range (200-500, backend-
        // validated: min_words must not exceed max_words).
        ...(wordCountMode === "custom" && { min_words: minWords, max_words: maxWords }),
        ...(note && { candidate_note: note }),
        include_debug_metadata: false,
      },
    };
  }

  async function openResumePicker() {
    setResumePickerOpen(true);
    setResumePickerLoading(true);
    try {
      const result = await listCoverLetterResumeOptions();
      setResumeOptions(result.resumes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your resumes.";
      toast.error(message);
    } finally {
      setResumePickerLoading(false);
    }
  }

  function useResumeOption(option: CoverLetterResumeOption) {
    userPickedResumeRef.current = true;
    setResumePickCount((count) => count + 1);
    setUploadedResume(null);
    setSelectedResume(toResumeOptionBlob(option));
    setResumePickerOpen(false);
    setApiError(null);
  }

  async function makeDefaultResume(option: CoverLetterResumeOption) {
    setSettingDefaultResume(true);
    try {
      const nextDefault = await setDefaultCoverLetterResume({
        resume_id: option.resume_id,
        resume_source: option.source,
      });
      userPickedResumeRef.current = true;
      setResumePickCount((count) => count + 1);
      setUploadedResume(null);
      setSelectedResume(
        toDefaultResumeBlob({
          ...nextDefault,
          is_user_default: true,
          selection_reason: "user_default",
        })
        ?? toResumeOptionBlob({
          ...option,
          is_user_default: true,
        }),
      );
      setResumeOptions((items) =>
        items.map((item) => ({
          ...item,
          is_user_default: item.resume_id === option.resume_id && item.source === option.source,
        })),
      );
      await defaultResume.refetch();
      toast.success("Default resume updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update default resume.";
      toast.error(message);
    } finally {
      setSettingDefaultResume(false);
    }
  }

  async function makeCurrentResumeDefault() {
    if (!parsedResumeId) {
      toast.error("Select a resume before setting a default.");
      return;
    }
    setSettingDefaultResume(true);
    try {
      const nextDefault = await setDefaultCoverLetterResume({
        resume_id: parsedResumeId,
        resume_source: resumeSource as "parser" | "builder",
      });
      const currentResumeAsDefault =
        resume && parsedResumeId === getCoverLetterParsedResumeId(resume) && resumeSource === getCoverLetterResumeSource(resume)
          ? { ...resume, is_user_default: true }
          : null;
      setUploadedResume(null);
      setSelectedResume(
        currentResumeAsDefault
        ?? toDefaultResumeBlob({
          ...nextDefault,
          is_user_default: true,
          selection_reason: "user_default",
        }),
      );
      setResumeOptions((items) =>
        items.map((item) => ({
          ...item,
          is_user_default: item.resume_id === parsedResumeId && item.source === resumeSource,
        })),
      );
      await defaultResume.refetch();
      toast.success("Default resume updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update default resume.";
      toast.error(message);
    } finally {
      setSettingDefaultResume(false);
    }
  }

  const loadingInitial = false;

  return (
    <main className="min-h-full bg-[#fbfdff] px-4 pb-10 pt-5 text-[#070b33] sm:px-5 lg:px-6 2xl:px-8 2xl:pb-12 2xl:pt-7">
      <div className="mx-auto max-w-[1180px] space-y-4 2xl:max-w-[1260px] 2xl:space-y-5">
        <header className="grid items-center gap-4 lg:grid-cols-[1fr_auto]">
          <StepRail
            activeStep={activeStep}
            onStepClick={
              isPreparing || generation.isLoading
                ? () => undefined
                : (step) => {
                    if (step === "resume") setActiveStep("resume");
                  }
            }
          />
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <Link
              href="/cover-letter/history"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe6f5] bg-white px-3 text-xs font-bold text-[#263363] transition hover:border-[#2557a7]/40 hover:bg-blue-50 hover:text-[#2557a7] 2xl:h-10 2xl:px-4 2xl:text-sm"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#263363] 2xl:text-sm">
              <ShieldCheck className="h-4 w-4 text-[#263363] 2xl:h-5 2xl:w-5" />
              Your data is secure
            </span>
            <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 2xl:h-10 2xl:px-4 2xl:text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Auto-saved
            </span>
          </div>
        </header>

        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {apiError}
          </div>
        )}
        {jobAnalysisStatus === "analyzing" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-[#526187]" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-[#2557a7]" aria-hidden="true" />
            Analyzing job details… You can continue editing the form.
          </div>
        )}

        {loadingInitial ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white 2xl:min-h-[520px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#2557a7]" />
          </div>
        ) : (
          <div className="relative">
            {activeStep === "resume" && (
              <CoverLetterStepOneMock
                hasResume={Boolean(resume)}
                latestLoading={latest.isLoading || gate.isLoading || defaultResume.isLoading}
                isUploading={uploader.isUploading}
                uploadError={uploader.uploadError}
                resume={resume}
                onRefresh={() => void Promise.all([gate.refetch(), latest.refetch(), defaultResume.refetch()])}
                onUpload={(file) => void uploader.uploadResume(file)}
                onOpenResumePicker={() => void openResumePicker()}
                onMakeCurrentDefault={() => void makeCurrentResumeDefault()}
                isSettingDefaultResume={settingDefaultResume}
                source={source}
                onSourceChange={(s) => { clearJobAnalysis(); setSource(s); setApiError(null); }}
                jd={jd}
                onJdChange={(value) => { jdTypedRef.current = true; clearJobAnalysis(); setJd(value); }}
                onJdBlur={() => void analyzeJobDetails()}
                jdFile={jdFile}
                onJdFileChange={(file) => { clearJobAnalysis(); setJdFile(file); }}
                trackerJobId={trackerJobId}
                onTrackerJobIdChange={(value) => { clearJobAnalysis(); setTrackerJobId(value); }}
                onAnalyzeTrackerJob={() => void analyzeJobDetails()}
                companyName={companyName}
                onCompanyNameChange={(value) => {
                  autoFilledJobFieldsRef.current.delete("company");
                  extensionJobFieldsRef.current.delete("company");
                  setCompanyName(value);
                }}
                roleTitle={roleTitle}
                onRoleTitleChange={(value) => {
                  autoFilledJobFieldsRef.current.delete("title");
                  extensionJobFieldsRef.current.delete("title");
                  setRoleTitle(value);
                }}
                location={location}
                onLocationChange={(value) => {
                  autoFilledJobFieldsRef.current.delete("location");
                  extensionJobFieldsRef.current.delete("location");
                  setLocation(value);
                }}
                hiringManagerName={hiringManagerName}
                onHiringManagerNameChange={setHiringManagerName}
                candidateSignatureName={candidateSignatureName}
                onCandidateSignatureNameChange={setCandidateSignatureName}
                includeContactDetails={includeContactDetails}
                onIncludeContactDetailsChange={setIncludeContactDetails}
                jdReady={jobSourceReady}
                tone={tone}
                onToneChange={setTone}
                wordCountMode={wordCountMode}
                onWordCountModeChange={setWordCountMode}
                minWords={minWords}
                onMinWordsChange={setMinWords}
                maxWords={maxWords}
                onMaxWordsChange={setMaxWords}
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={handleTemplateChange}
                templateCatalog={templateCatalog.templates}
                defaultTemplateId={defaultTemplate.defaultTemplate?.template_id}
                isSavingDefaultTemplate={defaultTemplate.isSaving}
                onSetDefaultTemplate={async (id) => {
                  try {
                    await defaultTemplate.setDefault(id);
                    toast.success("Default cover-letter template updated.");
                  } catch {
                    toast.error("Could not update your default template.");
                  }
                }}
                onContinue={() => void handleSubmit()}
              />
            )}

            {activeStep === "generate" && (
              <GeneratingModal
                isPreparing={isPreparing}
                isGenerating={generation.isLoading}
                isComplete={Boolean(generatedLetterId)}
                progress={generationProgress}
                onComplete={completeGenerationNavigation}
                onReturnToForm={() => {
                  if (generatedLetterId) return;
                  generation.abort();
                  setActiveStep("resume");
                  setIsPreparing(false);
                  setGeneratedLetterId(null);
                  setGenerationAttemptKey(null);
                  setGenerationProgress(null);
                }}
                selectedTemplate={selectedTemplate.name}
                roleTitle={roleTitle}
                companyName={companyName}
              />
            )}
          </div>
        )}
      </div>

      <ResumePickerModal
        open={resumePickerOpen}
        options={resumeOptions}
        selectedResumeId={parsedResumeId}
        selectedResumeSource={resumeSource}
        isLoading={resumePickerLoading}
        isSettingDefault={settingDefaultResume}
        onClose={() => setResumePickerOpen(false)}
        onUse={useResumeOption}
        onMakeDefault={(option) => void makeDefaultResume(option)}
      />

      <SignUpModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        initialFormType="signin"
        redirectTo="/cover-letter/new"
        onSuccess={() => void Promise.all([gate.refetch(), latest.refetch(), defaultResume.refetch()])}
      />
    </main>
  );
}

function StepRail({
  activeStep,
  onStepClick,
}: {
  activeStep: BuilderStep;
  onStepClick: (step: BuilderStep) => void;
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const complete = index < activeIndex;
        const isLast = index === steps.length - 1;
        return (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={[
                  "flex-1 h-0.5 transition-colors duration-300",
                  index === 0
                    ? "opacity-0"
                    : index <= activeIndex
                      ? "bg-[#2557a7]"
                      : "bg-slate-200",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-300 2xl:h-12 2xl:w-12 2xl:text-base",
                  isActive
                    ? "border-[#2557a7] bg-[#2557a7] text-white shadow-lg shadow-blue-200"
                    : complete
                      ? "border-[#2557a7] bg-[#2557a7] text-white"
                      : "border-[#cfd8ef] bg-white text-[#101947] hover:border-[#2557a7]/40",
                ].join(" ")}
              >
                {complete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
              </button>
              <div
                className={[
                  "flex-1 h-[3px] transition-colors duration-300",
                  isLast
                    ? "opacity-0"
                    : index < activeIndex
                      ? "bg-[#2557a7]"
                      : "bg-[#d7deee]",
                ].join(" ")}
              />
            </div>
            <div className="mt-2 px-1 text-center 2xl:mt-3">
              <p
                className={[
                  "text-xs font-black 2xl:text-sm",
                  isActive
                    ? "text-[#2557a7]"
                    : complete
                      ? "text-[#2557a7]"
                      : "text-[#101947]",
                ].join(" ")}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoverLetterStepOneMock({
  hasResume,
  latestLoading,
  isUploading,
  uploadError,
  resume,
  onRefresh,
  onUpload,
  onOpenResumePicker,
  onMakeCurrentDefault,
  isSettingDefaultResume,
  source,
  onSourceChange,
  jd,
  onJdChange,
  onJdBlur,
  jdFile,
  onJdFileChange,
  trackerJobId,
  onTrackerJobIdChange,
  onAnalyzeTrackerJob,
  companyName,
  onCompanyNameChange,
  roleTitle,
  onRoleTitleChange,
  location,
  onLocationChange,
  hiringManagerName,
  onHiringManagerNameChange,
  candidateSignatureName,
  onCandidateSignatureNameChange,
  includeContactDetails,
  onIncludeContactDetailsChange,
  jdReady,
  tone,
  onToneChange,
  wordCountMode,
  onWordCountModeChange,
  minWords,
  onMinWordsChange,
  maxWords,
  onMaxWordsChange,
  selectedTemplateId,
  onTemplateChange,
  templateCatalog,
  defaultTemplateId,
  isSavingDefaultTemplate,
  onSetDefaultTemplate,
  onContinue,
}: {
  hasResume: boolean;
  latestLoading: boolean;
  isUploading: boolean;
  uploadError: string | null;
  resume: ParsedResumeBlob | null;
  onRefresh: () => void;
  onUpload: (file: File) => void;
  onOpenResumePicker: () => void;
  onMakeCurrentDefault: () => void;
  isSettingDefaultResume: boolean;
  source: CreationSource;
  onSourceChange: (s: CreationSource) => void;
  jd: string;
  onJdChange: (v: string) => void;
  onJdBlur: () => void;
  jdFile: File | null;
  onJdFileChange: (f: File | null) => void;
  trackerJobId: string;
  onTrackerJobIdChange: (v: string) => void;
  onAnalyzeTrackerJob: () => void;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  roleTitle: string;
  onRoleTitleChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  hiringManagerName: string;
  onHiringManagerNameChange: (v: string) => void;
  candidateSignatureName: string;
  onCandidateSignatureNameChange: (v: string) => void;
  includeContactDetails: boolean;
  onIncludeContactDetailsChange: (v: boolean) => void;
  jdReady: boolean;
  tone: ToneChoice;
  onToneChange: (tone: ToneChoice) => void;
  wordCountMode: "auto" | "custom";
  onWordCountModeChange: (mode: "auto" | "custom") => void;
  minWords: number;
  onMinWordsChange: (v: number) => void;
  maxWords: number;
  onMaxWordsChange: (v: number) => void;
  selectedTemplateId: TemplateStyleId;
  onTemplateChange: (id: TemplateStyleId) => void;
  templateCatalog: CoverLetterTemplate[];
  defaultTemplateId?: CoverLetterTemplateId;
  isSavingDefaultTemplate: boolean;
  onSetDefaultTemplate: (id: CoverLetterTemplateId) => Promise<void>;
  onContinue: () => void;
}) {
  const inputId = "cover-letter-resume-upload-mock";
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const selectedTemplate = templateStyles.find((template) => template.id === selectedTemplateId) ?? templateStyles[1];
  const stats = deriveResumeStatsForStepOne(resume);
  const detailsReady =
    companyName.trim().length > 0
    && roleTitle.trim().length > 0
    && location.trim().length > 0
    && candidateSignatureName.trim().length > 0;
  const canContinue = hasResume && jdReady && detailsReady && (wordCountMode === "auto" || minWords <= maxWords);
  const resumeName = getResumeDisplayName(resume);
  const isBuilderResume = resume?.source === "builder";
  const isDefaultResume = Boolean(resume?.is_user_default);
  const builderResumeId = isBuilderResume ? getCoverLetterParsedResumeId(resume) : null;
  const builderResumeHref = builderResumeId
    ? `/builder/creation/${encodeURIComponent(builderResumeId)}?return_to=/cover-letter/new`
    : "/builder/start?return_to=/cover-letter/new";
  const continueHint = !hasResume
      ? "Upload, select, or build a resume to continue."
    : !jdReady
      ? `Paste at least ${MIN_JD_CHARS} characters of job description to continue.`
    : !detailsReady
      ? "Fill in company name, job title, location, and signature name to continue."
      : "Ready to generate your cover letter.";

  function handleResumeDragEnter(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleResumeDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleResumeDragLeave(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleResumeDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !isUploading) onUpload(file);
  }

  return (
    <section className="space-y-4 2xl:space-y-5">
      <div className="pt-3 2xl:pt-5">
        <h1 className="text-[26px] font-black leading-tight text-[#070b33] lg:text-[30px] 2xl:text-[34px]">
          Let&apos;s get started <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#344272] 2xl:text-base 2xl:leading-7">
          Add your resume and job details to create a tailored cover letter.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)] 2xl:grid-cols-[500px_minmax(0,1fr)] 2xl:gap-5">
      <div className="space-y-4 2xl:space-y-5">
      <div className="grid grid-cols-1 items-center gap-5 rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.07)] 2xl:px-7 2xl:py-7">
        <div className="flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f6fb] 2xl:h-32 2xl:w-32">
            <div className="absolute inset-0 rounded-full bg-blue-100/40 blur-2xl" />
            <div className="relative flex h-[72px] w-[58px] items-center justify-center rounded-xl bg-[#dfe8ff] text-[#2557a7] shadow-sm 2xl:h-[92px] 2xl:w-[76px]">
              <FileText className="h-9 w-9 2xl:h-12 2xl:w-12" />
              <span className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[#2557a7] text-white shadow-lg shadow-blue-200 2xl:h-10 2xl:w-10">
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">
            {hasResume ? "Resume for this cover letter" : "Upload your resume"}
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
            {hasResume
              ? isBuilderResume
                ? "This Resume Builder resume will be used to generate the cover letter."
                : "This parsed resume will be used to generate the cover letter."
              : "Upload a resume or choose your saved default resume."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 2xl:mt-6 2xl:gap-4">
            <button
              type="button"
              onClick={onOpenResumePicker}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe6f5] bg-white px-4 text-xs font-black text-[#263363] transition hover:border-[#2557a7]/40 hover:bg-blue-50 hover:text-[#2557a7] 2xl:h-12 2xl:px-5 2xl:text-sm"
            >
              <Search className="h-4 w-4" />
              {hasResume ? "Change resume" : "Choose saved resume"}
            </button>
            {hasResume && !isUploading && !isDefaultResume && (
              <button
                type="button"
                onClick={onMakeCurrentDefault}
                disabled={isSettingDefaultResume}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 2xl:h-12 2xl:px-5 2xl:text-sm"
              >
                {isSettingDefaultResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Set as default
              </button>
            )}
            <input
              ref={resumeInputRef}
              id={inputId}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.currentTarget.value = "";
              }}
            />
            <Link
              href={builderResumeHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-black text-[#2557a7] transition hover:bg-blue-50 hover:text-[#1e4a94] 2xl:text-sm"
            >
              <PenLine className="h-4 w-4" />
              {isBuilderResume ? "Edit builder resume" : "Build resume instead"}
            </Link>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload resume by drag and drop or file picker"
            onClick={() => resumeInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                resumeInputRef.current?.click();
              }
            }}
            onDragEnter={handleResumeDragEnter}
            onDragOver={handleResumeDragOver}
            onDragLeave={handleResumeDragLeave}
            onDrop={handleResumeDrop}
            className={[
              "mt-4 flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed px-4 py-4 text-left transition duration-300",
              isDragging
                ? "border-[#2557a7] bg-blue-50 shadow-inner ring-4 ring-blue-100"
                : "border-[#9fb7e8] bg-[#f4f8ff] shadow-[0_10px_28px_rgba(37,87,167,0.08)] hover:-translate-y-0.5 hover:border-[#2557a7] hover:bg-blue-50",
            ].join(" ")}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2557a7] text-white shadow-md shadow-blue-200">
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-[#2557a7]">
                {hasResume ? "Upload new resume" : "Upload resume"}
              </span>
              <span className="mt-1 block text-xs font-medium leading-5 text-[#344272]">
                Click to browse or drag & drop PDF/DOCX here. Max file size {MAX_RESUME_UPLOAD_MB}MB.
              </span>
            </span>
            <span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#2557a7] shadow-sm ring-1 ring-blue-100 sm:inline-flex">
              Browse
            </span>
          </div>
          {!hasResume && (
            <p className="mt-2 text-xs font-bold text-[#2557a7] 2xl:text-sm">
              Saved default resume available? Use Choose saved resume to select it.
            </p>
          )}
          {(isUploading || hasResume) && (
            <div className="mt-4 flex max-w-xl items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#070b33]">
                  {isUploading ? "Parsing resume..." : resumeName}
                </p>
                <p className="text-xs font-semibold text-emerald-700">
                  {isUploading
                    ? "This usually takes a few seconds."
                    : isBuilderResume
                      ? "No parsing needed. Builder resume will be used directly."
                      : "Parsed resume is ready for this cover letter."}
                </p>
              </div>
              {!isUploading && (
                <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black",
                      isDefaultResume ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-[#2557a7]",
                    ].join(" ")}
                  >
                    {isDefaultResume && <Star className="h-3.5 w-3.5 fill-current" />}
                    {isDefaultResume ? "Default resume" : "Selected for this letter"}
                  </span>
                </div>
              )}
            </div>
          )}
          {uploadError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.06)] 2xl:px-7 2xl:py-7">
        <div className="flex flex-wrap items-center gap-5">
          <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">Resume summary</h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {hasResume
              ? isBuilderResume
                ? "Selected from Resume Builder"
                : "Parsed successfully"
              : "Waiting for resume"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={latestLoading}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#344272] transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className={["h-4 w-4", latestLoading ? "animate-spin" : ""].join(" ")} />
            Refresh
          </button>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
          {hasResume
            ? isBuilderResume
              ? `Using ${resumeName} from Resume Builder for this cover letter.`
              : `Using ${resumeName} for this cover letter.`
            : "Upload a resume to see parsed experience, skills, keywords, and education records."}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:mt-7">
          <ResumeMetric icon={BriefcaseBusiness} tone="blue" value={stats?.yearsLabel ?? "-"} label="Years Experience" />
          <ResumeMetric icon={Zap} tone="green" value={stats ? stats.skillCount.toString() : "-"} label="Skills Identified" />
          <ResumeMetric icon={Sparkles} tone="purple" value={stats?.keywordCount?.toString() ?? "-"} label="ATS Keywords" />
          <ResumeMetric icon={GraduationCap} tone="amber" value={stats ? stats.eduCount.toString() : "-"} label="Education Records" />
          <div className="hidden">
            <div className="relative h-24 w-24 rounded-lg bg-[#eef3ff] shadow-[0_16px_28px_rgba(37,87,167,0.1)] 2xl:h-28 2xl:w-28">
              <FileText className="absolute left-7 top-6 h-10 w-10 text-[#9eb5ff] 2xl:left-8 2xl:top-7 2xl:h-12 2xl:w-12" />
              <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2557a7] text-white shadow-lg shadow-blue-200 2xl:h-12 2xl:w-12">
                <CheckCircle2 className="h-6 w-6 2xl:h-7 2xl:w-7" />
              </span>
            </div>
          </div>
        </div>
      </div>

      </div>

      <div className="self-start rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.06)] 2xl:px-7 2xl:py-7">
        <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">Job description</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
          Paste the full job description and basic details of the role.
        </p>
        <div className="mt-6 grid gap-6 2xl:mt-8 2xl:gap-7">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-black text-[#070b33]">
                Job description <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSourceChange("jd");
                    navigator.clipboard?.readText().then(onJdChange).catch(() => toast.info("Clipboard unavailable."));
                  }}
                  className={["inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition", source === "jd" ? "border-[#2557a7] bg-blue-50 text-[#2557a7]" : "border-[#dfe6f5] bg-white text-[#263363] hover:border-[#2557a7]/40"].join(" ")}
                >
                  <Clipboard className="h-4 w-4" />
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => onSourceChange("upload")}
                  className={["inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition", source === "upload" ? "border-[#2557a7] bg-blue-50 text-[#2557a7]" : "border-[#dfe6f5] bg-white text-[#263363] hover:border-[#2557a7]/40"].join(" ")}
                >
                  <Upload className="h-4 w-4" />
                  Upload JD
                </button>
              </div>
            </div>
            {source === "jd" ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={jd}
                  onChange={(e) => onJdChange(e.target.value)}
                  onBlur={onJdBlur}
                  rows={7}
                  placeholder="Paste the full job description here..."
                  className="min-h-[190px] w-full resize-none rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-5 py-4 text-[15px] font-medium leading-7 text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_12px_30px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100"
                />
                <p className={["px-4 text-sm font-medium", jdReady ? "text-emerald-600" : "text-[#344272]"].join(" ")}>
                  {jd.length} characters
                </p>
              </div>
            ) : (
              <JobSourceInput
                source={source as Exclude<CreationSource, "jd">}
                jd={jd}
                onJdChange={onJdChange}
                jdFile={jdFile}
                onJdFileChange={onJdFileChange}
                trackerJobId={trackerJobId}
                onTrackerJobIdChange={onTrackerJobIdChange}
                onTrackerJobIdBlur={onAnalyzeTrackerJob}
                ready={jdReady}
              />
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 2xl:gap-6">
            <div>
              <label className="text-sm font-black text-[#070b33]">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                placeholder="e.g. Globex Corporation"
                className="mt-2 h-11 w-full rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-3 text-sm font-semibold text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_10px_24px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100 2xl:mt-3 2xl:h-14 2xl:px-4 2xl:text-[15px]"
              />
            </div>
            <div>
              <AutocompleteTextField
                label="Job title"
                value={roleTitle}
                onChange={onRoleTitleChange}
                placeholder="e.g. Senior Backend Engineer"
                suggestions={jobTitleSuggestions}
                maxLength={MAX_ROLE_TITLE_CHARS}
              />
            </div>
            <div className="sm:col-span-2">
              <AutocompleteTextField
                label="Location"
                value={location}
                onChange={onLocationChange}
                placeholder="e.g. Bengaluru, India"
                suggestions={locationSuggestions}
                maxLength={MAX_COMPANY_LOCATION_CHARS}
              />
            </div>
            <div>
              <label className="text-sm font-black text-[#070b33]">
                Hiring manager <span className="font-semibold text-[#6b789c]">(optional)</span>
              </label>
              <input
                type="text"
                value={hiringManagerName}
                onChange={(e) => onHiringManagerNameChange(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-2 h-11 w-full rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-3 text-sm font-semibold text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_10px_24px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100 2xl:mt-3 2xl:h-14 2xl:px-4 2xl:text-[15px]"
              />
            </div>
            <div>
              <label className="text-sm font-black text-[#070b33]">
                Signature name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={candidateSignatureName}
                onChange={(e) => onCandidateSignatureNameChange(e.target.value)}
                placeholder="e.g. Ananya Rao"
                className="mt-2 h-11 w-full rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-3 text-sm font-semibold text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_10px_24px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100 2xl:mt-3 2xl:h-14 2xl:px-4 2xl:text-[15px]"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-[#d8e0ef] bg-[#f8fbff] px-4 py-4 transition hover:border-[#2557a7] hover:bg-blue-50/40 sm:col-span-2">
              <input
                type="checkbox"
                checked={includeContactDetails}
                onChange={(e) => onIncludeContactDetailsChange(e.target.checked)}
                className="sr-only"
              />
              <span
                className={[
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                  includeContactDetails
                    ? "border-[#2557a7] bg-[#2557a7] text-white"
                    : "border-[#bfd0ef] bg-white text-transparent",
                ].join(" ")}
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-black text-[#070b33]">Include contact details</span>
                <span className="mt-1 block text-sm font-medium leading-6 text-[#344272]">
                  Add exact name, email, phone, and location from the selected resume.
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      </div>

      <div className="rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.06)] 2xl:px-7 2xl:py-7">
        <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">Writing tone</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
          Choose the tone that best matches the role and your personal style.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:mt-7 2xl:gap-5">
          {toneOptions.map((option) => {
            const selected = tone === option.id;
            const ToneIcon = option.id === "professional" ? BriefcaseBusiness : option.id === "warm" ? Sparkles : PenLine;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToneChange(option.id)}
                className={[
                  "group relative min-h-[132px] rounded-lg border bg-white p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl 2xl:min-h-[172px] 2xl:p-5",
                  selected ? "border-[#2557a7] bg-blue-50/30 shadow-[0_16px_36px_rgba(37,87,167,0.12)]" : "border-[#dfe6f5]",
                ].join(" ")}
              >
                <span className={["flex h-11 w-11 items-center justify-center rounded-full 2xl:h-16 2xl:w-16", option.id === "professional" ? "bg-blue-50 text-[#2557a7]" : option.id === "warm" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-500"].join(" ")}>
                  <ToneIcon className="h-5 w-5 2xl:h-8 2xl:w-8" />
                </span>
                <span className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full border border-[#bfd0ef] bg-white 2xl:right-7 2xl:top-7 2xl:h-6 2xl:w-6">
                  {selected && <span className="h-4 w-4 rounded-full bg-[#2557a7]" />}
                </span>
                <span className="mt-4 block text-sm font-black text-[#070b33] 2xl:mt-6 2xl:text-base">{option.label}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-[#344272] 2xl:mt-2 2xl:text-sm 2xl:leading-6">{option.helper}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.06)] 2xl:px-7 2xl:py-7">
        <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">Word count</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
          Let the AI pick a length that fits your experience level, or set your own range.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onWordCountModeChange("auto")}
            className={[
              "rounded-lg border p-4 text-left transition duration-200",
              wordCountMode === "auto" ? "border-[#2557a7] bg-blue-50/30 shadow-[0_10px_24px_rgba(37,87,167,0.1)]" : "border-[#dfe6f5] hover:border-[#bfd0ef]",
            ].join(" ")}
          >
            <span className="block text-sm font-black text-[#070b33]">Match my experience level (recommended)</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-[#344272]">
              The AI adapts the length to your resume &mdash; shorter for early-career, longer for senior/leadership roles.
            </span>
          </button>
          <button
            type="button"
            onClick={() => onWordCountModeChange("custom")}
            className={[
              "rounded-lg border p-4 text-left transition duration-200",
              wordCountMode === "custom" ? "border-[#2557a7] bg-blue-50/30 shadow-[0_10px_24px_rgba(37,87,167,0.1)]" : "border-[#dfe6f5] hover:border-[#bfd0ef]",
            ].join(" ")}
          >
            <span className="block text-sm font-black text-[#070b33]">Set a custom range</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-[#344272]">
              Choose your own min/max word count ({WORD_COUNT_FLOOR}&ndash;{WORD_COUNT_CEIL}).
            </span>
          </button>
        </div>
        {wordCountMode === "custom" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-[#344272]">Minimum words</span>
              <input
                type="number"
                min={WORD_COUNT_FLOOR}
                max={WORD_COUNT_CEIL}
                step={10}
                value={minWords}
                onChange={(e) => onMinWordsChange(Number(e.target.value))}
                onBlur={() => onMinWordsChange(Math.min(Math.max(minWords, WORD_COUNT_FLOOR), WORD_COUNT_CEIL))}
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe6f5] px-3 text-sm font-semibold text-[#070b33] focus:border-[#2557a7] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-[#344272]">Maximum words</span>
              <input
                type="number"
                min={WORD_COUNT_FLOOR}
                max={WORD_COUNT_CEIL}
                step={10}
                value={maxWords}
                onChange={(e) => onMaxWordsChange(Number(e.target.value))}
                onBlur={() => onMaxWordsChange(Math.min(Math.max(maxWords, WORD_COUNT_FLOOR), WORD_COUNT_CEIL))}
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe6f5] px-3 text-sm font-semibold text-[#070b33] focus:border-[#2557a7] focus:outline-none"
              />
            </label>
            {minWords > maxWords && (
              <p className="sm:col-span-2 text-xs font-semibold text-red-600">
                Minimum words can&apos;t be greater than maximum words.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#dfe6f5] bg-white px-5 py-5 shadow-[0_14px_38px_rgba(18,42,94,0.06)] 2xl:px-7 2xl:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className={["mt-1 h-10 w-10 shrink-0 rounded-xl 2xl:h-14 2xl:w-14", selectedTemplate.accent].join(" ")} />
            <div>
              <h2 className="text-[20px] font-black leading-tight text-[#070b33] 2xl:text-[22px]">Cover letter template</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#344272] 2xl:text-[15px] 2xl:leading-7">
                {selectedTemplate.name} template selected. You can change it now or again after generation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#2557a7] bg-white px-4 text-xs font-black text-[#2557a7] transition hover:bg-blue-50 2xl:h-12 2xl:px-5 2xl:text-sm"
          >
            <Search className="h-4 w-4" />
            Browse Templates
          </button>
        </div>
      </div>

      <div className="grid gap-5 pb-5 lg:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px] 2xl:gap-7">
        <div className="grid gap-4 rounded-lg border border-[#dfe6f5] bg-white/80 px-4 py-4 shadow-[0_12px_36px_rgba(18,42,94,0.04)] sm:grid-cols-3 2xl:px-6 2xl:py-5">
          <TrustItem icon={ShieldCheck} title="Your data is private & secure" subtitle="We never share your information." />
          <TrustItem icon={Sparkles} title="ATS friendly" subtitle="Optimized for better results." />
          <TrustItem icon={Upload} title="Auto-saved" subtitle="Your progress is saved automatically." />
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:opacity-50 2xl:h-14 2xl:gap-3 2xl:px-8 2xl:text-lg"
          >
            Generate cover letter
            <WandSparkles className="h-5 w-5 2xl:h-6 2xl:w-6" />
          </button>
          <p className={["mt-4 text-sm font-semibold", canContinue ? "text-emerald-700" : "text-[#344272]"].join(" ")}>
            {continueHint}
          </p>
        </div>
      </div>

      <TemplatePickerDrawer
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        onClose={() => setTemplatesOpen(false)}
        open={templatesOpen}
        templates={templateCatalog}
        defaultTemplateId={defaultTemplateId}
        isSavingDefaultTemplate={isSavingDefaultTemplate}
        onSetDefaultTemplate={onSetDefaultTemplate}
      />
    </section>
  );
}

function ResumeMetric({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: "blue" | "green" | "purple" | "amber";
  value: string;
  label: string;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-[#2557a7]",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e4ebf7] bg-[#fbfdff] p-3 2xl:gap-4 2xl:p-4">
      <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-full 2xl:h-12 2xl:w-12", toneClass].join(" ")}>
        <Icon className="h-5 w-5 2xl:h-6 2xl:w-6" />
      </span>
      <div>
        <p className="text-lg font-black text-[#070b33] 2xl:text-xl">{value}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-[#344272] 2xl:text-sm 2xl:leading-5">{label}</p>
      </div>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 2xl:gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-[#2557a7] 2xl:h-12 2xl:w-12">
        <Icon className="h-5 w-5 2xl:h-6 2xl:w-6" />
      </span>
      <span>
        <span className="block text-xs font-black text-[#070b33] 2xl:text-sm">{title}</span>
        <span className="mt-1 block text-xs font-medium text-[#344272] 2xl:text-sm">{subtitle}</span>
      </span>
    </div>
  );
}

function getResumeDisplayName(resume: ParsedResumeBlob | null): string {
  if (!resume) return "Selected resume";
  const personalInfo = resume.personalInfo as Record<string, unknown> | undefined;
  const builderResume = resume.builder_resume as Record<string, unknown> | undefined;
  const builderPersonalInfo = builderResume?.personalInfo as Record<string, unknown> | undefined;
  const professionalSummary = resume.professionalSummary as Record<string, unknown> | undefined;
  const builderProfessionalSummary = builderResume?.professionalSummary as Record<string, unknown> | undefined;
  const directName = [
    resume.display_name,
    resume.source_file_name,
    resume.file_name,
    resume.filename,
    resume.name,
    personalInfo?.fullname,
    professionalSummary?.targetRole,
    builderPersonalInfo?.fullname,
    builderProfessionalSummary?.targetRole,
    (resume.parsed_data as Record<string, unknown> | undefined)?.source_file_name,
    (resume.parsed_data as Record<string, unknown> | undefined)?.file_name,
  ].find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof directName === "string" ? directName : "Resume";
}

/** Returns a person's parsed name only; it never uses a resume file or display name as a signature. */
function getResumeSignatureName(resume: ParsedResumeBlob | null): string | undefined {
  if (!resume) return undefined;

  const parsedData = getNestedRecord(resume.parsed_data);
  const parserLlmData = getNestedRecord(parsedData.llm_data);
  const builderResume = getNestedRecord(resume.builder_resume);
  const records = [
    getNestedRecord(resume.personalInfo),
    getNestedRecord(resume.personal_info),
    getNestedRecord(resume.contact),
    parsedData,
    getNestedRecord(parsedData.personalInfo),
    getNestedRecord(parsedData.personal_info),
    getNestedRecord(parsedData.contact),
    parserLlmData,
    getNestedRecord(parserLlmData.personalInfo),
    getNestedRecord(parserLlmData.personal_info),
    getNestedRecord(parserLlmData.contact),
    getNestedRecord(builderResume.personalInfo),
    getNestedRecord(builderResume.personal_info),
    getNestedRecord(builderResume.contact),
  ];

  for (const record of records) {
    const name = [record.full_name, record.fullname, record.name]
      .map((value) => {
        if (typeof value === "string") return value.trim();
        const nestedValue = getNestedRecord(value).value;
        return typeof nestedValue === "string" ? nestedValue.trim() : undefined;
      })
      .find((value): value is string => Boolean(value));
    if (name) return name.slice(0, MAX_COMPANY_LOCATION_CHARS);
  }

  return undefined;
}

function getBuilderResumeDisplayName(resume: unknown): string | null {
  if (!resume || typeof resume !== "object") return null;
  const record = resume as Record<string, unknown>;
  const personalInfo = record.personalInfo as Record<string, unknown> | undefined;
  const professionalSummary = record.professionalSummary as Record<string, unknown> | undefined;
  const directName = [
    personalInfo?.fullname,
    professionalSummary?.targetRole,
    record.display_name,
    record.name,
  ].find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof directName === "string" ? directName.trim() : null;
}

function toDefaultResumeBlob(
  defaultResume: ReturnType<typeof useDefaultCoverLetterResume>["defaultResume"],
): ParsedResumeBlob | null {
  if (!defaultResume?.resume_id) {
    return null;
  }

  const isUserDefault =
    defaultResume.is_user_default === true || defaultResume.selection_reason === "user_default";

  if (defaultResume.is_usable_for_cover_letter === false && !isUserDefault) {
    return null;
  }

  if (defaultResume.source === "parser") {
    return {
      source: "parser",
      parsed_resume_id: defaultResume.resume_id,
      resume_id: defaultResume.resume_id,
      display_name: defaultResume.display_name ?? "Parsed resume",
      file_name: defaultResume.display_name ?? "Parsed resume",
      status: defaultResume.status,
      updated_at: defaultResume.updated_at ?? undefined,
      summary: defaultResume.summary ?? undefined,
      is_user_default: isUserDefault,
    };
  }

  if (defaultResume.source === "builder") {
    return {
      source: "builder",
      resume_id: defaultResume.resume_id,
      display_name: defaultResume.display_name ?? "Resume Builder resume",
      status: defaultResume.status,
      updated_at: defaultResume.updated_at ?? undefined,
      summary: defaultResume.summary ?? undefined,
      is_user_default: isUserDefault,
    };
  }

  return null;
}

function toResumeOptionBlob(option: CoverLetterResumeOption): ParsedResumeBlob {
  const base = {
    source: option.source,
    resume_id: option.resume_id,
    display_name: option.display_name,
    status: option.status ?? undefined,
    updated_at: option.updated_at ?? undefined,
    summary: option.summary ?? undefined,
    is_user_default: option.is_user_default ?? false,
  };

  if (option.source === "parser") {
    return {
      ...base,
      parsed_resume_id: option.resume_id,
      file_name: option.display_name,
    };
  }

  return base;
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function countCollectionItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean).length || (value.trim() ? 1 : 0);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const groupedCount = Object.values(record).reduce<number>((count, nested) => {
      if (Array.isArray(nested) || typeof nested === "string") {
        return count + countCollectionItems(nested);
      }
      return count;
    }, 0);
    return groupedCount || 1;
  }
  return value ? 1 : 0;
}

function getCollectionEntries(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nestedArrays = Object.values(record).filter(Array.isArray).flat();
    if (nestedArrays.length > 0) {
      return nestedArrays.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
    }
    return [record];
  }
  return [];
}

function parseResumeDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["present", "current", "now", "till date", "ongoing"].includes(normalized)) return new Date();
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(Number(yearMatch[0]), 0, 1);
}

function getDateField(record: Record<string, unknown>, keys: string[]): unknown {
  return keys.map((key) => record[key]).find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function firstPresentValue(record: Record<string, unknown>, keys: string[]): unknown {
  return keys.map((key) => record[key]).find((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
    return true;
  });
}

function getNestedRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function combineCollectionValues(...values: unknown[]): unknown[] {
  return values.flatMap((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const nestedArrays = Object.values(record).filter(Array.isArray).flat();
      return nestedArrays.length > 0 ? nestedArrays : [record];
    }
    return [value];
  });
}

function deriveExperienceYears(workExp: unknown): number | null {
  const entries = getCollectionEntries(workExp);
  const ranges = entries
    .map((entry) => {
      const start = parseResumeDate(getDateField(entry, ["start_date", "startDate", "from", "from_date", "start", "joining_date"]));
      const end = parseResumeDate(getDateField(entry, ["end_date", "endDate", "to", "to_date", "end", "leaving_date"])) ?? new Date();
      if (!start || end < start) return null;
      return { start, end };
    })
    .filter((range): range is { start: Date; end: Date } => Boolean(range));

  if (ranges.length === 0) return null;

  const totalMonths = ranges.reduce((months, range) => {
    const monthCount =
      (range.end.getFullYear() - range.start.getFullYear()) * 12 +
      (range.end.getMonth() - range.start.getMonth()) +
      1;
    return months + Math.max(0, monthCount);
  }, 0);

  return Math.max(1, Math.round(totalMonths / 12));
}

function deriveResumeStatsForStepOne(resume: ParsedResumeBlob | null) {
  if (!resume) return null;
  const summary = getDefaultResumeSummary(resume.summary);
  const data = (resume.parsed_data ?? {}) as Record<string, unknown>;
  const llm = getNestedRecord(data.llm_data);
  const overallExperience = getNestedRecord(data.overall_experience ?? llm.overall_experience);
  const workExp = combineCollectionValues(
    firstPresentValue(data, ["work_experience", "workExperience", "experience", "professional_experience", "employment_history"]),
    firstPresentValue(llm, ["work_experience", "workExperience", "experience", "professional_experience", "employment_history"]),
  );
  const internships = combineCollectionValues(data.internships, llm.internships);
  const experienceRecords = [...workExp, ...internships];
  const skills = combineCollectionValues(
    firstPresentValue(data, ["skills", "technical_skills", "skill_set", "core_skills"]),
    firstPresentValue(llm, ["skills", "technical_skills", "skill_set", "core_skills"]),
    data.soft_skills,
    llm.soft_skills,
  );
  const education = combineCollectionValues(
    firstPresentValue(data, ["education", "education_details", "educational_qualifications"]),
    firstPresentValue(llm, ["education", "education_details", "educational_qualifications"]),
  );
  const keywords = combineCollectionValues(
    data.ats_keywords,
    data.keywords,
    data.matched_keywords,
    data.extracted_keywords,
    data.strength_keywords,
    llm.ats_keywords,
    llm.keywords,
    llm.matched_keywords,
    llm.extracted_keywords,
    llm.strength_keywords,
  );
  const skillsList = toDisplayLabels(skills);
  const keywordsList = toDisplayLabels(keywords);
  const explicitKeywordCount = keywordsList.length;
  const years = [
    overallExperience.years,
    overallExperience.total_experience,
    data.total_experience_years,
    data.total_years_experience,
    data.years_of_experience,
    data.experience_years,
    data.total_experience,
    llm.total_experience_years,
    llm.total_years_experience,
    llm.years_of_experience,
    llm.experience_years,
    llm.total_experience,
  ].find((value) => typeof value === "number" || (typeof value === "string" && value.trim().length > 0));
  const derivedYears = deriveExperienceYears(workExp) ?? deriveExperienceYears(internships);
  const yearsLabel = typeof years === "number" ? `${years}+` : typeof years === "string" ? years : derivedYears ? `${derivedYears}+` : "-";
  const summaryYearsLabel =
    typeof summary?.years_experience === "number" && summary.years_experience > 0
      ? `${Number.isInteger(summary.years_experience) ? summary.years_experience : summary.years_experience.toFixed(1)}+`
      : undefined;
  const skillCount = skillsList.length || summary?.skills_count || 0;
  const keywordCount = explicitKeywordCount || summary?.ats_keywords_count || skillCount;

  return {
    yearsLabel: yearsLabel !== "-" ? yearsLabel : summaryYearsLabel ?? "-",
    expCount: countCollectionItems(experienceRecords) || summary?.experience_count || 0,
    skillCount,
    keywordCount,
    eduCount: countCollectionItems(education) || summary?.education_count || 0,
  };
}

/**
 * Resume fields can hold skills/keywords as plain strings, {name|skill|title|label}
 * objects, or nested category groups ({ technical: [...], soft: [...] }) —
 * flatten all shapes into a deduped list of display strings for the chip UI.
 *
 * Counting rules match countCollectionItems (and its Array.isArray/string guards):
 * only strings (split on [,;\n]) and string array elements count. Numeric/boolean
 * values, object fallback recursion, are ignored to prevent metadata from inflating
 * the count (e.g., { skill_name: "Python", years: 3 } counts 1, not 2).
 */
function toDisplayLabels(value: unknown): string[] {
  const labels: string[] = [];

  function visit(item: unknown) {
    if (item === null || item === undefined) return;
    if (typeof item === "string") {
      item
        .split(/[,;\n]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => labels.push(part));
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (typeof item === "object") {
      const record = item as Record<string, unknown>;
      const named = ["name", "skill", "title", "label", "keyword", "value"]
        .map((key) => record[key])
        .find((v) => typeof v === "string" && v.trim().length > 0);
      if (named) {
        labels.push((named as string).trim());
        return;
      }
      Object.values(record).forEach((v) => {
        if (typeof v === "string" || Array.isArray(v)) visit(v);
      });
    }
  }

  visit(value);

  const seen = new Set<string>();
  return labels.filter((label) => {
    const key = label.toLowerCase();
    if (!label || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getDefaultResumeSummary(value: unknown): {
  years_experience: number | null;
  skills_count: number;
  ats_keywords_count: number;
  education_count: number;
  experience_count: number;
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const summary = value as Record<string, unknown>;
  return {
    years_experience: typeof summary.years_experience === "number" ? summary.years_experience : null,
    skills_count: typeof summary.skills_count === "number" ? summary.skills_count : 0,
    ats_keywords_count: typeof summary.ats_keywords_count === "number" ? summary.ats_keywords_count : 0,
    education_count: typeof summary.education_count === "number" ? summary.education_count : 0,
    experience_count: typeof summary.experience_count === "number" ? summary.experience_count : 0,
  };
}

function TemplatePickerDrawer({
  open,
  selectedTemplateId,
  onTemplateChange,
  onClose,
  templates,
  defaultTemplateId,
  isSavingDefaultTemplate,
  onSetDefaultTemplate,
}: {
  open: boolean;
  selectedTemplateId: TemplateStyleId;
  onTemplateChange: (id: TemplateStyleId) => void;
  onClose: () => void;
  templates: CoverLetterTemplate[];
  defaultTemplateId?: CoverLetterTemplateId;
  isSavingDefaultTemplate: boolean;
  onSetDefaultTemplate: (id: CoverLetterTemplateId) => Promise<void>;
}) {
  const [previewing, setPreviewing] = useState<{ name: string; url: string } | null>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 p-3 backdrop-blur-sm sm:p-5">
        <div className="flex h-full w-full max-w-[720px] flex-col rounded-lg border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4ebf7] p-5">
          <div>
            <h2 className="text-xl font-black text-[#070b33]">Browse Templates</h2>
            <p className="mt-1 text-sm font-medium text-[#10235f]">Choose the layout before generating.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d8e2f3] px-3 py-2 text-sm font-black text-[#10235f] transition hover:border-[#2557a7] hover:text-[#2557a7]"
          >
            Close
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto p-5">
          {templateStyles.map((template) => {
            const selected = template.id === selectedTemplateId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onTemplateChange(template.id);
                  onClose();
                }}
                className={[
                  "grid grid-cols-[170px_minmax(0,1fr)] gap-4 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                  selected
                    ? "border-[#2557a7] bg-blue-50 ring-1 ring-[#2557a7]"
                    : "border-[#d8e2f3] bg-white hover:border-[#2557a7]",
                ].join(" ")}
              >
                <div className={["rounded-lg border border-white/70 p-2", template.paper].join(" ")}>
                  <CoverLetterTemplatePreview
                    template={template}
                    previewUrl={templates.find((item) => item.template_id === template.backendTemplateId)?.preview_url}
                    size="large"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-black text-[#070b33]">{template.name}</p>
                    {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2557a7]" />}
                  </div>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#2557a7]">
                    {template.category}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-[#10235f]">{template.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Best for {template.bestFor}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(() => {
                      const previewUrl = templates.find((item) => item.template_id === template.backendTemplateId)?.preview_url;
                      return <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (previewUrl) setPreviewing({ name: template.name, url: previewUrl });
                        }}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && previewUrl) {
                            event.preventDefault();
                            event.stopPropagation();
                            setPreviewing({ name: template.name, url: previewUrl });
                          }
                        }}
                        aria-disabled={!previewUrl}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${previewUrl ? "bg-[#2557a7] text-white hover:bg-[#1e4a94]" : "cursor-wait bg-slate-100 text-slate-400"}`}
                      >
                        {previewUrl ? "Preview" : "Loading preview..."}
                      </span>;
                    })()}
                    {defaultTemplateId === template.backendTemplateId ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">Your default</span>
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          void onSetDefaultTemplate(template.backendTemplateId);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            void onSetDefaultTemplate(template.backendTemplateId);
                          }
                        }}
                        className="rounded-full border border-[#cdd8ee] px-2.5 py-1 text-[11px] font-black text-[#2557a7]"
                      >
                        {isSavingDefaultTemplate ? "Saving..." : "Make default"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <CoverLetterTemplatePreviewModal
        previewUrl={previewing?.url ?? null}
        templateName={previewing?.name ?? "Template"}
        onClose={() => setPreviewing(null)}
      />
    </div>
  );
}

function AutocompleteTextField({
  label,
  optional = false,
  value,
  onChange,
  placeholder,
  suggestions,
  maxLength,
}: {
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = query
    ? suggestions
        .filter((item) => item.toLowerCase().includes(query))
        .slice(0, 7)
    : suggestions.slice(0, 6);
  const showSuggestions = open && matches.length > 0;

  return (
    <div className="relative">
      <label className="text-sm font-black text-[#070b33]">
        {label}
        {optional ? (
          <span className="font-semibold text-[#6b789c]"> (optional)</span>
        ) : (
          <span className="text-red-500"> *</span>
        )}
      </label>
      <input
        type="text"
        required={!optional}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={maxLength}
        className="mt-2 h-11 w-full rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-3 text-sm font-semibold text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_10px_24px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100 2xl:mt-3 2xl:h-14 2xl:px-4 2xl:text-[15px]"
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-lg border border-[#dfe6f5] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
          {matches.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-[#263363] transition hover:bg-blue-50 hover:text-[#2557a7]"
            >
              <span>{item}</span>
              <span className="text-xs font-semibold text-[#8a95b3]">Select</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function JobSourceInput(props: {
  source: Exclude<CreationSource, "jd">;
  jd: string;
  onJdChange: (value: string) => void;
  jdFile: File | null;
  onJdFileChange: (file: File | null) => void;
  trackerJobId: string;
  onTrackerJobIdChange: (value: string) => void;
  onTrackerJobIdBlur: () => void;
  ready: boolean;
}) {
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);

  if (props.source === "upload") {
    const inputId = "cover-letter-jd-upload";
    const validationError = props.jdFile ? validateJdUpload(props.jdFile) : null;

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingUpload(false);
      const file = event.dataTransfer.files?.[0] ?? null;
      if (!file) {
        toast.info("Drop a PDF, DOCX, DOC, or TXT job description file.");
        return;
      }
      props.onJdFileChange(file);
    }

    return (
      <div className="mt-5 rounded-lg border border-[#dfe6f5] bg-[#fbfdff] p-4 shadow-[0_10px_28px_rgba(18,42,94,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Upload job description</p>
            <p className="mt-1 text-xs text-slate-500">
              Supported files: PDF, DOCX, DOC, or TXT. CareerBot extracts the JD before generation.
            </p>
          </div>
          {props.ready && !validationError && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        </div>
        <label
          htmlFor={inputId}
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDraggingUpload(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "copy";
            setIsDraggingUpload(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDraggingUpload(false);
          }}
          onDrop={handleDrop}
          className={[
            "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition",
            isDraggingUpload
              ? "border-[#2557a7] bg-blue-50 ring-2 ring-[#2557a7]/20"
              : "border-blue-300 bg-white hover:bg-blue-50",
          ].join(" ")}
        >
          <Upload className="h-7 w-7 text-[#2557a7]" />
          <span className="mt-3 text-sm font-black text-slate-950">
            {props.jdFile ? props.jdFile.name : "Choose JD file"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {props.jdFile ? `${formatFileSize(props.jdFile.size)} selected` : "Drop in a PDF, Word doc, or text file"}
          </span>
          <input
            id={inputId}
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              props.onJdFileChange(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {props.jdFile && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className={validationError ? "font-semibold text-red-600" : "font-bold text-emerald-600"}>
              {validationError ?? "File ready to parse"}
            </span>
            <button
              type="button"
              onClick={() => props.onJdFileChange(null)}
              className="font-bold text-slate-500 hover:text-red-600"
            >
              Remove file
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-[#dfe6f5] bg-[#fbfdff] p-4 shadow-[0_10px_28px_rgba(18,42,94,0.04)]">
      <label htmlFor="cover-letter-tracker-job" className="text-sm font-black text-slate-950">
        Saved tracker job ID <span className="text-red-500">*</span>
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Paste the job ID from CareerBot job tracker. CareerBot parses that saved role into a JD record.
      </p>
      <input
        id="cover-letter-tracker-job"
        type="text"
        value={props.trackerJobId}
        onChange={(event) => props.onTrackerJobIdChange(event.target.value)}
        onBlur={props.onTrackerJobIdBlur}
        placeholder="e.g. 557ac932ccd40e7a27cdd22c"
        className="mt-3 w-full rounded-lg border border-[#d8e0ef] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
      />
      <p className={["mt-2 text-xs", props.ready ? "font-bold text-emerald-600" : "text-slate-500"].join(" ")}>
        {props.ready ? "Tracker role ready to import" : "Enter a saved job ID to continue."}
      </p>
    </div>
  );
}

function ResumePickerModal({
  open,
  options,
  selectedResumeId,
  selectedResumeSource,
  isLoading,
  isSettingDefault,
  onClose,
  onUse,
  onMakeDefault,
}: {
  open: boolean;
  options: CoverLetterResumeOption[];
  selectedResumeId: string | null;
  selectedResumeSource: string;
  isLoading: boolean;
  isSettingDefault: boolean;
  onClose: () => void;
  onUse: (option: CoverLetterResumeOption) => void;
  onMakeDefault: (option: CoverLetterResumeOption) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-[#070b33]">Choose resume for cover letter</h2>
            <p className="mt-1 text-sm font-medium text-[#344272]">
              Pick a resume for this cover letter. Use the default action only when you want future cover letters to start with that resume.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-44 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#2557a7]" />
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">No usable resumes found.</p>
              <p className="mt-1 text-sm text-slate-500">Upload or build a resume first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option) => {
                const selected = option.resume_id === selectedResumeId && option.source === selectedResumeSource;
                return (
                  <div
                    key={`${option.source}:${option.resume_id}`}
                    className={[
                      "rounded-lg border px-4 py-4 transition hover:border-[#2557a7]/40 hover:bg-blue-50/30",
                      selected ? "border-[#2557a7] bg-blue-50/60 shadow-[0_12px_26px_rgba(37,87,167,0.08)]" : "border-[#dfe6f5] bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", option.source === "builder" ? "bg-blue-50 text-[#2557a7]" : "bg-emerald-50 text-emerald-600"].join(" ")}>
                            {option.source === "builder" ? <PenLine className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-sm font-black text-[#070b33]">{option.display_name}</p>
                          {option.is_user_default && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              Default resume
                            </span>
                          )}
                          {selected && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-[#2557a7]">
                              Selected for this letter
                            </span>
                          )}
                        </div>
                        <p className="mt-2 pl-[52px] text-xs font-semibold text-[#344272]">
                          {option.source === "builder" ? "Resume Builder" : "Parsed resume"}
                          {option.updated_at ? ` . Updated ${formatShortDate(option.updated_at)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onUse(option)}
                          className="rounded-lg bg-[#2557a7] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1e4a94]"
                        >
                          Use for this letter
                        </button>
                        <button
                          type="button"
                          onClick={() => onMakeDefault(option)}
                          disabled={isSettingDefault || option.is_user_default}
                          className="rounded-lg border border-[#dfe6f5] bg-white px-4 py-2 text-sm font-black text-[#263363] transition hover:border-[#2557a7]/40 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {option.is_user_default ? "Already default" : "Make default"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneratingModal({
  isPreparing,
  isGenerating,
  isComplete,
  progress,
  onComplete,
  onReturnToForm,
  selectedTemplate,
  roleTitle,
  companyName,
}: {
  isPreparing: boolean;
  isGenerating: boolean;
  isComplete: boolean;
  progress: CoverLetterGenerationProgress | null;
  onComplete: () => void;
  onReturnToForm: () => void;
  selectedTemplate: string;
  roleTitle: string;
  companyName: string;
}) {
  const [hasWaited, setHasWaited] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!isGenerating || isComplete) {
      setHasWaited(false);
      return;
    }
    const timer = window.setTimeout(() => setHasWaited(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [isComplete, isGenerating]);

  useEffect(() => {
    if (!isComplete || completedRef.current) return;
    completedRef.current = true;
    const timer = window.setTimeout(onComplete, 350);
    return () => window.clearTimeout(timer);
  }, [isComplete, onComplete]);

  const confirmedProgress = isComplete ? 100 : progress?.progress ?? null;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = confirmedProgress === null
    ? circumference
    : circumference - (confirmedProgress / 100) * circumference;

  const status = isComplete
    ? {
        label: "Draft complete",
        title: "Your cover letter is ready",
        description: "Opening your draft for review…",
      }
    : progress
      ? {
          label: `${progress.progress}% complete`,
          title: getGenerationStageTitle(progress.stage),
          description: hasWaited && progress.stage === "generating"
            ? "Generation is still in progress. Detailed job descriptions can take a little longer."
            : progress.message,
        }
      : isPreparing
      ? {
          label: "Preparing request",
          title: "Getting everything ready",
          description: "Checking the details for your cover letter…",
        }
      : hasWaited
        ? {
            label: "Still working",
            title: "Creating your tailored draft",
            description: "Detailed job descriptions can take a little longer. Your letter is still being generated.",
          }
        : {
            label: "Generating",
            title: "Creating your tailored draft",
            description: "Using your selected resume and job details to write the letter…",
          };

  return (
    <div className="fixed inset-0 z-[10000] flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-[#fbfdff]/95 px-4 py-8 backdrop-blur-sm sm:items-center sm:py-10">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Cover letter generation in progress"
        aria-busy={!isComplete}
        aria-live="polite"
        className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18),0_8px_20px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="relative mx-auto h-[132px] w-[132px]">
          <div className="absolute inset-4 rounded-full bg-blue-50 shadow-[inset_0_0_28px_rgba(37,87,167,0.12)]" />
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#dbeafe" strokeWidth="14" />
            {confirmedProgress !== null && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="url(#cover-letter-progress)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-500 ease-out"
              />
            )}
            <defs>
              <linearGradient id="cover-letter-progress" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2557a7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {confirmedProgress === null ? (
              <Loader2 className="h-9 w-9 animate-spin text-[#2557a7]" aria-label="Starting generation" />
            ) : isComplete ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            ) : (
              <span className="text-[30px] font-bold leading-none tracking-tight text-slate-950 tabular-nums">
                {confirmedProgress}%
              </span>
            )}
          </div>
        </div>

        <p className="mt-7 text-sm font-bold text-[#2557a7]">{status.label}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#070b33]">{status.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{status.description}</p>

        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Your letter</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-slate-500">Template</dt>
              <dd className="mt-1 truncate font-bold text-slate-950">{selectedTemplate}</dd>
            </div>
            {roleTitle && (
              <div>
                <dt className="font-medium text-slate-500">Role</dt>
                <dd className="mt-1 truncate font-bold text-slate-950">{roleTitle}</dd>
              </div>
            )}
            {companyName && (
              <div>
                <dt className="font-medium text-slate-500">Company</dt>
                <dd className="mt-1 truncate font-bold text-slate-950">{companyName}</dd>
              </div>
            )}
          </dl>
        </div>

        {!isComplete && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onReturnToForm}
              className="text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-[#2557a7]"
            >
              Return to form
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This stops waiting here. If the request finishes, the letter will appear in History.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function getGenerationStageTitle(stage: CoverLetterGenerationProgress["stage"]): string {
  const titles: Record<CoverLetterGenerationProgress["stage"], string> = {
    queued: "Request accepted",
    validating: "Checking your details",
    generating: "Creating your tailored draft",
    persisting: "Saving your draft",
    finalizing: "Finalizing your draft",
    completed: "Your cover letter is ready",
    failed: "We could not create your letter",
  };
  return titles[stage];
}

function DocumentPreview({
  template,
}: {
  template: (typeof templateStyles)[number];
  tall?: boolean;
}) {
  return (
    <div className={["flex justify-center rounded-lg p-2", template.paper].join(" ")}>
      <CoverLetterTemplatePreview template={template} size="large" />
    </div>
  );
}

async function resolveParsedJdId({
  source,
  jd,
  jdFile,
  trackerJobId,
}: {
  source: CreationSource;
  jd: string;
  jdFile: File | null;
  trackerJobId: string;
}): Promise<Awaited<ReturnType<typeof parseJDText>>> {
  if (source === "jd") {
    const text = jd.trim();
    if (text.length < MIN_JD_CHARS) {
      throw new Error(getJobSourceMissingMessage(source));
    }
    return parseJDText(text, { skipAuthRedirect: true });
  }

  if (source === "upload") {
    if (!jdFile) {
      throw new Error(getJobSourceMissingMessage(source));
    }
    const validationError = validateJdUpload(jdFile);
    if (validationError) {
      throw new Error(validationError);
    }
    return parseJDFile(jdFile);
  }

  const jobId = trackerJobId.trim();
  if (!jobId) {
    throw new Error(getJobSourceMissingMessage(source));
  }
  return parseJDByJob(jobId);
}

function getJobSourceSummary(
  source: CreationSource,
  values: {
    jd: string;
    jdFile: File | null;
    trackerJobId: string;
  },
): string {
  if (source === "jd") return values.jd.trim();
  if (source === "upload") return values.jdFile ? `Uploaded JD file: ${values.jdFile.name}` : "";
  return values.trackerJobId.trim();
}

function getJobSourceMissingMessage(source: CreationSource): string {
  if (source === "upload") {
    return "Upload a PDF, DOCX, DOC, or TXT job description before continuing.";
  }
  if (source === "tracker") {
    return "Enter a saved job tracker ID before continuing.";
  }
  return `Paste at least ${MIN_JD_CHARS} characters of job description before continuing.`;
}

function getInitialBuilderStep(step: string | null): BuilderStep {
  return step && builderStepIds.has(step as BuilderStep) ? (step as BuilderStep) : "resume";
}

function validateJdUpload(file: File): string | null {
  const hasAllowedExtension = /\.(pdf|docx|doc|txt)$/i.test(file.name);
  if (!ALLOWED_JD_FILE_TYPES.has(file.type) && !hasAllowedExtension) {
    return "Upload a PDF, DOCX, DOC, or TXT job description.";
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validateResumeUpload(file: File): string | null {
  if (file.size > MAX_RESUME_UPLOAD_MB * 1024 * 1024) {
    return `File exceeds ${MAX_RESUME_UPLOAD_MB}MB limit.`;
  }
  const hasAllowedExtension = /\.(pdf|docx)$/i.test(file.name);
  if (!ALLOWED_RESUME_TYPES.has(file.type) && !hasAllowedExtension) {
    return "Upload a PDF or DOCX resume.";
  }
  return null;
}

function getGenerateNotFoundMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("parsed resume")) {
    return "We could not find the selected parsed resume. Please upload your resume again.";
  }
  if (lower.includes("job description")) {
    return "We could not find the parsed job description. Please paste the JD again and retry.";
  }
  return "We could not find one of the saved inputs for this letter. Please upload your resume or paste the JD again.";
}

function useCoverLetterResumeUpload(
  onUploaded: (resume: ParsedResumeBlob) => Promise<void>,
  onAuthRequired?: () => void,
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadResume = useCallback(async (file: File) => {
    const validationError = validateResumeUpload(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const parsed = await extractResume(file, { skipLoginRedirect: true });
      const mappedResume = {
        parsed_data: parsed.parsed_data,
        parsed_resume_id: parsed.resume_id,
        resume_id: parsed.resume_id,
        source_file_name: parsed.file_name,
      } satisfies ParsedResumeBlob;
      const imageWarning =
        parsed.parsed_data?.image_warning || parsed.parsed_data?.image_message
          ? parsed.parsed_data.image_message ||
            "Resume parsed with image warnings. Text inside images may not be fully extracted."
          : null;
      if (imageWarning) {
        toast.warning(imageWarning);
      }
      toast.success("Resume parsed. Continue with your cover letter.");
      await onUploaded(mappedResume);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        // Session expired: open the sign-in modal. Do NOT surface the raw server
        // error message ("Token rotation failed...") — the modal handles re-auth.
        onAuthRequired?.();
        setUploadError("Your session has expired. Please sign in to continue uploading.");
        return;
      }
      const message = getResumeUploadErrorMessage(err);
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, [onUploaded, onAuthRequired]);

  return { isUploading, uploadError, uploadResume };
}

function isUnauthorizedError(err: unknown): boolean {
  const status = (err as { status?: number; response?: { status?: number } })?.status
    ?? (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return true;

  // parserApi preserves the server body on a wrapped error as `__raw`.
  // Inspect it as well as Axios's response body so parser calls get the same
  // session-expiry behavior as the rest of the cover-letter flow.
  const bodies = [
    (err as { response?: { data?: unknown } })?.response?.data,
    (err as { __raw?: unknown })?.__raw,
  ];
  for (const data of bodies) {
    if (!data || typeof data !== "object") continue;
    const record = data as Record<string, unknown>;
    const apiError = getNestedRecord(record.error);
    const code = String(apiError.error_code ?? record.error_code ?? "").toUpperCase();
    const message = String(apiError.message ?? record.message ?? record.detail ?? "").toLowerCase();
    if (code === "HTTP_401" || code === "HTTP_403" || message.includes("not authenticated")) return true;
  }

  // When skipLoginRedirect is used, the interceptor rejects with the *refresh
  // endpoint* error instead of the original 401. The refresh response may carry
  // a non-401 status (e.g. 400) but its body signals session expiry.
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  const requestUrl = String((err as { config?: { url?: unknown } })?.config?.url ?? "");
  if (requestUrl.includes("/auth/refresh") && data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const msg = String(record.message ?? record.detail ?? "").toLowerCase();
    if (msg.includes("token") || msg.includes("rotation") || msg.includes("sign in")) return true;
  }

  // Catch cases where the error message itself was built from the server body.
  if (requestUrl.includes("/auth/refresh") && err instanceof Error) {
    const lower = err.message.toLowerCase();
    if (lower.includes("token rotation") || lower.includes("rotation failed") || lower.includes("sign in again")) return true;
  }

  return false;
}

function getResumeUploadErrorMessage(err: unknown): string {
  // Any auth / session-expiry error gets a single consistent message.
  if (isUnauthorizedError(err)) {
    return "Your session has expired. Please sign in to continue uploading.";
  }

  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === "string") return detail;
    const error = record.error;
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string") return message;
    }
    const message = record.message;
    if (typeof message === "string") return message;
  }

  if (err instanceof Error && !/^Request failed with status code \d+$/.test(err.message)) {
    return err.message;
  }

  return "Could not upload this resume. Please try another file.";
}

