'use client';

interface Section {
  id: number;
  title: string;
}

const sections: Section[] = [
  { id: 1, title: 'See & Repeat' },
  { id: 2, title: 'Listen & Repeat' },
  { id: 3, title: 'Jumbled Sentence' },
  { id: 4, title: 'Sentence Completion' },
  { id: 5, title: 'Listen & Correct' },
  { id: 6, title: 'Story Listen Facts' },
  { id: 7, title: 'Describe Situation' },
];

const TOTAL = sections.length;

interface AssessmentSidebarProps {
  currentSectionId: number;
}

export default function AssessmentSidebar({ currentSectionId }: AssessmentSidebarProps) {
  const completedCount = currentSectionId - 1;
  const progressPercent = Math.round((completedCount / TOTAL) * 100);

  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (progressPercent / 100);

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 shadow-[10px_0_28px_rgba(15,23,42,0.04)] lg:flex xl:w-60">
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assessment console</p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                <circle cx="30" cy="30" r={radius} stroke="#E5E7EB" strokeWidth="5" fill="none" />
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke="#2557a7"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black leading-none text-slate-950">{completedCount}</span>
                <span className="mt-0.5 text-[8px] font-bold text-slate-400">of {TOTAL}</span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
              <p className="mt-0.5 truncate text-xs font-black text-slate-950">
                {completedCount === 0
                  ? 'Ready to begin'
                  : completedCount === TOTAL
                    ? 'All complete'
                    : `${completedCount} completed`}
              </p>
              <p className="mt-0.5 text-[11px] font-black text-[#2557a7]">{progressPercent}% complete</p>
            </div>
          </div>

          <div className="flex gap-1" aria-hidden="true">
            {sections.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s.id < currentSectionId
                    ? 'bg-green-500'
                    : s.id === currentSectionId
                      ? 'bg-[#2557a7]'
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 assessment-scroll">
        <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section path</p>

        <ul className="space-y-1">
          {sections.map((section) => {
            const isCompleted = section.id < currentSectionId;
            const isActive = section.id === currentSectionId;
            const isNext = section.id === currentSectionId + 1;

            return (
              <li key={section.id}>
                <div
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all ${
                    isActive
                      ? 'border-[#2557a7]/25 bg-[#2557a7]/5 shadow-sm'
                      : isCompleted
                        ? 'border-green-100 bg-green-50/70'
                        : 'border-transparent bg-white'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-[#2557a7] text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      section.id
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-black leading-tight ${isActive ? 'text-slate-950' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {section.title}
                    </p>
                    <p className={`mt-0.5 text-[10px] font-semibold leading-tight ${isActive ? 'text-[#2557a7]' : isCompleted ? 'text-green-700' : 'text-slate-400'}`}>
                      {isActive ? 'In progress' : isCompleted ? 'Completed' : isNext ? 'Up next' : 'Locked'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="assessment-sidebar-note shrink-0 border-t border-slate-100 px-3 py-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
          <p className="text-[10px] font-bold leading-snug text-amber-900">
            Keep camera and microphone available until submission.
          </p>
        </div>
      </div>
    </aside>
  );
}
