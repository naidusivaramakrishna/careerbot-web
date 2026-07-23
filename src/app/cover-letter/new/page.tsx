"use client";

import Link from "next/link";
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  Clock3,
  FileText,
  GraduationCap,
  History,
  Link2,
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
import { listCoverLetterResumeOptions, setDefaultCoverLetterResume } from "@/api/coverLetterApi";
import { parseJDByJob, parseJDFile, parseJDText, parseJDUrl } from "@/api/parserApi";
import { getResumeById } from "@/api/resumeApi";
import { extractResume } from "@/api/resumeParsingApi";
import SignUpModal from "@/components/SignUpModal";
import { CoverLetterTemplatePreview } from "@/app/cover-letter/_components/CoverLetterTemplatePreview";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useDefaultCoverLetterResume } from "@/hooks/useDefaultCoverLetterResume";
import { useGenerateCoverLetter } from "@/hooks/useGenerateCoverLetter";
import { useHasParsedResume } from "@/hooks/useHasParsedResume";
import { useLatestParsedResume } from "@/hooks/useLatestParsedResume";
import { mintIdempotencyKey } from "@/lib/idempotencyKey";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import { getCoverLetterParsedResumeId, getCoverLetterResumeSource } from "@/lib/coverLetterResume";
import type { CoverLetterFormSubmit, CoverLetterResumeOption, CoverLetterTemplateId } from "@/types/coverLetter";

// Reads useSearchParams/localStorage at runtime — opt out of static prerender
export const dynamic = "force-dynamic";

const MAX_RESUME_UPLOAD_MB = 10;
const MIN_JD_CHARS = 50;
const MAX_NOTE_CHARS = 300;
// Mirrors the backend GenerateOptions bounds exactly (ge=200, le=500).
const WORD_COUNT_FLOOR = 200;
const WORD_COUNT_CEIL = 500;
const COVER_LETTER_TEMPLATE_PREF_KEY = "careerbot:cover-letter-template";
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
type CreationSource = "jd" | "tracker" | "url" | "upload";
type ToneChoice = "professional" | "warm" | "concise";
type TemplateStyleId =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "minimal"
  | "signature";

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
    id: "url",
    label: "Use job URL",
    description: "Extract from a link.",
    icon: Link2,
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
  "Backend Developer",
  "Senior Backend Engineer",
  "Python Developer",
  "FastAPI Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "React Developer",
  "Software Engineer",
  "Senior Software Engineer",
  "Java Developer",
  "Node.js Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Product Manager",
  "Business Analyst",
  "QA Engineer",
  "Automation Test Engineer",
  "UI/UX Designer",
  "Technical Support Engineer",
  "Project Manager",
];

const locationSuggestions = [
  "Remote",
  "Hybrid",
  "On-site",
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
  const { userId } = useCurrentUserId();
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
  const [jobUrl, setJobUrl] = useState("");
  const [trackerJobId, setTrackerJobId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState("");
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [candidateSignatureName, setCandidateSignatureName] = useState("");
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [generatedLetterId, setGeneratedLetterId] = useState<string | null>(null);
  const uploader = useCoverLetterResumeUpload(
    async (resume) => {
      setUploadedResume(resume);
      await Promise.all([gate.refetch(), latest.refetch(), defaultResume.refetch()]);
    },
    () => setShowSignIn(true),
  );
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

  const defaultResumeBlob = toDefaultResumeBlob(defaultResume.defaultResume);
  const requestedResumeId = searchParams.get("resume_id");
  const requestedResumeSourceParam = searchParams.get("resume_source");
  const requestedResumeSource =
    requestedResumeSourceParam === "builder" || requestedResumeSourceParam === "parser"
      ? requestedResumeSourceParam
      : null;

  useEffect(() => {
    if (!requestedResumeId || !requestedResumeSource || uploadedResume) {
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
        if (cancelled || uploadedResume) return;
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
  const selectedTemplate = templateStyles.find((template) => template.id === selectedTemplateId) ?? templateStyles[1];
  const jdReady = jd.trim().length >= MIN_JD_CHARS;
  const jobSourceReady =
    source === "jd"
      ? jdReady
      : source === "upload"
        ? Boolean(jdFile && !validateJdUpload(jdFile))
        : source === "url"
          ? isValidHttpUrl(jobUrl)
          : trackerJobId.trim().length > 0;
  const generation = useGenerateCoverLetter({
    onSuccess: (response) => {
      rememberGeneratedLetterTemplate(response.letter_id, pendingTemplateIdRef.current);
      setGeneratedLetterId(response.letter_id);
    },
    onError: (err) => {
      setGeneratedLetterId(null);
      const message = err.validationErrors?.length
        ? "Please fix the highlighted fields and try again."
        : err.reason === "not_found"
          ? getGenerateNotFoundMessage(err.message)
          : ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      setApiError(message);
      setActiveStep("resume");
    },
  });

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
    setIsPreparing(true);
    setActiveStep("generate");
    try {
      const parsedJd = await resolveParsedJdId({
        source,
        jd,
        jdFile,
        jobUrl,
        trackerJobId,
      });
      if (!parsedJd.jd_id) {
        throw new Error("Could not prepare this job source. Please check the selected job details and try again.");
      }
      await generation.mutate({
        body: {
          parsed_resume_id: parsedResumeId,
          resume_source: resumeSource,
          jd_id: parsedJd.jd_id,
          ...(request.application_context && {
            application_context: request.application_context,
          }),
          ...(request.options && { options: request.options }),
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

  const completeGenerationNavigation = useCallback(() => {
    if (!generatedLetterId) return;
    toast.success("Cover letter generated.");
    router.push(`/cover-letter/${encodeURIComponent(generatedLetterId)}`);
  }, [generatedLetterId, router]);

  function buildRequest(): CoverLetterFormSubmit {
    const noteParts = [
      location.trim() && `Role location: ${location.trim()}.`,
      selectedTemplate && `Preferred layout style: ${selectedTemplate.name}.`,
    ].filter(Boolean);
    const note = noteParts.join(" ").slice(0, MAX_NOTE_CHARS);
    const appCtxFields = {
      ...(companyName.trim() && { company_name: companyName.trim() }),
      ...(roleTitle.trim() && { role_title: roleTitle.trim() }),
      ...(hiringManagerName.trim() && { hiring_manager_name: hiringManagerName.trim() }),
      ...(candidateSignatureName.trim() && { candidate_signature_name: candidateSignatureName.trim() }),
      ...(includeContactDetails && { include_contact_details: true }),
    };

    return {
      job_description: getJobSourceSummary(source, { jd, jdFile, jobUrl, trackerJobId }),
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
                onSourceChange={(s) => { setSource(s); setApiError(null); }}
                jd={jd}
                onJdChange={setJd}
                jdFile={jdFile}
                onJdFileChange={setJdFile}
                jobUrl={jobUrl}
                onJobUrlChange={setJobUrl}
                trackerJobId={trackerJobId}
                onTrackerJobIdChange={setTrackerJobId}
                companyName={companyName}
                onCompanyNameChange={setCompanyName}
                roleTitle={roleTitle}
                onRoleTitleChange={setRoleTitle}
                location={location}
                onLocationChange={setLocation}
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
                onTemplateChange={setSelectedTemplateId}
                onContinue={() => void handleSubmit()}
              />
            )}

            {activeStep === "generate" && (
              <GeneratingModal
                isPreparing={isPreparing}
                isGenerating={generation.isLoading}
                isComplete={Boolean(generatedLetterId)}
                onComplete={completeGenerationNavigation}
                onCancel={() => {
                  if (generatedLetterId) return;
                  generation.abort();
                  setActiveStep("resume");
                  setIsPreparing(false);
                  setGeneratedLetterId(null);
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
  jdFile,
  onJdFileChange,
  jobUrl,
  onJobUrlChange,
  trackerJobId,
  onTrackerJobIdChange,
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
  jdFile: File | null;
  onJdFileChange: (f: File | null) => void;
  jobUrl: string;
  onJobUrlChange: (v: string) => void;
  trackerJobId: string;
  onTrackerJobIdChange: (v: string) => void;
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
  onContinue: () => void;
}) {
  const inputId = "cover-letter-resume-upload-mock";
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const selectedTemplate = templateStyles.find((template) => template.id === selectedTemplateId) ?? templateStyles[1];
  const stats = deriveResumeStatsForStepOne(resume);
  const canContinue = hasResume && jdReady && (wordCountMode === "auto" || minWords <= maxWords);
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
            {hasResume && !isUploading && (
              isDefaultResume ? (
                <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-xs font-black text-amber-700 2xl:h-12 2xl:px-5 2xl:text-sm">
                  <Star className="h-4 w-4 fill-current" />
                  Default resume
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onMakeCurrentDefault}
                  disabled={isSettingDefaultResume}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 2xl:h-12 2xl:px-5 2xl:text-sm"
                >
                  {isSettingDefaultResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                  Set as default
                </button>
              )
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
                  onClick={() => navigator.clipboard?.readText().then(onJdChange).catch(() => toast.info("Clipboard unavailable."))}
                  className="inline-flex items-center gap-2 rounded-md border border-[#dfe6f5] bg-white px-4 py-2 text-sm font-bold text-[#263363] transition hover:border-[#2557a7]/40 hover:text-[#2557a7]"
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
                <button
                  type="button"
                  onClick={() => onSourceChange(source === "url" ? "jd" : "url")}
                  className={["inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition", source === "url" ? "border-[#2557a7] bg-blue-50 text-[#2557a7]" : "border-[#dfe6f5] bg-white text-[#263363] hover:border-[#2557a7]/40"].join(" ")}
                >
                  <Link2 className="h-4 w-4" />
                  Import URL
                </button>
              </div>
            </div>
            {source === "jd" ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={jd}
                  onChange={(e) => onJdChange(e.target.value)}
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
                jobUrl={jobUrl}
                onJobUrlChange={onJobUrlChange}
                trackerJobId={trackerJobId}
                onTrackerJobIdChange={onTrackerJobIdChange}
                ready={jdReady}
              />
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 2xl:gap-6">
            <div>
              <label className="text-sm font-black text-[#070b33]">
                Company name <span className="font-semibold text-[#6b789c]">(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                placeholder="e.g. Globex Corporation"
                className="mt-2 h-11 w-full rounded-lg border border-[#d8e0ef] bg-[#fbfdff] px-3 text-sm font-semibold text-[#070b33] outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:bg-white focus:shadow-[0_10px_24px_rgba(37,87,167,0.08)] focus:ring-4 focus:ring-blue-100 2xl:mt-3 2xl:h-14 2xl:px-4 2xl:text-[15px]"
              />
            </div>
            <div>
              <AutocompleteTextField
                label="Job title"
                optional
                value={roleTitle}
                onChange={onRoleTitleChange}
                placeholder="e.g. Senior Backend Engineer"
                suggestions={jobTitleSuggestions}
              />
            </div>
            <div className="sm:col-span-2">
              <AutocompleteTextField
                label="Location"
                value={location}
                onChange={onLocationChange}
                placeholder="e.g. Bengaluru, India"
                suggestions={locationSuggestions}
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
                Signature name <span className="font-semibold text-[#6b789c]">(optional)</span>
              </label>
              <input
                type="text"
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
  const explicitKeywordCount = [
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
  ].reduce<number>((count, value) => {
    return count + countCollectionItems(value);
  }, 0);
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
  const skillCount = countCollectionItems(skills) || summary?.skills_count || 0;
  const keywordCount = explicitKeywordCount || summary?.ats_keywords_count || skillCount || undefined;

  return {
    yearsLabel: yearsLabel !== "-" ? yearsLabel : summaryYearsLabel ?? "-",
    expCount: countCollectionItems(experienceRecords) || summary?.experience_count || 0,
    skillCount,
    keywordCount,
    eduCount: countCollectionItems(education) || summary?.education_count || 0,
  };
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
}: {
  open: boolean;
  selectedTemplateId: TemplateStyleId;
  onTemplateChange: (id: TemplateStyleId) => void;
  onClose: () => void;
}) {
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
                  <DocumentPreview template={template} />
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
                </div>
              </button>
            );
          })}
        </div>
      </div>
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
}: {
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
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
        {optional && <span className="font-semibold text-[#6b789c]"> (optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
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
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  trackerJobId: string;
  onTrackerJobIdChange: (value: string) => void;
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

  if (props.source === "url") {
    return (
      <div className="mt-5 rounded-lg border border-[#dfe6f5] bg-[#fbfdff] p-4 shadow-[0_10px_28px_rgba(18,42,94,0.04)]">
        <label htmlFor="cover-letter-job-url" className="text-sm font-black text-slate-950">
          Job posting URL <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Use a public company careers or job-board link. The backend extracts the posting text.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="cover-letter-job-url"
            type="url"
            value={props.jobUrl}
            onChange={(event) => props.onJobUrlChange(event.target.value)}
            placeholder="https://company.com/careers/software-engineer"
            className="min-w-0 flex-1 rounded-lg border border-[#d8e0ef] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-[#8a95b3] focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.readText().then(props.onJobUrlChange).catch(() => toast.info("Clipboard access is unavailable."))}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-[#2557a7]"
          >
            <Clipboard className="h-4 w-4" />
            Paste URL
          </button>
        </div>
        <p className={["mt-2 text-xs", props.ready ? "font-bold text-emerald-600" : "text-slate-500"].join(" ")}>
          {props.ready ? "URL ready to extract" : "Enter a valid http or https URL."}
        </p>
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
  onComplete,
  onCancel,
  selectedTemplate,
  roleTitle,
  companyName,
}: {
  isPreparing: boolean;
  isGenerating: boolean;
  isComplete: boolean;
  onComplete: () => void;
  onCancel: () => void;
  selectedTemplate: string;
  roleTitle: string;
  companyName: string;
}) {
  const progressStates = [
    { label: "Job Details Validated", active: "Validating job details...", detail: "Validating job details..." },
    { label: "Resume Matched", active: "Matching resume evidence...", detail: "Matching resume evidence..." },
    { label: "Letter Drafted", active: "Writing your tailored letter...", detail: "Writing your tailored letter..." },
    { label: "Template Applied", active: `Applying ${selectedTemplate} template...`, detail: `Applying ${selectedTemplate} template...` },
    { label: "Export Ready", active: "Preparing review page...", detail: "Preparing review page..." },
  ];

  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  // Keep the visual process behind the backend until the draft is ready.
  useEffect(() => {
    const target = isComplete ? 100 : isPreparing ? 24 : isGenerating ? 86 : 94;
    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= target) return current;
        return Math.min(current + (isComplete ? 2 : 1), target);
      });
    }, 70);
    return () => clearInterval(interval);
  }, [isComplete, isGenerating, isPreparing]);

  useEffect(() => {
    if (!isComplete || progress < 100 || completedRef.current) return;
    completedRef.current = true;
    const timer = window.setTimeout(onComplete, 450);
    return () => window.clearTimeout(timer);
  }, [isComplete, onComplete, progress]);

  const activeIndex = Math.min(
    progressStates.length - 1,
    Math.floor((progress / 100) * progressStates.length),
  );
  const activeState = progressStates[activeIndex];
  const secondsLeft = Math.max(0, Math.ceil((100 - progress) / 8));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex min-h-[calc(100vh-170px)] items-start justify-center px-4 py-8 sm:items-center sm:py-10">
      <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_30px_80px_-28px_rgba(15,23,42,0.45),0_10px_24px_rgba(37,87,167,0.08)]">
          {/* Gradient progress stripe */}
          <div className="hidden h-1.5 w-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2557a7] via-blue-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-7">
            {/* Icon */}
            <div className="relative mx-auto h-[190px] w-[190px]">
              <div className="absolute inset-5 rounded-full bg-blue-50 shadow-[inset_0_0_28px_rgba(37,87,167,0.12)]" />
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#dbeafe" strokeWidth="14" />
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
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="cover-letter-progress" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2557a7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[44px] font-medium leading-none tracking-tight text-slate-950">
                  {progress}%
                </span>
                <span className="mt-2 text-sm font-semibold text-slate-500">
                  {isComplete ? "finishing..." : `${secondsLeft} sec left`}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mt-5 text-center">
              <h3 className="text-[22px] font-black tracking-tight text-[#1f5eff]">
                Premium Cover Letter Generation
              </h3>
              <p className="mt-3 text-lg font-black text-[#1f5eff]">
                {progress >= 100 ? "Opening your draft..." : activeState.detail}
              </p>
            </div>

            {/* Progress bar + percentage */}
            <div className="hidden">
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2557a7] to-blue-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-right text-xs font-bold text-[#2557a7]">{progress}%</p>
            </div>

            {/* 4 cycling progress states */}
            <div className="mt-5 space-y-2">
              {progressStates.map((state, index) => {
                const itemThreshold = ((index + 1) / progressStates.length) * 100;
                const done = progress >= itemThreshold || progress >= 100;
                const active = !done && index === activeIndex;
                return (
                  <div
                    key={state.label}
                    className={[
                      "flex items-center justify-between gap-3 rounded-lg px-4 py-3 transition-all duration-200",
                      done ? "bg-emerald-50" : active ? "bg-blue-50" : "bg-slate-50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                        done
                          ? "bg-emerald-500 text-white"
                          : active
                            ? "bg-[#2557a7] text-white"
                            : "bg-slate-200 text-slate-400",
                      ].join(" ")}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <p
                      className={[
                        "min-w-0 flex-1 truncate text-sm font-bold transition-colors duration-200",
                        done
                          ? "text-emerald-700"
                          : active
                            ? "text-[#2557a7]"
                            : "text-slate-400",
                      ].join(" ")}
                    >
                      {state.label}
                    </p>
                    <span
                      className={[
                        "shrink-0 text-sm font-black",
                        done ? "text-emerald-600" : active ? "text-amber-500" : "text-slate-400",
                      ].join(" ")}
                    >
                      {done ? "Done" : active ? "Processing" : "Queued"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Role / template summary strip */}
            <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs">
                <p className="font-bold text-slate-400">Template</p>
                <p className="mt-0.5 font-black text-slate-950">{selectedTemplate}</p>
              </div>
              {roleTitle && (
                <div className="max-w-36 text-right text-xs">
                  <p className="font-bold text-slate-400">Role</p>
                  <p className="mt-0.5 truncate font-black text-slate-950">{roleTitle}</p>
                </div>
              )}
              {companyName && (
                <div className="max-w-28 text-right text-xs">
                  <p className="font-bold text-slate-400">Company</p>
                  <p className="mt-0.5 truncate font-black text-slate-950">{companyName}</p>
                </div>
              )}
            </div>

            {!isComplete && (
              <button
                type="button"
                onClick={onCancel}
                className="mt-5 w-full rounded-lg border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:text-red-600"
              >
                Cancel generation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
  jobUrl,
  trackerJobId,
}: {
  source: CreationSource;
  jd: string;
  jdFile: File | null;
  jobUrl: string;
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

  if (source === "url") {
    const url = jobUrl.trim();
    if (!isValidHttpUrl(url)) {
      throw new Error(getJobSourceMissingMessage(source));
    }
    return parseJDUrl(url);
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
    jobUrl: string;
    trackerJobId: string;
  },
): string {
  if (source === "jd") return values.jd.trim();
  if (source === "upload") return values.jdFile ? `Uploaded JD file: ${values.jdFile.name}` : "";
  if (source === "url") return values.jobUrl.trim();
  return values.trackerJobId.trim();
}

function getJobSourceMissingMessage(source: CreationSource): string {
  if (source === "upload") {
    return "Upload a PDF, DOCX, DOC, or TXT job description before continuing.";
  }
  if (source === "url") {
    return "Enter a valid http or https job posting URL before continuing.";
  }
  if (source === "tracker") {
    return "Enter a saved job tracker ID before continuing.";
  }
  return `Paste at least ${MIN_JD_CHARS} characters of job description before continuing.`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return true;

  // When skipLoginRedirect is used, the interceptor rejects with the *refresh
  // endpoint* error instead of the original 401. The refresh response may carry
  // a non-401 status (e.g. 400) but its body signals session expiry.
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const msg = String(record.message ?? record.detail ?? "").toLowerCase();
    if (msg.includes("token") || msg.includes("rotation") || msg.includes("sign in")) return true;
  }

  // Catch cases where the error message itself was built from the server body.
  if (err instanceof Error) {
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

