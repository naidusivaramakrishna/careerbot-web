"use client";

import React from "react";
import RichTextEditorField from "./RichTextEditorField";

interface HobbyItemForm {
  name: string;
  description: string;
}

interface Props {
  formData: {
    items: HobbyItemForm[];
    activeIndex: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const emptyItem: HobbyItemForm = {
  name: "",
  description: "",
};

export default function HobbiesEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: HobbyItemForm = items[activeIndex] || emptyItem;

  const { name, description } = current;

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

        {/* Description */}
        <RichTextEditorField
          label="Description"
          value={description}
          onChange={(val) => updateCurrent({ description: val })}
          placeholder="Describe your hobby and why you enjoy it..."
          minHeight="140px"
        />
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
            Include the hobby name and a brief description of what you enjoy about
            it and how it relates to your professional development or personal growth.
          </p>

          <p className="text-xs text-gray-500 italic">
            *Including relevant hobbies can increase candidate engagement by 25%.
          </p>
        </div>
      </div>
    </div>
  );
}
