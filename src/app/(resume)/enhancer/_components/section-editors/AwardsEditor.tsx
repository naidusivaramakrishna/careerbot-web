"use client";

import React from "react";

interface AwardItemForm {
  title: string;
  issuedBy: string;
  year: string;
}

interface Props {
  formData: {
    items: AwardItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const emptyItem: AwardItemForm = {
  title: "",
  issuedBy: "",
  year: "",
};

export default function AwardsEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: AwardItemForm = items[activeIndex] || emptyItem;

  const { title, issuedBy, year } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<AwardItemForm>) => {
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
        {/* Award Title */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Award Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => updateCurrent({ title: e.target.value })}
            placeholder="Award Title"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Issued By & Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Issued By
            </label>
            <input
              value={issuedBy}
              onChange={(e) => updateCurrent({ issuedBy: e.target.value })}
              placeholder="Organization Name"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Year
            </label>
            <input
              value={year}
              onChange={(e) => updateCurrent({ year: e.target.value })}
              placeholder="YYYY"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Awards and honors demonstrate recognition for excellence and
            outstanding performance. List achievements that showcase your unique
            contributions and distinguish you from other candidates.
          </p>

          <p>
            Include the award title, issuing organization, and year received.
            Focus on prestigious, relevant awards that align with your career
            goals and highlight your professional accomplishments.
          </p>
        </div>
      </div>
    </div>
  );
}
