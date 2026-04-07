"use client";

import React from "react";

interface ReferenceItemForm {
  name: string;
  relation: string;
  contact: string;
}

interface Props {
  formData: {
    items: ReferenceItemForm[];
    activeIndex: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const RELATION_OPTIONS = [
  "Select relation",
  "Manager",
  "Colleague",
  "Professor",
  "Supervisor",
  "Client",
  "Mentor",
  "Team Lead",
  "Director",
  "Other",
];

const emptyItem: ReferenceItemForm = {
  name: "",
  relation: "",
  contact: "",
};

export default function ReferencesEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: ReferenceItemForm = items[activeIndex] || emptyItem;

  const { name, relation, contact } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<ReferenceItemForm>) => {
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
        {/* Reference Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Reference Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => updateCurrent({ name: e.target.value })}
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Relation
          </label>
          <select
            value={relation}
            onChange={(e) => updateCurrent({ relation: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors cursor-pointer"
          >
            {RELATION_OPTIONS.map((rel) => (
              <option key={rel} value={rel === "Select relation" ? "" : rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Contact
          </label>
          <input
            value={contact}
            onChange={(e) => updateCurrent({ contact: e.target.value })}
            placeholder="Email or Phone Number"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Professional references strengthen your application by providing
            third-party validation of your skills and work ethic. Choose
            references who can speak knowledgeably about your qualifications.
          </p>

          <p>
            Include their full name, professional relationship to you, and
            contact information. Always ask permission before listing someone as
            a reference and keep them informed about your job search.
          </p>
        </div>
      </div>
    </div>
  );
}
