"use client";

import React, { useState, useMemo } from "react";
import { Plus, Check, Search } from "lucide-react";

interface EducationItemForm {
  college: string;
  degree: string;
  branch: string;
  duration: string;
  grade: string;
  gradeType: string;
  achievements: string;
}

interface Props {
  formData: {
    items: EducationItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

/* ================= EXAMPLE ACHIEVEMENTS ================= */
type ExampleAchievement = {
  id: string;
  text: string;
};

const EXAMPLE_ACHIEVEMENTS: ExampleAchievement[] = [
  {
    id: "e1",
    text: "Currently completing courses in computer science, robotics, and statistics",
  },
  {
    id: "e2",
    text: "Graduated summa cum laude—3.7+ GPA",
  },
  {
    id: "e3",
    text: "Played the position of Wide Receiver on the school football team from 20XX to 20XX",
  },
  {
    id: "e4",
    text: "Studied and became conversational in Spanish during a semester abroad in Mexico",
  },
  {
    id: "e5",
    text: "Volunteered on a monthly basis to prepare meals at the local community food bank",
  },
  {
    id: "e6",
    text: "Served as President of Student Council for the 20XX to 20XX academic year",
  },
  {
    id: "e7",
    text: "Dean's List - All Semesters",
  },
  {
    id: "e8",
    text: "Recipient of Academic Excellence Scholarship",
  },
];

const emptyItem: EducationItemForm = {
  college: "",
  degree: "",
  branch: "",
  duration: "",
  grade: "",
  gradeType: "",
  achievements: "",
};

function EducationEditor({ formData, setFormData }: Props) {
  const [activeTab, setActiveTab] = useState<"tips" | "examples">("tips");
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: EducationItemForm = items[activeIndex] || emptyItem;

  const { college, degree, branch, duration, grade, gradeType, achievements } =
    current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<EducationItemForm>) => {
    const nextItems = [...items];
    nextItems[activeIndex] = { ...current, ...patch };
    setFormData({
      ...formData,
      items: nextItems,
      activeIndex,
    });
  };

  const addAnotherEducation = () => {
    // if current is completely empty, do nothing
    const hasContent =
      current.school ||
      current.fieldOfStudy ||
      current.startDate ||
      current.endDate ||
      current.location ||
      current.achievements;

    const nextItems = hasContent ? [...items] : [...items.slice(0, -1)];

    if (hasContent) {
      nextItems[activeIndex] = current;
    }

    nextItems.push(emptyItem);

    setFormData({
      ...formData,
      items: nextItems,
      activeIndex: nextItems.length - 1, // internal switch only
    });
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return EXAMPLE_ACHIEVEMENTS;
    return EXAMPLE_ACHIEVEMENTS.filter((a) =>
      a.text.toLowerCase().includes(term)
    );
  }, [search]);

  /* ================= ADD ACHIEVEMENT ================= */
  const addAchievement = (item: ExampleAchievement) => {
    const currentText = achievements.trim();
    const newText = currentText
      ? `${currentText}\n• ${item.text}`
      : `• ${item.text}`;

    updateCurrent({ achievements: newText });

    setAddedIds((prev) => new Set([...Array.from(prev), item.id]));
  };

  /* ================= UI ================= */
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* ================= LEFT ================= */}
      <div className="md:col-span-2 space-y-6">
        {/* College & Degree */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">School / College</label>
            <input
              value={college}
              onChange={(e) => updateCurrent({ college: e.target.value })}
              placeholder="e.g., University of California"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Degree
            </label>
            <input
              value={degree}
              onChange={(e) =>
                updateCurrent({ degree: e.target.value })
              }
              placeholder="e.g., Bachelor of Science in Computer Science"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>
        </div>

        {/* Branch & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Field of Study / Branch
            </label>
            <input
              value={branch}
              onChange={(e) => updateCurrent({ branch: e.target.value })}
              placeholder="e.g., Computer Science"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Duration</label>
            <input
              value={duration}
              onChange={(e) => updateCurrent({ duration: e.target.value })}
              placeholder="e.g., Feb 16 – May 20"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>
        </div>

        {/* Grade & Grade Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Grade</label>
            <input
              value={grade}
              onChange={(e) => updateCurrent({ grade: e.target.value })}
              placeholder="e.g., 3.8"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Grade Type
            </label>
            <input
              value={gradeType}
              onChange={(e) => updateCurrent({ gradeType: e.target.value })}
              placeholder="e.g., GPA"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>
        </div>

        {/* Academic Achievements */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            What are your academic achievements?
          </label>

          <div className="relative">
            <textarea
              value={achievements}
              onChange={(e) =>
                updateCurrent({ achievements: e.target.value })
              }
              onFocus={() => setActiveTab("examples")}
              placeholder="e.g. Received the Jane Doe Scholarship in 20XX"
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent border-b-2 border-b-transparent focus:border-b-blue-700 outline-none resize-none"
            />

            {/* Formatting Toolbar (visual only) */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-200 rounded">
                <span className="font-bold text-sm">B</span>
              </button>
              <button className="p-1.5 hover:bg-gray-200 rounded">
                <span className="italic text-sm">I</span>
              </button>
              <button className="p-1.5 hover:bg-gray-200 rounded">
                <span className="text-sm">•</span>
              </button>
              <button className="p-1.5 hover:bg-gray-200 rounded">
                <span className="text-sm">1.</span>
              </button>
            </div>
          </div>
        </div>

        {/* NOTE: no Add Additional here; button lives in modal footer */}
      </div>

      {/* ================= RIGHT ================= */}
      <div className="border-l pl-6 h-[500px] flex flex-col">
        {/* TABS */}
        <div className="flex gap-6 text-sm font-medium border-b mb-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab("tips")}
            className={`pb-2 ${
              activeTab === "tips"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Tips
          </button>

          <button
            onClick={() => setActiveTab("examples")}
            className={`pb-2 ${
              activeTab === "examples"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Examples
          </button>
        </div>

        {/* ================= TIPS ================= */}
        {activeTab === "tips" && (
          <div className="text-sm text-gray-700 space-y-3 flex-1 overflow-y-auto">
            <p>
              It pays to be picky about the academic accomplishments that you
              list on your resume.
            </p>
            <p>
              Use additional entries for masters, bachelor, and school only if
              they add value for the job.
            </p>
          </div>
        )}

        {/* ================= EXAMPLES ================= */}
        {activeTab === "examples" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* SEARCH */}
            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search achievements"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
              />
            </div>

            {/* EXAMPLE LIST */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {filtered.map((item) => {
                const isAdded = addedIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => addAchievement(item)}
                    disabled={isAdded}
                    className={`
                      w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left
                      ${
                        isAdded
                          ? "bg-blue-50 border-blue-600 text-blue-700 cursor-default"
                          : "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-600"
                      }
                    `}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isAdded ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EducationEditor;
