"use client";

import React from "react";

interface HobbyItemForm {
  name: string;
  proficiencyLevel: string;
  achievement: string;
  description: string;
}

interface Props {
  formData: {
    items: HobbyItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const PROFICIENCY_LEVELS = [
  "Select level",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

const emptyItem: HobbyItemForm = {
  name: "",
  proficiencyLevel: "",
  achievement: "",
  description: "",
};

export default function HobbiesEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: HobbyItemForm = items[activeIndex] || emptyItem;

  const { name, proficiencyLevel, achievement, description } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<HobbyItemForm>) => {
    const nextItems = [...items];
    nextItems[activeIndex] = { ...current, ...patch };
    setFormData({
      ...formData,
      items: nextItems,
      activeIndex,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* ================= LEFT SIDE ================= */}
      <div className="md:col-span-2 space-y-6">
        {/* Hobby Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Hobby Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => updateCurrent({ name: e.target.value })}
            placeholder="e.g., Guitar Playing, Photography"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Proficiency Level & Achievement */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Proficiency Level
            </label>
            <select
              value={proficiencyLevel}
              onChange={(e) =>
                updateCurrent({ proficiencyLevel: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors cursor-pointer"
            >
              {PROFICIENCY_LEVELS.map((level) => (
                <option key={level} value={level === "Select level" ? "" : level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Achievement
            </label>
            <input
              value={achievement}
              onChange={(e) => updateCurrent({ achievement: e.target.value })}
              placeholder="e.g., Won first place"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Description
          </label>

          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                className="font-bold text-gray-700 hover:text-gray-900 text-sm"
              >
                B
              </button>
              <button
                type="button"
                className="italic text-gray-700 hover:text-gray-900 text-sm"
              >
                I
              </button>
              <button
                type="button"
                className="underline text-gray-700 hover:text-gray-900 text-sm"
              >
                U
              </button>
              <div className="h-4 border-r border-gray-300"></div>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 text-sm"
              >
                ‣
              </button>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 text-sm"
              >
                1.
              </button>
              <div className="h-4 border-r border-gray-300"></div>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 text-sm"
              >
                ↻
              </button>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 text-sm"
              >
                ↺
              </button>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 text-sm"
              >
                🔗
              </button>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => updateCurrent({ description: e.target.value })}
              placeholder="Describe your hobby and why you enjoy it..."
              className="w-full px-4 py-3 text-sm leading-5 resize-none outline-none min-h-[100px] text-gray-900 focus:border-none"
            />
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Hobbies demonstrate your personality and soft skills. Choose hobbies
            that show dedication, creativity, or leadership qualities relevant to
            your field.
          </p>

          <p>
            Include the hobby name, your proficiency level, and any achievements
            or recognition you have gained. Be honest about your skill level - it
            builds credibility.
          </p>

          <p className="text-xs text-gray-500 italic">
            *Including relevant hobbies can increase candidate engagement by 25%.
          </p>
        </div>
      </div>
    </div>
  );
}
