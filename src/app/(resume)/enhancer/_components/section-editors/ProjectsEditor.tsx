"use client";

import React from "react";

interface ProjectItemForm {
  title: string;
  link?: string;
  client?: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Props {
  formData: {
    items: ProjectItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const emptyItem: ProjectItemForm = {
  title: "",
  link: "",
  client: "",
  startDate: "",
  endDate: "",
  description: "",
};

const ProjectsEditor: React.FC<Props> = ({ formData, setFormData }) => {
  // ✅ FIX: Initialize with empty item if undefined
  const items = formData?.items && formData.items.length > 0 
    ? formData.items 
    : [emptyItem];
  
  const activeIndex = formData?.activeIndex ?? 0;
  const project = items[activeIndex] || emptyItem;

  const update = (field: string, value: any) => {
    const updated = [...items];
    updated[activeIndex] = { ...project, [field]: value };
    setFormData({
      ...formData,
      items: updated,
      activeIndex,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Link */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Project Title
          </label>
          <input
            value={project.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="E-Commerce Platform"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Project Link (Optional)
          </label>
          <input
            value={project.link || ""}
            onChange={(e) => update("link", e.target.value)}
            placeholder="https://github.com/..."
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
          />
        </div>
      </div>

      {/* Client & Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Client (Optional)
          </label>
          <input
            value={project.client || ""}
            onChange={(e) => update("client", e.target.value)}
            placeholder="e.g., Company Name, Client Name"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
          />
        </div>

        <div />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Start Date
          </label>
          <input
            value={project.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            placeholder="MM/YYYY"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">End Date</label>
          <input
            value={project.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            placeholder="MM/YYYY or Present"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Project Description
        </label>
        <textarea
          value={project.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Describe what you built, technologies used, and impact..."
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default ProjectsEditor;