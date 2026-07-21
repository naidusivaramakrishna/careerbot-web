'use client';

interface SectionStartModalProps {
  open: boolean;
  onStart: () => void;
  title: string;
  subtitle: string;
  questions: number;
  instructions: string[];
}

export default function SectionStartModal({
  open,
  onStart,
  title,
  subtitle,
  questions,
  instructions,
}: SectionStartModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="section-start-title">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <div className="border-b border-[#2557a7]/10 bg-[#f5f8ff] px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="rounded-full border border-[#2557a7]/15 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#2557a7]">
              Candidate checkpoint
            </span>
            <span className="rounded-full bg-[#2557a7] px-3 py-1 text-xs font-black text-white">
              {questions}Q
            </span>
          </div>
          <h2 id="section-start-title" className="text-lg font-black leading-snug text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{subtitle}</p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Instructions</p>
            <p className="text-xs font-bold text-slate-500">Read before starting</p>
          </div>

          <ul className="space-y-2.5">
            {instructions.map((item, index) => (
              <li key={index} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2557a7] text-xs font-black text-white">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-5">
          <button
            type="button"
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#2557a7]/15 transition-colors hover:bg-[#1e4a94] focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
          >
            Start Section
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
