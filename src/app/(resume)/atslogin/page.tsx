"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ATSLoginPage from "./_components/ATSLoginPage";

export default function ATSLogin() {
  return (
    <>
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-3 lg:px-8">
          <Link href="/" className="text-xs font-medium text-slate-500 transition-colors hover:text-[#2557a7]">
            Home
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-xs font-semibold text-[#2557a7]">ATS Scanner</span>
        </div>
      </div>
      <ATSLoginPage />
    </>
  );
}