'use client';

import { Lock, CheckCircle2 } from 'lucide-react';

interface Section {
  id: number;
  title: string;
  desc: string;
}

const sections: Section[] = [
  { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
  { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
  {
    id: 3,
    title: 'Jumbled Sentence',
    desc: 'Evaluate sentence structure understanding',
  },
  {
    id: 4,
    title: 'Sentence Completion',
    desc: 'Test vocabulary and context understanding',
  },
  { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
  {
    id: 6,
    title: 'Story Listen Facts',
    desc: 'Evaluate comprehension and retention',
  },
  {
    id: 7,
    title: 'Describe Situation',
    desc: 'Describe the situation clearly',
  },
];

interface AssessmentSidebarProps {
  currentSectionId: number;
}

export default function AssessmentSidebar({
  currentSectionId,
}: AssessmentSidebarProps) {
  const totalSections = sections.length;
  const completedSections = currentSectionId - 1;
  const progressPercent = Math.round(
    (completedSections / totalSections) * 100
  );

  return (
    <aside className="w-80 h-screen bg-white flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="px-4 py-6 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Assessment Progress
        </h2>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              Section {currentSectionId} of {totalSections}
            </span>
            <span className="text-blue-600 font-medium">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= SCROLLABLE SECTIONS ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4">
        <ul className="space-y-3">
          {sections.map((section) => {
            const isCompleted = section.id < currentSectionId;
            const isActive = section.id === currentSectionId;
            const isLocked = section.id > currentSectionId;

            return (
              <li
                key={section.id}
                className={`flex items-start justify-between p-3 rounded-lg border transition ${
                  isCompleted
                    ? 'border-green-400 bg-green-50'
                    : isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {/* LEFT CONTENT */}
                <div>
                  {/* SECTION LABEL + LOCK */}
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Section {section.id}
                      {isLocked && (
                        <Lock size={12} className="ml-1" />
                      )}
                    </span>
                  </div>

                  {/* TITLE */}
                  <p
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-green-700'
                        : ''
                    }`}
                  >
                    {section.title}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="text-xs">{section.desc}</p>

                  {/* COMPLETED INFO */}
                  {isCompleted && (
                    <p className="text-xs text-green-600 mt-1">
                      8 Questions completed
                    </p>
                  )}
                </div>

                {/* RIGHT INDICATOR */}
                <div className="pt-1">
                  {isCompleted && (
                    <CheckCircle2 size={18} className="text-green-600" />
                  )}

                  {isActive && (
                    <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
                  )}

                  {isLocked && (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 block" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="px-4 py-4 shrink-0">
        <p className="text-xs text-gray-400">
          Complete sections in order <br />
          Locked sections will unlock as you progress
        </p>
      </div>
    </aside>
  );
}
