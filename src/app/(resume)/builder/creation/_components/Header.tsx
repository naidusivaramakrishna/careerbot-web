"use client"
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from "sonner";
import { toSameOriginPath } from "@/lib/internalPath";
import { getEnhancedResume } from "@/api/enhancerApi";

const BUILDER_RETURN_TO_STORAGE_KEY = "careerbot:builder:return_to";
const COVER_LETTER_FALLBACK_PATH = "/cover-letter/new";

/** "Use for Cover Letter": hands this resume to the cover letter feature (and remembers where to come back to). */
export function useCoverLetterHandoff() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEnhanced = searchParams.get("source") === "enhanced";
  // Normalized form only. A raw `startsWith("/") && !startsWith("//")` test
  // lets "/..//evil.com" through, and the URL resolution below turns that into
  // the protocol-relative path "//evil.com".
  const returnTo = toSameOriginPath(searchParams.get("return_to"));
  const [storedReturnTo, setStoredReturnTo] = useState<string | null>(null);
  const [isUsingForCoverLetter, setIsUsingForCoverLetter] = useState(false);
  const resumeId = typeof params?.resumeId === "string" ? params.resumeId : null;
  const effectiveReturnTo = returnTo ?? storedReturnTo;

  useEffect(() => {
    if (returnTo) {
      window.localStorage.setItem(BUILDER_RETURN_TO_STORAGE_KEY, returnTo);
      setStoredReturnTo(returnTo);
      return;
    }
    // Re-validate on the way OUT of storage too: a value written by an older
    // build (or by any other writer of this key) has not been through the
    // check above.
    const savedReturnTo = toSameOriginPath(
      window.localStorage.getItem(BUILDER_RETURN_TO_STORAGE_KEY),
    );
    if (savedReturnTo) {
      setStoredReturnTo(savedReturnTo);
    }
  }, [returnTo]);

  const buildCoverLetterResumeUrl = (targetResumeId: string | null, source: "builder" | "parser") => {
    const target = effectiveReturnTo ?? COVER_LETTER_FALLBACK_PATH;
    const url = new URL(target, window.location.origin);
    if (targetResumeId) {
      url.searchParams.set("resume_id", targetResumeId);
      url.searchParams.set("resume_source", source);
    }
    // This is the only place a return_to value is actually navigated to, so
    // the final string gets the check as well — whatever the provenance of
    // `target` was, the router must never be handed an off-origin path.
    return toSameOriginPath(`${url.pathname}${url.search}`) ?? COVER_LETTER_FALLBACK_PATH;
  };

  const handleUseForCoverLetter = async () => {
    if (!resumeId) return;
    setIsUsingForCoverLetter(true);

    if (!isEnhanced) {
      window.localStorage.removeItem(BUILDER_RETURN_TO_STORAGE_KEY);
      router.push(buildCoverLetterResumeUrl(resumeId, "builder"));
      return;
    }

    // The cover letter feature knows builder resumes and uploaded (parsed) resumes. An enhanced
    // resume comes from an upload, so hand over the upload it was made from.
    try {
      const record = (await getEnhancedResume(resumeId)) as unknown as { original_resume_id?: string };
      if (!record?.original_resume_id) throw new Error("missing original resume");
      window.localStorage.removeItem(BUILDER_RETURN_TO_STORAGE_KEY);
      router.push(buildCoverLetterResumeUrl(record.original_resume_id, "parser"));
    } catch {
      toast.error("Couldn't find the original upload for this resume, so it can't be used for a cover letter yet.");
      setIsUsingForCoverLetter(false);
    }
  };

  return { handleUseForCoverLetter, isUsingForCoverLetter };
}

/** The "Use for Cover Letter" button (the same action the Export menu offers). */
export const UseForCoverLetterButton: React.FC = () => {
  const { handleUseForCoverLetter, isUsingForCoverLetter } = useCoverLetterHandoff();
  return (
    <button
      type="button"
      onClick={handleUseForCoverLetter}
      disabled={isUsingForCoverLetter}
      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#c3d3ec] bg-white px-3 text-[13px] font-semibold text-[#1d4fa8] transition hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FileText size={15} />
      {isUsingForCoverLetter ? "Selecting..." : "Use for Cover Letter"}
    </button>
  );
};

const Header: React.FC<{ actions?: React.ReactNode; showCoverLetter?: boolean }> = ({ actions, showCoverLetter = true }) => {
  const router = useRouter();

  const handleBackClick = () => {
    localStorage.removeItem('resumeData');
    localStorage.removeItem(BUILDER_RETURN_TO_STORAGE_KEY);
    router.push('/builder/start/list');
  };

  return (
    <header className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Back to Resume Management: icon only */}
          <button
            type="button"
            onClick={handleBackClick}
            className="mt-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d5deec] bg-white text-[#1d4fa8] transition hover:bg-[#f4f7fc]"
            aria-label="Back to Resume Management"
            title="Back to Resume Management"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-gray-900">
            Resume Builder
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create, edit and customize your resume. Your changes will be updated in real time.
          </p>
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          {showCoverLetter && <UseForCoverLetterButton />}
        </div>
      </div>
    </header>
  );
};

export default Header;

