"use client";

import React from "react";

interface InternshipItemForm {
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string;
}

interface Props {
  formData: {
    items: InternshipItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const emptyItem: InternshipItemForm = {
  company: "",
  role: "",
  duration: "",
  location: "",
  description: "",
};

const InternshipsEditor: React.FC<Props> = ({ formData, setFormData }) => {
  const items = formData?.items && formData.items.length > 0
    ? formData.items
    : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const internship = items[activeIndex] || emptyItem;

  const update = (field: string, value: any) => {
    const updated = [...items];
    updated[activeIndex] = { ...internship, [field]: value };
    setFormData({
      ...formData,
      items: updated,
      activeIndex,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-10">
      {/* LEFT SIDE – FORM */}
      <div className="space-y-4">
        {/* Company & Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              value={internship.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Company"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Role or job title <span className="text-red-500">*</span>
            </label>
            <input
              value={internship.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="Role"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>
        </div>

        {/* Duration & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Duration</label>
            <input
              value={internship.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="MM/YY – MM/YY or Present"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Location</label>
            <input
              value={internship.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="City, State"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Internship description at the company
          </label>
          <textarea
            value={internship.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what you did, key contributions, and what you learned. Use bullet points for multiple achievements."
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none resize-none"
          />
        </div>
      </div>

      {/* RIGHT SIDE – TIPS */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Tips</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Internship experiences demonstrate initiative and practical skills. Highlight specific contributions, projects completed, and skills gained during your internship.
          <br /><br />
          Emphasize measurable achievements and how you added value to the organization, even in a learning capacity. Use action verbs and quantify results whenever possible.
        </p>
      </div>
    </div>
  );
};

export default InternshipsEditor;
