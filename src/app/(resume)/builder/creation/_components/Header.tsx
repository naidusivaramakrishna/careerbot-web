"use client"
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftLine, RiCheckLine } from 'react-icons/ri';
import { toSameOriginPath } from "@/lib/internalPath";

const BUILDER_RETURN_TO_STORAGE_KEY = "careerbot:builder:return_to";
const COVER_LETTER_FALLBACK_PATH = "/cover-letter/new";

const Header: React.FC = () => {
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
  const canUseForCoverLetter = !isEnhanced;

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

  const handleBackClick = () => {
    localStorage.removeItem('resumeData');
    localStorage.removeItem(BUILDER_RETURN_TO_STORAGE_KEY);
    router.push('/builder/start/list');
  };

  const buildCoverLetterResumeUrl = () => {
    const target = effectiveReturnTo ?? COVER_LETTER_FALLBACK_PATH;
    const url = new URL(target, window.location.origin);
    if (resumeId) {
      url.searchParams.set("resume_id", resumeId);
      url.searchParams.set("resume_source", "builder");
    }
    // This is the only place a return_to value is actually navigated to, so
    // the final string gets the check as well — whatever the provenance of
    // `target` was, the router must never be handed an off-origin path.
    return toSameOriginPath(`${url.pathname}${url.search}`) ?? COVER_LETTER_FALLBACK_PATH;
  };

  const handleUseForCoverLetter = () => {
    if (!resumeId) return;
    setIsUsingForCoverLetter(true);
    window.localStorage.removeItem(BUILDER_RETURN_TO_STORAGE_KEY);
    router.push(buildCoverLetterResumeUrl());
  };

  return (
    <header className="bg-gray-100">
      {/* Floating bar below navigation with rounded top-left corner and increased padding */}
      <div className="bg-white px-5 py-2 flex items-center gap-4 overflow-hidden">
        <button
          onClick={handleBackClick}
          className="cursor-pointer hover:opacity-70 transition"
          aria-label="Go back to resume page"
        >
          <RiArrowLeftLine className="text-gray-600" size={24} />
        </button>
        <span className="font-bold text-lg text-[#2557a7]">
          {isEnhanced ? "Resume Enhancer" : "Resume Builder"}
        </span>
        {canUseForCoverLetter && (
          <button
            type="button"
            onClick={handleUseForCoverLetter}
            disabled={isUsingForCoverLetter}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1f4e98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RiCheckLine size={18} />
            {isUsingForCoverLetter ? "Selecting..." : "Use for cover letter"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

