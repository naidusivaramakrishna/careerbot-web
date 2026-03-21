'use client';

interface Section {
  id: number;
  title: string;
}

const sections: Section[] = [
  { id: 1, title: 'See & Repeat'        },
  { id: 2, title: 'Listen & Repeat'     },
  { id: 3, title: 'Jumbled Sentence'    },
  { id: 4, title: 'Sentence Completion' },
  { id: 5, title: 'Listen & Correct'    },
  { id: 6, title: 'Story Listen Facts'  },
  { id: 7, title: 'Describe Situation'  },
];

const TOTAL = sections.length;

interface AssessmentSidebarProps {
  currentSectionId: number;
}

export default function AssessmentSidebar({ currentSectionId }: AssessmentSidebarProps) {
  const completedCount = currentSectionId - 1;
  const progressPercent = Math.round((completedCount / TOTAL) * 100);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (progressPercent / 100);

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shrink-0">

      {/* ── Header ─────────────────────────────── */}
      <div className="px-5 pt-5 pb-5 border-b border-gray-100 shrink-0">

        {/* Circular progress + label */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={radius} stroke="#F3F4F6" strokeWidth="5" fill="none" />
              <circle
                cx="36" cy="36" r={radius}
                stroke="#2557a7"
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-gray-900 leading-none">{completedCount}</span>
              <span className="text-[9px] text-gray-400 mt-0.5">of {TOTAL}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Progress</p>
            <p className="text-sm font-bold text-gray-900">
              {completedCount === 0
                ? 'Not started'
                : completedCount === TOTAL
                  ? 'All done'
                  : `${completedCount} completed`}
            </p>
            <p className="text-xs text-[#2557a7] font-semibold mt-0.5">{progressPercent}%</p>
          </div>
        </div>

        {/* Segmented track — 7 blocks */}
        <div className="flex gap-0.5">
          {sections.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                s.id < currentSectionId
                  ? 'bg-green-500'
                  : s.id === currentSectionId
                    ? 'bg-[#2557a7]'
                    : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Section list — timeline ──────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Sections</p>

        <ul>
          {sections.map((section, index) => {
            const isCompleted = section.id < currentSectionId;
            const isActive    = section.id === currentSectionId;
            const isNext      = section.id === currentSectionId + 1;
            const isLast      = index === sections.length - 1;

            return (
              <li key={section.id} className="relative flex gap-3">

                {/* Vertical connector */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-100 z-0" />
                )}

                {/* Step dot */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 mt-0.5 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-500'
                    : isActive
                      ? 'bg-[#2557a7] shadow-sm shadow-[#2557a7]/30'
                      : 'bg-gray-100 border border-gray-200'
                }`}>
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {section.id}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0 py-1 pb-4">
                  <p className={`text-[13px] font-semibold leading-tight truncate ${
                    isActive      ? 'text-gray-900'
                    : isCompleted ? 'text-gray-500'
                    : isNext      ? 'text-gray-500'
                    : 'text-gray-300'
                  }`}>
                    {section.title}
                  </p>

                  <div className="mt-0.5">
                    {isActive && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] animate-pulse" />
                        <span className="text-[11px] font-semibold text-[#2557a7]">In Progress</span>
                      </div>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-medium text-green-600">Completed</span>
                    )}
                    {isNext && (
                      <span className="text-[11px] text-gray-400">Up next</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Footer ─────────────────────────────── */}
      <div className="px-5 py-3.5 border-t border-gray-100 shrink-0">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Sections unlock sequentially as you progress.
        </p>
      </div>

    </aside>
  );
}
