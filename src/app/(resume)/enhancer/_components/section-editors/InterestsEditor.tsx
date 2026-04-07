"use client";

import React from "react";
import RichTextEditorField from "./RichTextEditorField";

interface InterestItemForm {
  name: string;
  description: string;
}

interface Props {
  formData: {
    items: InterestItemForm[];
    activeIndex: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const emptyItem: InterestItemForm = {
  name: "",
  description: "",
};

export default function InterestsEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: InterestItemForm = items[activeIndex] || emptyItem;

  const { name, description } = current;

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

        {/* Description */}
        <RichTextEditorField
          label="Description *"
          value={description}
          onChange={(val) => updateCurrent({ description: val })}
          placeholder="Describe how you engage with this interest and its relevance to your career..."
          minHeight="140px"
        />
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
            Describe how you engage with these interests actively and explain how
            they relate to your career goals or demonstrate your professional development.
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
