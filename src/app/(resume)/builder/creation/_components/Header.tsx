"use client"
import React from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from 'react-icons/ri';
import logger from "@/lib/logger";

const Header: React.FC = () => {
  const router = useRouter();

  const handleBackClick = () => {
    logger.info('Navigating to: /builder/start/list');

    // ✅ Clear localStorage resume data to force fresh fetch
    localStorage.removeItem('resumeData');

    // ✅ Add timestamp to force page refresh
    const timestamp = Date.now();
    router.push(`/builder/start/list?refresh=${timestamp}`);

    // ✅ Force router to refresh
    router.refresh();
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
          Resume Builder
        </span>
      </div>
    </header>
  );
};

export default Header;

