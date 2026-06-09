"use client"
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftLine } from 'react-icons/ri';

const Header: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEnhanced = searchParams.get("source") === "enhanced";

  const handleBackClick = () => {
    localStorage.removeItem('resumeData');
    router.push('/builder/start/list');
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
      </div>
    </header>
  );
};

export default Header;

