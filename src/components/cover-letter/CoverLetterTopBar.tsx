import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export default function CoverLetterTopBar() {
  return (
    <header className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_58%,#edf4ff_100%)] px-5 py-5 2xl:px-6 2xl:py-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7]">Cover letters</p>
          <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight text-slate-950 2xl:text-[32px]">History library</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 2xl:text-base 2xl:leading-7">
            Review saved drafts, open any letter for export, or start step 1 for a new role.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/cover-letter/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2557a7] px-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#1e4a94] 2xl:h-11 2xl:px-5"
          >
            <Plus className="h-4 w-4" />
            Create new letter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
