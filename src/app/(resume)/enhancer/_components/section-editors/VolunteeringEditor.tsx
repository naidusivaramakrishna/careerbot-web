"use client";

import React from "react";
import RichTextEditorField from "./RichTextEditorField";

interface VolunteeringItemForm {
  organization: string;
  role: string;
  duration: string;
  description: string;
}

interface Props {
  formData: {
    items: VolunteeringItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const emptyItem: VolunteeringItemForm = {
  organization: "",
  role: "",
  duration: "",
  description: "",
};

export default function VolunteeringEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: VolunteeringItemForm = items[activeIndex] || emptyItem;

  const { organization, role, duration, description } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<VolunteeringItemForm>) => {
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
        {/* Organization */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Organization <span className="text-red-500">*</span>
          </label>
          <input
            value={organization}
            onChange={(e) => updateCurrent({ organization: e.target.value })}
            placeholder="Organization Name"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Role
          </label>
          <input
            value={role}
            onChange={(e) => updateCurrent({ role: e.target.value })}
            placeholder="Volunteer Role"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Duration
          </label>
          <input
            value={duration}
            onChange={(e) => updateCurrent({ duration: e.target.value })}
            placeholder="e.g., 2023 – Present or 2022 - 2023"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">e.g., 2023 – Present</p>
        </div>

        {/* Description */}
        <RichTextEditorField
          label="Description"
          value={description}
          onChange={(val) => updateCurrent({ description: val })}
          placeholder="Describe your volunteer experience, responsibilities, and impact..."
          minHeight="140px"
        />
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Volunteer experience demonstrates commitment to community service and
            transferable skills. Highlight leadership roles, significant
            contributions, and relevant experience that aligns with your career
            goals.
          </p>

          <p>
            Include the organization name, your role, and dates of service.
            Emphasize skills developed, responsibilities held, and impact made
            through your volunteer work.
          </p>

          <p className="text-xs text-gray-500 italic">
            *82% of hiring managers value volunteer experience
          </p>
        </div>
      </div>
    </div>
  );
}
