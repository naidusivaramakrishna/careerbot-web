"use client";
import React, { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useResume, type CustomCategory } from "../../../_context/ResumeContext";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput from "../TechnologyChipsInput";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const SKILL_CATEGORIES = [
  {
    key: "programming_languages",
    label: "Programming Languages",
    placeholder: "e.g., Python, JavaScript, Java...",
    suggestions: ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby"],
  },
  {
    key: "frameworks",
    label: "Frameworks & Libraries",
    placeholder: "e.g., React, Django, FastAPI...",
    suggestions: ["React", "Angular", "Vue.js", "Next.js", "Django", "FastAPI", "Flask", "Node.js", "Express.js", "Spring Boot", "ASP.NET", "Laravel"],
  },
  {
    key: "databases",
    label: "Databases",
    placeholder: "e.g., PostgreSQL, MongoDB...",
    suggestions: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "DynamoDB", "Firebase", "Cassandra", "Oracle", "SQL Server", "SQLite"],
  },
  {
    key: "tools",
    label: "Tools & Technologies",
    placeholder: "e.g., Docker, Git, Jenkins...",
    suggestions: ["Docker", "Kubernetes", "Git", "Jenkins", "JIRA", "GitHub", "GitLab", "CircleCI", "Terraform", "Ansible", "Webpack", "Babel"],
  },
  {
    key: "cloud_platforms",
    label: "Cloud Platforms",
    placeholder: "e.g., AWS, Azure, Google Cloud...",
    suggestions: ["AWS", "Azure", "Google Cloud", "Heroku", "DigitalOcean", "Netlify", "Vercel", "IBM Cloud"],
  },
  {
    key: "soft_skills",
    label: "Soft Skills",
    placeholder: "e.g., Leadership, Communication...",
    suggestions: ["Leadership", "Team Collaboration", "Problem Solving", "Communication", "Time Management", "Critical Thinking", "Adaptability", "Creativity"],
  },
];

const Skills: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, clearError } = useValidation();

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const categorizedSkills = resumeData.categorizedSkills || {
    programming_languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    cloud_platforms: [],
    soft_skills: [],
  };

  const customCategories: CustomCategory[] = categorizedSkills.custom_categories || [];

  const updateSkills = (updated: typeof categorizedSkills) => {
    const allSkills = [
      ...updated.programming_languages,
      ...updated.frameworks,
      ...updated.databases,
      ...updated.tools,
      ...updated.cloud_platforms,
      ...updated.soft_skills,
      ...(updated.custom_categories || []).flatMap((c) => c.skills),
    ];
    setResumeData({ ...resumeData, categorizedSkills: updated, skills: allSkills });
  };

  const handleCategorySkillsChange = (categoryKey: string, updatedSkills: string[]) => {
    const updated = { ...categorizedSkills, [categoryKey]: updatedSkills };
    updateSkills(updated);
    if (updatedSkills.length > 0) clearError("Skills", 0, categoryKey);
  };

  const handleBlur = () => {
    // Skills are optional, no validation needed
  };

  // ── Custom categories ──
  const handleAddCustomCategory = () => {
    const newEntry: CustomCategory = { id: uid(), name: "", skills: [] };
    updateSkills({
      ...categorizedSkills,
      custom_categories: [...customCategories, newEntry],
    });
  };

  const handleCustomCategoryNameChange = (id: string, name: string) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: customCategories.map((c) => (c.id === id ? { ...c, name } : c)),
    });
  };

  const handleCustomCategorySkillsChange = (id: string, skills: string[]) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: customCategories.map((c) => (c.id === id ? { ...c, skills } : c)),
    });
  };

  const handleDeleteCustomCategory = (id: string) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: customCategories.filter((c) => c.id !== id),
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      <div className="flex gap-6 items-start">
        {/* Left: Scrollable form */}
        <div
          ref={formScrollRef}
          className="flex-1 h-[500px] overflow-y-auto mt-6 scrollbar-hide pr-2"
        >
          <div className="flex flex-col gap-6">
            {/* Standard categories */}
            {SKILL_CATEGORIES.map((cat) => {
              const currentSkills =
                (categorizedSkills as unknown as Record<string, string[]>)[cat.key] || [];
              return (
                <div key={cat.key} className="flex flex-col gap-1 relative">
                  <TechnologyChipsInput
                    label={cat.label}
                    selectedTechnologies={currentSkills}
                    onTechnologiesChange={(skills) => handleCategorySkillsChange(cat.key, skills)}
                    suggestions={cat.suggestions}
                    placeholder={cat.placeholder}
                    error={errors[`Skills-0-${cat.key}`]}
                  />
                  <div onBlur={() => handleBlur(cat.key)} className="hidden" />
                </div>
              );
            })}

            {/* Custom categories */}
            {customCategories.map((custom) => (
              <div key={custom.id} className="flex flex-col gap-2 border border-dashed border-gray-300 rounded-lg p-3">
                {/* Category name input + delete button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={custom.name}
                    onChange={(e) => handleCustomCategoryNameChange(custom.id, e.target.value)}
                    placeholder="Category name (e.g. Architecture Patterns)"
                    className="flex-1 text-sm font-medium border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomCategory(custom.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Skills chips for this custom category */}
                <TechnologyChipsInput
                  label=""
                  selectedTechnologies={custom.skills}
                  onTechnologiesChange={(skills) => handleCustomCategorySkillsChange(custom.id, skills)}
                  suggestions={[]}
                  placeholder={custom.name ? `Add ${custom.name} skills...` : "Add skills..."}
                />
              </div>
            ))}

            {/* Add custom category button */}
            <button
              type="button"
              onClick={handleAddCustomCategory}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium w-fit"
            >
              <Plus size={16} />
              Add Custom Category
            </button>
          </div>
        </div>

        {/* Right: Tips panel */}
        <div className="w-80 shrink-0 sticky top-2">
          <SectionTipsPanel
            sectionKey="Skills"
            staticTips={
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>
                    <strong>Categorize your skills</strong> to make them easy to scan. Group them by Programming Languages, Frameworks, Databases, Tools, Cloud Platforms, and Soft Skills.
                  </p>
                  <p>
                    Use <strong>Add Custom Category</strong> to create your own skill groups like "Architecture Patterns", "DevOps Tools", or any domain-specific set.
                  </p>
                  <p>
                    Use specific, searchable keywords that ATS systems recognize. Include both hard skills (technical) and soft skills (communication, leadership).
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *70% of recruiters use ATS to filter candidates based on skills matching.
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Skills;
