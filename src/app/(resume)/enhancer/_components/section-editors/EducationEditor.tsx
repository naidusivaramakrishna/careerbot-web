"use client";

import React from "react";

interface EducationItemForm {
  college: string;
  degree: string;
  branch: string;
  duration: string;
  grade: string;
  gradeType: string;
}

interface Props {
  formData: {
    items: EducationItemForm[];
    activeIndex: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const emptyItem: EducationItemForm = {
  college: "",
  degree: "",
  branch: "",
  duration: "",
  grade: "",
  gradeType: "",
};

function EducationEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: EducationItemForm = items[activeIndex] || emptyItem;

  const { college, degree, branch, duration, grade, gradeType } =
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
      current.college ||
      current.degree ||
      current.branch ||
      current.duration ||
      current.grade ||
      current.gradeType;

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

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
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

      {/* NOTE: no Add Additional here; button lives in modal footer */}
    </div>
  );
}

export default EducationEditor;
