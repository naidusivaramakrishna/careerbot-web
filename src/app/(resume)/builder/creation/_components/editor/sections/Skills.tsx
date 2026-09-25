"use client";
import React, { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useResume, type CustomCategory } from "../../../_context/ResumeContext";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput, { type TechnologyChipsInputHandle } from "../TechnologyChipsInput";
import { addSkillToCategory, deleteSkillCategory, deleteSkillById } from "@/api/resumeApi";
import { addSkillToEnhancedResume, deleteSkillFromEnhancedResume, deleteSkillCategoryFromEnhancedResume } from "@/api/enhancerApi";
import { toast } from "sonner";
import { findSkillCategory, getSkillsForDomain, skillCategoryApiName, type SkillCategory, type SkillDomain } from "@/config/domainSkills";
import { printedSkillKeysForDomain, templateSkillCategoryLabel } from "@/app/(resume)/templates/skillsFilterByDomain";
import { getSkillsEditorDomain, getStoredUserEmail } from "@/app/(resume)/templates/_utils/activeTemplateDomain";
import logger from "@/lib/logger";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

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

  // Resolve the domain exactly as PreviewPanel does (applied career-level
  // template), so the editor never offers categories the preview, PDF and DOCX
  // filter out.
  const resumeId = resumeData.resume_id;
  const rawDomain = getSkillsEditorDomain(getStoredUserEmail());
  const SKILL_CATEGORIES = getSkillsForDomain(rawDomain as SkillDomain);

  // The templates also print categories outside the domain's own list (the
  // general categories for software engineering, cybersecurity and research;
  // see filterSkillsByDomain). Offer those that hold skills, labelled as the
  // resume prints them, so nothing on the resume is left uneditable.
  const ownCategoryKeys = new Set(SKILL_CATEGORIES.map((c) => c.key));
  const storedCategories = (resumeData.categorizedSkills || {}) as unknown as Record<string, unknown>;
  const printedExtraCategories: SkillCategory[] = Array.from(printedSkillKeysForDomain(rawDomain) ?? [])
    .filter((key) => {
      const stored = storedCategories[key];
      return !ownCategoryKeys.has(key) && Array.isArray(stored) && stored.length > 0;
    })
    .map((key) => ({
      placeholder: "Add skills...",
      suggestions: [],
      ...findSkillCategory(key),
      key,
      label: templateSkillCategoryLabel(key),
    }));
  const EDITOR_CATEGORIES = [...SKILL_CATEGORIES, ...printedExtraCategories];

  logger.debug('Skills component state:', { resumeId, rawDomain });

  useEffect(() => {
    const id = latestCustomIdRef.current;
    if (id && nameInputRefs.current[id]) {
      nameInputRefs.current[id]?.focus();
      latestCustomIdRef.current = null;
    }
  });

  // The domain decides which predefined categories are *displayed*
  // (SKILL_CATEGORIES below). Stored data is never filtered: every edit spreads
  // this object into updateSkills, so dropping keys or skill_id_map entries here
  // would erase other categories' skills (and send [] for them on save) and
  // break id lookups for custom-category deletes.
  const getFilteredCategorizedSkills = (): typeof resumeData.categorizedSkills => {
    const defaultSkills: typeof resumeData.categorizedSkills = {
      programming_languages: [],
      frameworks: [],
      soft_skills: [],
      project_management: [],
      marketing_sales: [],
      custom_categories: [],
      hidden_predefined_categories: [],
      skill_id_map: {},
    };
    const allSkills = resumeData.categorizedSkills || defaultSkills;
    const withDomainKeys: Record<string, unknown> = {
      ...allSkills,
      custom_categories: allSkills.custom_categories || [],
      skill_id_map: allSkills.skill_id_map || {},
    };
    SKILL_CATEGORIES.forEach((cat) => {
      if (!Array.isArray(withDomainKeys[cat.key])) withDomainKeys[cat.key] = [];
    });
    return withDomainKeys as typeof resumeData.categorizedSkills;
  };

  const defaultCategorizedSkills: typeof resumeData.categorizedSkills = {
    programming_languages: [],
    frameworks: [],
    soft_skills: [],
    project_management: [],
    marketing_sales: [],
    custom_categories: [],
    hidden_predefined_categories: [],
    skill_id_map: {},
  };

  const categorizedSkills = getFilteredCategorizedSkills() || defaultCategorizedSkills;

  const allCustomCategories: CustomCategory[] = (categorizedSkills as any).custom_categories || [];
  // Every custom category is shown: all resume templates print
  // custom_categories regardless of domain (filterSkillsByDomain keeps them),
  // so hiding one here would leave skills on the PDF the user cannot edit.
  // Categories of the active domain never land here — the loader maps them
  // back to their predefined key (mapBackendSkillsToCategorized).
  const customCategories: CustomCategory[] = allCustomCategories;

  const hiddenPredefined: string[] = (categorizedSkills as any).hidden_predefined_categories || [];

  // DEBUG: Log what categories we have
  logger.debug('Skill categories available:', {
    skillCategoriesKeys: SKILL_CATEGORIES.map((c) => c.key),
    categorizedSkillsKeys: Object.keys(categorizedSkills).filter((k) => !['custom_categories', 'hidden_predefined_categories', 'skill_id_map'].includes(k)),
    allCategorizedSkillsInData: Object.keys(resumeData.categorizedSkills || {}),
  });

  const updateSkills = (updated: Record<string, unknown>) => {
    // Collect all skills from every predefined category key — including other
    // domains' categories kept in state but not displayed — so the flat list
    // matches what the loader builds.
    const META_KEYS = new Set(['custom_categories', 'hidden_predefined_categories', 'skill_id_map']);
    const allSkills = Object.entries(updated)
      .filter(([key, value]) => !META_KEYS.has(key) && Array.isArray(value) && value.every((v) => typeof v === 'string'))
      .flatMap(([, value]) => value as string[]);

    // Add custom category skills
    const customSkills = ((updated.custom_categories || []) as CustomCategory[]).flatMap((c) => c.skills);

    // Ensure all base properties are present as arrays when updating state
    const normalizedUpdated = {
      programming_languages: (updated as any).programming_languages || [],
      frameworks: (updated as any).frameworks || [],
      soft_skills: (updated as any).soft_skills || [],
      project_management: (updated as any).project_management || [],
      marketing_sales: (updated as any).marketing_sales || [],
      ...(updated as Record<string, unknown>),
    };

    setResumeData({ ...resumeData, categorizedSkills: normalizedUpdated as typeof resumeData.categorizedSkills, skills: [...allSkills, ...customSkills] });
  };

  const handleDeletePredefinedCategory = async (categoryKey: string) => {
    const resumeId = resumeData.resume_id;
    if (resumeId) {
      try {
        if (isEnhancedResume) {
          await deleteSkillCategoryFromEnhancedResume(resumeId, skillCategoryApiName(categoryKey));
        } else {
          // Same name the add path sends — the API slugifies it to find the bucket.
          await deleteSkillCategory(resumeId, skillCategoryApiName(categoryKey));
        }
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
      custom_categories: [...allCustomCategories, newEntry],
    });
  };

  const handleCustomCategoryNameChange = (id: string, name: string) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: allCustomCategories.map((c) => (c.id === id ? { ...c, name } : c)),
    });
  };

  const handleCustomCategoryNameBlur = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // For enhanced resumes the predefined categories are hidden, so they are not
    // "existing" from the user's perspective and should not block custom category names.
    const predefinedLabels = isEnhancedResume
      ? []
      : EDITOR_CATEGORIES.map((c) => c.label.toLowerCase());
    const otherCustomNames = customCategories
      .filter((c) => c.id !== id)
      .map((c) => c.name.toLowerCase());
    const allExisting = [...predefinedLabels, ...otherCustomNames];
    if (allExisting.includes(trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" category already exists`);
      updateSkills({
        ...categorizedSkills,
        custom_categories: allCustomCategories.map((c) => (c.id === id ? { ...c, name: "" } : c)),
      });
      nameInputRefs.current[id]?.focus();
    }
  };

  const handleCustomCategorySkillsChange = (id: string, skills: string[]) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: allCustomCategories.map((c) => (c.id === id ? { ...c, skills } : c)),
    });
  };

  const handleDeleteCustomCategory = async (id: string) => {
    const resumeId = resumeData.resume_id;
    const custom = customCategories.find((c) => c.id === id);
    if (resumeId && custom?.name) {
      try {
        if (isEnhancedResume) {
          await deleteSkillCategoryFromEnhancedResume(resumeId, custom.name);
        } else {
          await deleteSkillCategory(resumeId, custom.name);
        }
      } catch {
        toast.error("Failed to delete category. Please try again.");
        return;
      }
    }
    updateSkills({
      ...categorizedSkills,
      custom_categories: allCustomCategories.filter((c) => c.id !== id),
    });
    toast.success("Category deleted successfully.");
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      <div className="flex gap-6 items-start">
        {/* Left: Scrollable form */}
        <div
          ref={formScrollRef}
          className="flex-1 mt-6 pr-2"
        >
          <div className="flex flex-col gap-6">
            {/* Standard categories — hidden for enhanced resumes */}
            {!isEnhancedResume && (() => {
              const visibleCategories = EDITOR_CATEGORIES.filter((cat) => !hiddenPredefined.includes(cat.key));
              logger.debug('Rendering visible categories:', {
                count: visibleCategories.length,
                keys: visibleCategories.map((c) => c.key),
                labels: visibleCategories.map((c) => c.label),
              });
              return visibleCategories;
            })().map((cat) => {
              logger.debug('Rendering predefined category:', { key: cat.key, label: cat.label });
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
                            const apiCategory = skillCategoryApiName(cat.key);
                            const { id } = isEnhancedResume
                              ? await addSkillToEnhancedResume(resumeData.resume_id!, apiCategory, skill)
                              : await addSkillToCategory(resumeData.resume_id!, apiCategory, skill);
                            if (id) {
                              setResumeData(prev => ({
                                ...prev,
                                categorizedSkills: {
                                  programming_languages: prev.categorizedSkills?.programming_languages ?? [],
                                  frameworks: prev.categorizedSkills?.frameworks ?? [],
                                  soft_skills: prev.categorizedSkills?.soft_skills ?? [],
                                  project_management: prev.categorizedSkills?.project_management ?? [],
                                  marketing_sales: prev.categorizedSkills?.marketing_sales ?? [],
                                  ...prev.categorizedSkills,
                                  skill_id_map: { ...(prev.categorizedSkills?.skill_id_map ?? {}), [`${cat.key}:${skill}`]: id },
                                },
                              }));
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
                            const apiCategory = skillCategoryApiName(cat.key);
                            const skillId = categorizedSkills.skill_id_map?.[`${cat.key}:${skill}`] ?? skill;
                            if (isEnhancedResume) {
                              await deleteSkillFromEnhancedResume(resumeData.resume_id!, apiCategory, skillId);
                            } else {
                              await deleteSkillById(resumeData.resume_id!, apiCategory, skillId);
                            }
                            setResumeData(prev => {
                              const newMap = { ...(prev.categorizedSkills?.skill_id_map ?? {}) };
                              delete newMap[`${cat.key}:${skill}`];
                              return {
                                ...prev,
                                categorizedSkills: {
                                  programming_languages: prev.categorizedSkills?.programming_languages ?? [],
                                  frameworks: prev.categorizedSkills?.frameworks ?? [],
                                  soft_skills: prev.categorizedSkills?.soft_skills ?? [],
                                  project_management: prev.categorizedSkills?.project_management ?? [],
                                  marketing_sales: prev.categorizedSkills?.marketing_sales ?? [],
                                  ...prev.categorizedSkills,
                                  skill_id_map: newMap,
                                },
                              };
                            });
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
            {(() => {
              logger.debug('Rendering custom categories:', { count: customCategories.length, names: customCategories.map((c) => c.name) });
              return customCategories;
            })().map((custom) => (
              <div key={custom.id} className="flex flex-col gap-1 relative group">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {/* Editable label styled like predefined category labels */}
                    <input
                      type="text"
                      value={custom.name}
                      onChange={(e) => handleCustomCategoryNameChange(custom.id, e.target.value)}
                      onBlur={(e) => handleCustomCategoryNameBlur(custom.id, e.target.value)}
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
                          const { id } = isEnhancedResume
                            ? await addSkillToEnhancedResume(resumeData.resume_id!, custom.name, skill)
                            : await addSkillToCategory(resumeData.resume_id!, custom.name, skill);
                          if (id) {
                            setResumeData(prev => ({
                              ...prev,
                              categorizedSkills: {
                                programming_languages: prev.categorizedSkills?.programming_languages ?? [],
                                frameworks: prev.categorizedSkills?.frameworks ?? [],
                                soft_skills: prev.categorizedSkills?.soft_skills ?? [],
                                project_management: prev.categorizedSkills?.project_management ?? [],
                                marketing_sales: prev.categorizedSkills?.marketing_sales ?? [],
                                ...prev.categorizedSkills,
                                skill_id_map: { ...(prev.categorizedSkills?.skill_id_map ?? {}), [`${custom.name}:${skill}`]: id },
                              },
                            }));
                          }
                          toast.success("Skill added successfully.");
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Failed to add skill. Please try again.";
                          toast.error(errorMsg);
                          throw new Error("api_failed");
                        }
                      } : undefined}
                      onRemoveSkill={resumeData.resume_id && custom.name ? async (skill) => {
                        try {
                          const skillId = categorizedSkills.skill_id_map?.[`${custom.name}:${skill}`] ?? skill;
                          if (isEnhancedResume) {
                            await deleteSkillFromEnhancedResume(resumeData.resume_id!, custom.name, skillId);
                          } else {
                            await deleteSkillById(resumeData.resume_id!, custom.name, skillId);
                          }
                          setResumeData(prev => {
                            const newMap = { ...(prev.categorizedSkills?.skill_id_map ?? {}) };
                            delete newMap[`${custom.name}:${skill}`];
                            return {
                              ...prev,
                              categorizedSkills: {
                                programming_languages: prev.categorizedSkills?.programming_languages ?? [],
                                frameworks: prev.categorizedSkills?.frameworks ?? [],
                                soft_skills: prev.categorizedSkills?.soft_skills ?? [],
                                project_management: prev.categorizedSkills?.project_management ?? [],
                                marketing_sales: prev.categorizedSkills?.marketing_sales ?? [],
                                ...prev.categorizedSkills,
                                skill_id_map: newMap,
                              },
                            };
                          });
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
