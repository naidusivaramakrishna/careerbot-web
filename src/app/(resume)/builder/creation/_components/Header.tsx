"use client"
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftLine, RiCheckLine } from 'react-icons/ri';

const Header: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEnhanced = searchParams.get("source") === "enhanced";
  const rawReturnTo = searchParams.get("return_to");
  const returnTo = rawReturnTo?.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo
    : null;

  const handleBackClick = () => {
    localStorage.removeItem('resumeData');
    router.push(returnTo ?? '/builder/start/list');
  };

  const handleUseForCoverLetter = () => {
    router.push(returnTo ?? '/cover-letter/new');
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
        {returnTo === "/cover-letter/new" && (
          <button
            type="button"
            onClick={handleUseForCoverLetter}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1f4e98]"
          >
            <RiCheckLine size={18} />
            Use for cover letter
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

