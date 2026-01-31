"use client";

import React from "react";

interface InterestItemForm {
  name: string;
  category: string;
  description: string;
}

interface Props {
  formData: {
    items: InterestItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const INTEREST_CATEGORIES = [
  "Select category",
  "Technology",
  "Business",
  "Science",
  "Arts & Design",
  "Health & Wellness",
  "Education",
  "Innovation",
  "Sustainability",
  "Other",
];

const emptyItem: InterestItemForm = {
  name: "",
  category: "",
  description: "",
};

export default function InterestsEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: InterestItemForm = items[activeIndex] || emptyItem;

  const { name, category, description } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<InterestItemForm>) => {
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
        {/* Interest Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Interest Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => updateCurrent({ name: e.target.value })}
            placeholder="e.g., Artificial Intelligence, Sustainable Architecture"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => updateCurrent({ category: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors cursor-pointer"
          >
            {INTEREST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat === "Select category" ? "" : cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Description <span className="text-red-500">*</span>
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
              rows={5}
              value={description}
              onChange={(e) => updateCurrent({ description: e.target.value })}
              placeholder="Describe how you engage with this interest and its relevance to your career..."
              className="w-full px-4 py-3 text-sm leading-5 resize-none outline-none min-h-[120px] text-gray-900 focus:border-none"
            />
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Interests show your intellectual curiosity and how you stay current
            in your field. Include interests that demonstrate professional growth
            and industry awareness.
          </p>

          <p>
            Select appropriate categories to help ATS systems better understand
            the relevance of your interests. Describe how you engage with these
            interests actively.
          </p>

          <p className="text-xs text-gray-500 italic">
            *Relevant interests can highlight cultural fit and industry alignment
            to potential employers.
          </p>
        </div>
      </div>
    </div>
  );
}
