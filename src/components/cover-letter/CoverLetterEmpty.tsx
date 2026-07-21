import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default function CoverLetterEmpty({ hasLetters = false }: { hasLetters?: boolean }) {
  if (hasLetters) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-5 py-8 2xl:min-h-[520px] 2xl:px-6 2xl:py-10">
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#eef6ff_100%)] p-7 text-center shadow-sm 2xl:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-[#2557a7] shadow-sm ring-1 ring-blue-100 2xl:h-16 2xl:w-16">
            <FileText className="h-6 w-6 2xl:h-7 2xl:w-7" />
          </div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7] 2xl:mt-6 2xl:text-xs">
            Preview mode
          </p>
          <h2 className="mt-2 text-[24px] font-black tracking-tight text-slate-950 2xl:text-3xl">Select a cover letter</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 2xl:text-base 2xl:leading-7">
            Choose a saved letter from the library to preview the draft, export it, or continue review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] items-center justify-center px-5 py-8 2xl:min-h-[520px] 2xl:px-6 2xl:py-10">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#eef6ff_100%)] px-6 py-8 text-center shadow-sm 2xl:px-8 2xl:py-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-[#2557a7] shadow-sm ring-1 ring-blue-100 2xl:h-16 2xl:w-16">
          <FileText className="h-6 w-6 2xl:h-7 2xl:w-7" />
        </div>
        <div className="mt-5 2xl:mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2557a7] 2xl:text-xs">
            No saved letters
          </p>
          <h2 className="mt-2 text-[24px] font-black tracking-tight text-slate-950 2xl:text-3xl">
            Create your first cover letter
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Add a resume, paste the job description, select the tone, and generate a focused draft.
          </p>
          <Link
            href="/cover-letter/new"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2557a7] px-4 text-sm font-bold text-white transition hover:bg-[#1e4a94] 2xl:h-11 2xl:px-5"
          >
            <Plus className="h-4 w-4" />
            New letter
          </Link>
        </div>
      </div>
    </div>
  );
}
