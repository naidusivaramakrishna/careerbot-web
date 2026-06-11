"use client";
import React, { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useResume, type CustomCategory } from "../../../_context/ResumeContext";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput, { type TechnologyChipsInputHandle } from "../TechnologyChipsInput";
import { addSkillToCategory, deleteSkillCategory, deleteSkillById } from "@/api/resumeApi";
import { toast } from "sonner";

const CATEGORY_KEY_MAP: Record<string, string> = {
  programming_languages: "programmingLanguages",
  frameworks: "frameworks",
  soft_skills: "softSkills",
  project_management: "projectManagement",
  marketing_sales: "marketingSales",
};

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
    key: "project_management",
    label: "Project Management",
    placeholder: "e.g., Agile, Scrum, PMP...",
    suggestions: ["Agile", "Scrum", "Kanban", "Waterfall", "PRINCE2", "PMP", "Six Sigma", "Lean", "Risk Management", "Budgeting", "Stakeholder Management", "Change Management"],
  },
  {
    key: "marketing_sales",
    label: "Marketing & Sales",
    placeholder: "e.g., SEO, CRM, Digital Marketing...",
    suggestions: ["Digital Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Email Marketing", "Market Research", "CRM", "Brand Management", "Sales Strategy", "Google Analytics", "Lead Generation", "Copywriting"],
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
  const { errors } = useValidation();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const skillsInputRefs = useRef<Record<string, TechnologyChipsInputHandle | null>>({});
  const latestCustomIdRef = useRef<string | null>(null);

  useEffect(() => {
    const id = latestCustomIdRef.current;
    if (id && nameInputRefs.current[id]) {
      nameInputRefs.current[id]?.focus();
      latestCustomIdRef.current = null;
    }
  });

  const categorizedSkills = resumeData.categorizedSkills || {
    programming_languages: [],
    frameworks: [],
    soft_skills: [],
    project_management: [],
    marketing_sales: [],
  };

  const customCategories: CustomCategory[] = categorizedSkills.custom_categories || [];
  const hiddenPredefined: string[] = categorizedSkills.hidden_predefined_categories || [];

  const updateSkills = (updated: typeof categorizedSkills) => {
    const allSkills = [
      ...updated.programming_languages,
      ...updated.frameworks,
      ...updated.soft_skills,
      ...(updated.project_management || []),
      ...(updated.marketing_sales || []),
      ...(updated.custom_categories || []).flatMap((c) => c.skills),
    ];
    setResumeData({ ...resumeData, categorizedSkills: updated, skills: allSkills });
  };

  const handleDeletePredefinedCategory = async (categoryKey: string) => {
    const resumeId = resumeData.resume_id;
    if (resumeId) {
      try {
        await deleteSkillCategory(resumeId, categoryKey);
      } catch {
        toast.error("Failed to delete category. Please try again.");
        return;
      }
    }
    updateSkills({
      ...categorizedSkills,
      [categoryKey]: [],
      hidden_predefined_categories: [...hiddenPredefined, categoryKey],
    });
    toast.success("Category deleted successfully.");
  };

  const handleCategorySkillsChange = (categoryKey: string, updatedSkills: string[]) => {
    const updated = { ...categorizedSkills, [categoryKey]: updatedSkills };
    updateSkills(updated);
  };

  // ── Custom categories ──
  const handleAddCustomCategory = () => {
    const newEntry: CustomCategory = { id: uid(), name: "", skills: [] };
    latestCustomIdRef.current = newEntry.id;
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

  const handleDeleteCustomCategory = async (id: string) => {
    const resumeId = resumeData.resume_id;
    const custom = customCategories.find((c) => c.id === id);
    if (resumeId && custom?.name) {
      try {
        await deleteSkillCategory(resumeId, custom.name);
      } catch {
        toast.error("Failed to delete category. Please try again.");
        return;
      }
    }
    updateSkills({
      ...categorizedSkills,
      custom_categories: customCategories.filter((c) => c.id !== id),
    });
    toast.success("Category deleted successfully.");
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
            {/* Standard categories — hidden for enhanced resumes */}
            {!isEnhancedResume && SKILL_CATEGORIES.filter((cat) => !hiddenPredefined.includes(cat.key)).map((cat) => {
              const currentSkills =
                (categorizedSkills as unknown as Record<string, string[]>)[cat.key] || [];
              return (
                <div key={cat.key} className="flex flex-col gap-1 relative group">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <TechnologyChipsInput
                        label={cat.label}
                        selectedTechnologies={currentSkills}
                        onTechnologiesChange={(skills) => handleCategorySkillsChange(cat.key, skills)}
                        suggestions={cat.suggestions}
                        placeholder={cat.placeholder}
                        error={errors[`Skills-0-${cat.key}`]}
                        onAddSkill={resumeData.resume_id ? async (skill) => {
                          try {
                            const apiCategory = CATEGORY_KEY_MAP[cat.key] ?? cat.key;
                            const { id } = await addSkillToCategory(resumeData.resume_id!, apiCategory, skill);
                            if (id) {
                              const updatedMap = { ...(categorizedSkills.skill_id_map ?? {}), [`${cat.key}:${skill}`]: id };
                              setResumeData({ ...resumeData, categorizedSkills: { ...categorizedSkills, skill_id_map: updatedMap } });
                            }
                            toast.success("Skill added successfully.");
                          } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : "Failed to add skill. Please try again.";
                            toast.error(errorMsg);
                            throw new Error("api_failed");
                          }
                        } : undefined}
                        onRemoveSkill={resumeData.resume_id ? async (skill) => {
                          try {
                            const apiCategory = CATEGORY_KEY_MAP[cat.key] ?? cat.key;
                            const skillId = categorizedSkills.skill_id_map?.[`${cat.key}:${skill}`] ?? skill;
                            await deleteSkillById(resumeData.resume_id!, apiCategory, skillId);
                            toast.success("Skill removed successfully.");
                          } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : "Failed to remove skill. Please try again.";
                            toast.error(errorMsg);
                            throw new Error("api_failed");
                          }
                        } : undefined}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePredefinedCategory(cat.key)}
                      className="mt-6 p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title={`Remove ${cat.label} category`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Custom categories */}
            {customCategories.map((custom) => (
              <div key={custom.id} className="flex flex-col gap-1 relative group">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {/* Editable label styled like predefined category labels */}
                    <input
                      type="text"
                      value={custom.name}
                      onChange={(e) => handleCustomCategoryNameChange(custom.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          skillsInputRefs.current[custom.id]?.focus();
                        }
                      }}
                      ref={(el) => { nameInputRefs.current[custom.id] = el; }}
                      placeholder="Category name (e.g. Architecture Patterns)"
                      maxLength={80}
                      className="text-sm font-semibold text-[#3b3b3b] bg-transparent border-none outline-none w-full placeholder:text-gray-400 mb-1"
                    />
                    <TechnologyChipsInput
                      ref={(el) => { skillsInputRefs.current[custom.id] = el; }}
                      label=""
                      selectedTechnologies={custom.skills}
                      onTechnologiesChange={(skills) => handleCustomCategorySkillsChange(custom.id, skills)}
                      suggestions={[]}
                      placeholder={custom.name ? `Add ${custom.name} skills...` : "Add skills..."}
                      onAddSkill={resumeData.resume_id && custom.name ? async (skill) => {
                        try {
                          await addSkillToCategory(resumeData.resume_id!, custom.name, skill);
                          toast.success("Skill added successfully.");
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Failed to add skill. Please try again.";
                          toast.error(errorMsg);
                          throw new Error("api_failed");
                        }
                      } : undefined}
                      onRemoveSkill={resumeData.resume_id && custom.name ? async (skill) => {
                        try {
                          await deleteSkillById(resumeData.resume_id!, custom.name, skill);
                          toast.success("Skill removed successfully.");
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Failed to remove skill. Please try again.";
                          toast.error(errorMsg);
                          throw new Error("api_failed");
                        }
                      } : undefined}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomCategory(custom.id)}
                    className="mt-6 p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
