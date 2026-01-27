"use client";

import React from "react";

interface SkillsEditorProps {
  formData: any;
  setFormData: (data: any) => void;
}

/* ===== INPUT STYLE ===== */
const skillInput =
  "w-full px-4 py-1.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 " +
  "border border-transparent " +
  "focus:outline-none focus:ring-0 transition-colors text-sm";

const SkillsEditor: React.FC<SkillsEditorProps> = ({ formData, setFormData }) => {
  const categorizedSkills = formData.categorizedSkills || {
    languages: "",
    frameworks: "",
    libraries: "",
    databases: "",
    technologies: "",
    tools: "",
    cloudPlatforms: "",
    softSkills: ""
  };

  const updateCategory = (category: string, value: string) => {
    setFormData({
      ...formData,
      categorizedSkills: {
        ...categorizedSkills,
        [category]: value
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {/* ================= LEFT FORM ================= */}
      <div className="md:col-span-2 space-y-3 overflow-y-auto pr-4 max-h-96">
        {/* Languages */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Languages <span className="text-red-500">*</span>
          </label>
          <input
            value={categorizedSkills.languages || ""}
            onChange={(e) => updateCategory("languages", e.target.value)}
            placeholder="e.g., Python, JavaScript, Go, TypeScript..."
            className={skillInput}
          />
        </div>

        {/* Frameworks */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Frameworks <span className="text-red-500">*</span>
          </label>
          <input
            value={categorizedSkills.frameworks || ""}
            onChange={(e) => updateCategory("frameworks", e.target.value)}
            placeholder="e.g., React, Django, FastAPI..."
            className={skillInput}
          />
        </div>

        {/* Libraries */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Libraries
          </label>
          <input
            value={categorizedSkills.libraries || ""}
            onChange={(e) => updateCategory("libraries", e.target.value)}
            placeholder="e.g., Foundation, NumPy, Pandas..."
            className={skillInput}
          />
        </div>

        {/* Databases */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Databases <span className="text-red-500">*</span>
          </label>
          <input
            value={categorizedSkills.databases || ""}
            onChange={(e) => updateCategory("databases", e.target.value)}
            placeholder="e.g., PostgreSQL, MongoDB, MySQL, Redis..."
            className={skillInput}
          />
        </div>

        {/* Technologies */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Technologies
          </label>
          <input
            value={categorizedSkills.technologies || ""}
            onChange={(e) => updateCategory("technologies", e.target.value)}
            placeholder="e.g., AI, Caching, Microservices, Scaling, Scrum..."
            className={skillInput}
          />
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Tools <span className="text-red-500">*</span>
          </label>
          <input
            value={categorizedSkills.tools || ""}
            onChange={(e) => updateCategory("tools", e.target.value)}
            placeholder="e.g., Docker, Git, Jenkins, Jira, Kubernetes..."
            className={skillInput}
          />
        </div>

        {/* Cloud Platforms */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Cloud Platforms
          </label>
          <input
            value={categorizedSkills.cloudPlatforms || ""}
            onChange={(e) => updateCategory("cloudPlatforms", e.target.value)}
            placeholder="e.g., AWS, Azure, Google Cloud Platform (GCP)..."
            className={skillInput}
          />
        </div>

        {/* Soft Skills */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Soft Skills
          </label>
          <input
            value={categorizedSkills.softSkills || ""}
            onChange={(e) => updateCategory("softSkills", e.target.value)}
            placeholder="e.g., Communication, Teamwork, Leadership..."
            className={skillInput}
          />
        </div>
      </div>

      {/* ================= RIGHT TIPS ================= */}
      <div className="space-y-4 text-sm text-gray-700">
        <h3 className="font-semibold text-gray-900 text-base">Tips</h3>

        <div>
          <p className="font-semibold text-gray-900 mb-2">Use all 8 categories</p>
          <p>
            Organize your skills across Languages, Frameworks, Libraries, Databases, Technologies, Tools, Cloud Platforms, and Soft Skills for comprehensive coverage.
          </p>
        </div>

        <p>
          <span className="font-semibold">Required fields:</span> Languages, Frameworks, Databases, and Tools should be filled for most technical roles.
        </p>

        <p>
          <span className="font-semibold">Optional fields:</span> Libraries, Technologies, Cloud Platforms, and Soft Skills provide additional detail and completeness.
        </p>

        <p>
          Use specific, searchable keywords that ATS systems recognize. List skills separated by commas for optimal parsing.
        </p>
      </div>
    </div>
  );
};

export default SkillsEditor;