import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
interface ProjectEntry {
  title: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  link: string;
}
const Projects: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const {loadingIndex,suggestions,activePopup,setActivePopup,generateSuggestions,} = useAISuggestions();
  // ✅ Validation hook
  const {errors,validateRequired,clearError,clearSectionIndexErrors,reindexErrors,} = useValidation();
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Handle input changes
  const handleChange = (index: number,field: keyof ProjectEntry,value: string) => {
    const updated = [...(resumeData.projects || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, projects: updated });
    clearError("project", index, field);
  };
  // Add new project
  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [
        ...(resumeData.projects || []),
        { title: "",description: "",technologies: "",startDate: "",endDate: "",link: "", },
      ],
    });
  };
  // Remove project
  const removeProject = (index: number) => {
    const updated = [...(resumeData.projects || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, projects: updated });
    clearSectionIndexErrors("project", index);
    reindexErrors("project", index);
  };
  // Handle AI Description Generation
  const handleGenerate = (index: number, project: ProjectEntry) => {
    if (
      !validateRequired("project", index, {
        title: project.title,
        technologies: project.technologies,
      })
    )
      return;
    const prompt = `Write 3 project resume bullet points:
- Project: ${project.title}
- Technologies: ${project.technologies}
Focus on achievements, measurable results, and technical impact. Use strong action verbs.`;
    generateSuggestions(index, prompt);
  };
  // Position popup near clicked "Generate" button
  useEffect(() => {
    if (activePopup !== null && buttonRefs.current[activePopup]) {
      const rect = buttonRefs.current[activePopup]!.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY - 260,
        left: rect.right + window.scrollX + 8,
      });
    }
  }, [activePopup, suggestions]);
  return (
    <div className="flex flex-col gap-6 ml-8 mt-3">
      {(resumeData.projects || []).map((project, index) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
          {/* Project Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.title}
              placeholder="Enter Project Title"
              onChange={(e) => handleChange(index, "title", e.target.value)}
              onBlur={() =>
                validateRequired("project", index, { title: project.title })
              }
              className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
                errors[`project-${index}-title`]
                  ? "border-gray-300"
                  : "border-gray-300 hover:border-gray-700"
              }`}
            />
            {errors[`project-${index}-title`] && (
              <span className="text-xs text-red-500">
                {errors[`project-${index}-title`]}
              </span>
            )}
          </div>
          {/* Technologies */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Technologies <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.technologies}
              placeholder="Enter Technologies"
              onChange={(e) => handleChange(index, "technologies", e.target.value)}
              onBlur={() =>
                validateRequired("project", index, {
                  technologies: project.technologies,
                })
              }
              className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
                errors[`project-${index}-technologies`]
                  ? "border-gray-300"
                  : "border-gray-300 hover:border-gray-700"
              }`}
            />
            {errors[`project-${index}-technologies`] && (
              <span className="text-xs text-red-500">
                {errors[`project-${index}-technologies`]}
              </span>
            )}
          </div>
          {/* Description + AI Button */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <textarea
              value={project.description}
              placeholder="Enter Description or click Generate"
              onChange={(e) => handleChange(index, "description", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              rows={3}
            />
            <button
              type="button"
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              disabled={loadingIndex === index}
              onClick={() => handleGenerate(index, project)}
              className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
            >
              {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
            </button>
            {/* AI Suggestions Popup */}
            {activePopup === index &&
              suggestions[index] &&
              ReactDOM.createPortal(
                <div
                  className="absolute z-[9999]"
                  style={{
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                  }}
                >
                  <AISuggestions
                    options={suggestions[index]}
                    onSelect={(s) => {
                      handleChange(index, "description", s);
                      setActivePopup(null);
                    }}
                    onClose={() => setActivePopup(null)}
                  />
                </div>,
                document.body
              )}
          </div>
          {/* Remove Button */}
          <button
            type="button"
            onClick={() => removeProject(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}
      {/* Add New Project */}
      <button
        type="button"
        onClick={addProject}
        className="w-fit px-13 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Project
      </button>
    </div>
  );
};
export default Projects;


