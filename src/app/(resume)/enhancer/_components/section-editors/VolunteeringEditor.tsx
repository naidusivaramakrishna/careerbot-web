"use client";

import React, { useState } from "react";

interface VolunteeringItemForm {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
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
  startDate: "",
  endDate: "",
};

export default function VolunteeringEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: VolunteeringItemForm = items[activeIndex] || emptyItem;

  const { organization, role, startDate, endDate } = current;

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

  const formatDateToDisplay = (date: string): string => {
    if (!date) return "";
    // Handle YYYY-MM format and convert to MM/YY
    if (date.includes("-")) {
      const [year, month] = date.split("-");
      return `${month}/${year.slice(-2)}`;
    }
    return date;
  };

  const parseDisplayDate = (displayDate: string): string => {
    if (!displayDate) return "";
    // Handle MM/YY format and convert to YYYY-MM
    const parts = displayDate.split("/");
    if (parts.length === 2) {
      const month = parts[0].padStart(2, "0");
      const year = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
      return `${year}-${month}`;
    }
    return displayDate;
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

        {/* Start Date & End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Start date
            </label>
            <input
              type="month"
              value={startDate}
              onChange={(e) => updateCurrent({ startDate: e.target.value })}
              placeholder="MM/YY"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">MM/YY</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              End date
            </label>
            <input
              type="month"
              value={endDate}
              onChange={(e) => updateCurrent({ endDate: e.target.value })}
              placeholder="MM/YY"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">MM/YY</p>
          </div>
        </div>
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
