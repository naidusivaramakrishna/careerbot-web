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
import { getSkillsForDomain, DOMAIN_SKILLS, type SkillCategory } from "@/config/domainSkills";
import logger from "@/lib/logger";

// Domains that should include general skill categories (programming_languages, frameworks, soft_skills, etc.)
// Only truly technical domains that write code need these categories
const DOMAINS_WITH_GENERAL_CATEGORIES = new Set([
  'software_engineering',
  'cybersecurity',
  'research_scholar',
]);

// General skill categories that exist in all domains
const GENERAL_CATEGORIES = new Set([
  'programming_languages',
  'frameworks',
  'soft_skills',
  'project_management',
  'marketing_sales',
]);

const CATEGORY_KEY_MAP: Record<string, string> = {
  programming_languages: "programmingLanguages",
  frameworks: "frameworks",
  soft_skills: "softSkills",
  project_management: "projectManagement",
  marketing_sales: "marketingSales",
  clinical_skills: "Clinical Skills & Diagnostics",
  healthcare_compliance: "Healthcare Operations & Compliance",
  healthcare_systems: "Disease Management & Pharmacology",
  legal_practice: "Legal Practice Areas",
  legal_research: "Legal Research & Writing",
  legal_compliance: "Legal Compliance & Regulations",
  government_operations: "Government Operations",
  government_compliance: "Government Compliance & Security",
  maritime_operations: "Maritime Operations",
  maritime_regulations: "Maritime Regulations & Compliance",
  maritime_crew_management: "Crew Management",
  penetration_testing: "Penetration Testing & Assessment",
  security_defense: "Defensive Security & Incident Response",
  security_compliance: "Compliance, GRC & Risk Management",
  cloud_security: "Cloud & Infrastructure Security",
  programming_ml: "Programming & Machine Learning",
  research_methodologies: "Research Methodologies & Analysis",
  research_infrastructure: "Research Infrastructure & Tools",
  research_leadership: "Research Leadership & Grant Management",
  // Software Engineering
  frameworks_libraries: "Frameworks & Libraries",
  databases_data_storage: "Databases & Data Storage",
  cloud_devops: "Cloud & DevOps",
  // Finance
  financial_analysis: "Financial Analysis & Modeling",
  accounting_auditing: "Accounting & Auditing",
  risk_compliance: "Risk Management & Compliance",
  // Education
  pedagogical_expertise: "Pedagogical Expertise",
  research_publication: "Research & Publication",
  academic_leadership: "Academic Leadership & Administration",
  // Core Engineering
  design_analysis: "Design & Analysis",
  manufacturing_operations: "Manufacturing & Operations",
  project_management_skills: "Project Management",
  // Government Standard
  governance_administration: "Governance & Administration",
  financial_management: "Financial Management & Budget Administration",
  digital_governance: "Digital Governance & Smart Systems",
  // Electronics & VLSI
  digital_vlsi_design: "Digital & VLSI Design",
  embedded_systems: "Embedded Systems & Firmware",
  analog_design: "Analog & Mixed Signal Design",
  // Logistics & Warehouse Operations
  warehouse_operations: "Warehouse Operations & Management",
  supply_chain_logistics: "Supply Chain & Logistics Management",
  systems_tools: "Systems & Tools",
  // Sales & Business Development
  sales_competencies: "Sales Competencies",
  business_development: "Business Development & Growth",
  tools_platforms: "Tools & Platforms",
  // Customer Support & Account Management
  customer_success: "Customer Success & Experience",
  account_management: "Account & Relationship Management",
  tools_systems: "Tools & Systems",
  // Product & Engineering Leadership
  product_strategy: "Product Strategy & Management",
  engineering_leadership: "Engineering Leadership & Architecture",
  cross_functional: "Cross-Functional Leadership",
  // Marketing & Creative
  marketing_strategy: "Marketing Strategy & Planning",
  creative_design: "Creative & Design",
  marketing_tools: "Marketing Tools & Platforms",
  // Operations & Management
  operations_strategy: "Operations Strategy & Management",
  project_delivery: "Project & Program Management",
  business_analysis: "Business Analysis & Analytics",
  // Human Resources
  talent_management: "Talent Management & Acquisition",
  employee_relations: "Employee Relations & Engagement",
  hr_operations: "HR Operations & Administration",
};

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
  const prevDomainRef = useRef<string | undefined>(undefined);

  // Load domain-specific skill categories based on selected template domain
  // templateDomain is set when template is applied, defaults to 'general'
  const resumeId = resumeData.resume_id;
  const storedDomain = typeof window !== 'undefined' && resumeId ? localStorage.getItem(`templateDomain_${resumeId}`) : null;
  const rawDomain = (storedDomain || resumeData.templateDomain || 'general').toLowerCase();
  const SKILL_CATEGORIES = getSkillsForDomain(rawDomain as any);

  logger.debug('Skills component state:', { resumeId, storedDomain, resumeDataDomain: resumeData.templateDomain, rawDomain });

  // Sync templateDomain from localStorage when it changes
  useEffect(() => {
    if (!resumeId || typeof window === 'undefined') return;

    const storedDomain = localStorage.getItem(`templateDomain_${resumeId}`);
    const currentDomain = (resumeData.templateDomain || '').toLowerCase();
    const storedDomainLower = (storedDomain || '').toLowerCase();

    if (storedDomain && storedDomainLower !== currentDomain) {
      logger.info('Detected domain change in localStorage:', { stored: storedDomainLower, current: currentDomain });
      setResumeData(prev => ({
        ...prev,
        templateDomain: storedDomain,
      }));
    }
  }, [resumeId, resumeData.templateDomain, setResumeData]);

  // Reset skills when domain changes - only depend on rawDomain to avoid cycles
  useEffect(() => {
    if (prevDomainRef.current && prevDomainRef.current !== rawDomain) {
      // Domain has changed, reset categorized skills to only include current domain's categories
      const currentDomainKeys = SKILL_CATEGORIES.map((cat) => cat.key);
      // Filter custom categories to only keep ones from current domain
      const allCustomCategories = resumeData.categorizedSkills?.custom_categories || [];
      const filteredCustomCategories = allCustomCategories.filter((cat) => {
        const catId = (cat.id || '').toLowerCase();
        const isCustomBackendCategory = catId.startsWith('custom_backend_');

        if (isCustomBackendCategory) {
          const originalKey = catId.replace('custom_backend_', '');
          const isFromCurrentDomain = SKILL_CATEGORIES.some((c) => c.key === originalKey);
          logger.info('Filtering custom category:', { catId, originalKey, isFromCurrentDomain, currentDomain: rawDomain });
          return isFromCurrentDomain;
        }
        // Keep user-created custom categories (no custom_backend_ prefix)
        return true;
      });
      logger.info('Domain change - filtered custom categories from', allCustomCategories.length, 'to', filteredCustomCategories.length);

      const newCategorizedSkills: Record<string, string[] | CustomCategory[] | Record<string, string> | undefined> = {
        programming_languages: [],
        frameworks: [],
        soft_skills: [],
        project_management: [],
        marketing_sales: [],
        custom_categories: filteredCustomCategories,
        hidden_predefined_categories: [],
        skill_id_map: {},
      };

      // Initialize all current domain's category skills as empty arrays
      currentDomainKeys.forEach((key) => {
        if (!(key in newCategorizedSkills)) {
          newCategorizedSkills[key] = [];
        }
      });

      setResumeData({
        ...resumeData,
        categorizedSkills: newCategorizedSkills as typeof resumeData.categorizedSkills,
        skills: [],
      });
      toast.info("Skills cleared for new domain. Please add skills relevant to this domain.");
    }
    prevDomainRef.current = rawDomain;
  }, [rawDomain]);

  useEffect(() => {
    const id = latestCustomIdRef.current;
    if (id && nameInputRefs.current[id]) {
      nameInputRefs.current[id]?.focus();
      latestCustomIdRef.current = null;
    }
  });

  // Filter categorizedSkills to only include categories for the current domain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const currentDomainCategoryKeys = SKILL_CATEGORIES.map((cat) => cat.key);
    const allPredefinedKeys = new Set(currentDomainCategoryKeys);

    // Determine if this domain should include general categories
    const includeGeneralCategories = DOMAINS_WITH_GENERAL_CATEGORIES.has(rawDomain);

    // Start with base structure
    const filtered: Record<string, string[] | CustomCategory[] | Record<string, string> | undefined> = {
      custom_categories: allSkills.custom_categories || [],
      hidden_predefined_categories: [],
      skill_id_map: {},
    };

    // Add general categories only if domain supports them
    if (includeGeneralCategories) {
      filtered.programming_languages = [];
      filtered.frameworks = [];
      filtered.soft_skills = [];
      filtered.project_management = [];
      filtered.marketing_sales = [];
    }

    // Initialize all current domain's category skills (empty arrays)
    currentDomainCategoryKeys.forEach((key) => {
      // Only add if it's not a general category, OR if this domain includes general categories
      if (!GENERAL_CATEGORIES.has(key) || includeGeneralCategories) {
        filtered[key] = allSkills[key] || [];
      }
    });

    // Filter skill_id_map to only include skills for current domain categories
    const skillIdMap = allSkills.skill_id_map || {};
    const filteredSkillIdMap: Record<string, string> = {};
    Object.entries(skillIdMap).forEach(([skillKey, skillId]) => {
      const [categoryKey] = skillKey.split(':');
      if (allPredefinedKeys.has(categoryKey)) {
        // Keep skill only if category should be displayed
        if (!GENERAL_CATEGORIES.has(categoryKey) || includeGeneralCategories) {
          filteredSkillIdMap[skillKey] = skillId;
        }
      }
    });
    filtered.skill_id_map = filteredSkillIdMap;

    // DEBUG: Log what we're filtering
    const oldKeys = Object.keys(allSkills).filter(
      (k) => !['custom_categories', 'hidden_predefined_categories', 'skill_id_map', 'programming_languages', 'frameworks', 'soft_skills', 'project_management', 'marketing_sales'].includes(k) && !allPredefinedKeys.has(k)
    );
    if (oldKeys.length > 0) {
      logger.warn('Filtered out old domain categories:', oldKeys, 'Domain:', rawDomain);
    }

    logger.debug('Filtered categorized skills:', { domain: rawDomain, includeGeneralCategories, keys: Object.keys(filtered) });

    return filtered as typeof resumeData.categorizedSkills;
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

  // Get all domain-specific category keys (to identify which categories belong to which domains)
  const allDomainCategoryKeys = new Set<string>();
  Object.values(DOMAIN_SKILLS).forEach((categories) => {
    (categories as SkillCategory[]).forEach((cat) => allDomainCategoryKeys.add(cat.key));
  });

  // Add backend naming variants (e.g., healthcare_it_systems vs healthcare_systems)
  const backendVariants = [
    'healthcare_it_systems', // backend variant of healthcare_systems
  ];
  backendVariants.forEach((key) => allDomainCategoryKeys.add(key));

  // Get current domain's category keys
  const currentDomainCategoryKeys = new Set(SKILL_CATEGORIES.map((cat) => cat.key));

  const allCustomCategories: CustomCategory[] = (categorizedSkills as any).custom_categories || [];

  // Filter out domain-specific custom categories from OTHER domains
  // Keep domain-specific categories from the CURRENT domain and true user-created categories
  const customCategories: CustomCategory[] = allCustomCategories.filter((cat) => {
    const catId = (cat.id || '').toLowerCase();
    const isCustomBackendCategory = catId.startsWith('custom_backend_');

    if (isCustomBackendCategory) {
      // Extract the original key from the ID (e.g., 'custom_backend_clinical_skills' -> 'clinical_skills')
      const originalKey = catId.replace('custom_backend_', '');

      // Check if this key belongs to ANY domain AND if it's in the CURRENT domain
      const isFromAnyDomain = allDomainCategoryKeys.has(originalKey);
      const isFromCurrentDomain = currentDomainCategoryKeys.has(originalKey);

      // Filter out if it's from ANY domain but NOT the current one
      if (isFromAnyDomain && !isFromCurrentDomain) {
        logger.debug('Filtering out OLD domain category:', {
          name: cat.name,
          key: originalKey,
          currentDomain: rawDomain,
          isFromCurrentDomain
        });
        return false; // Filter out
      }

      if (isFromCurrentDomain) {
        logger.debug('Keeping current domain category:', {
          name: cat.name,
          key: originalKey,
          currentDomain: rawDomain
        });
      }
    }
    // User-created custom categories don't have the custom_backend_ prefix, so keep them
    return true;
  });

  const hiddenPredefined: string[] = (categorizedSkills as any).hidden_predefined_categories || [];

  // DEBUG: Log what categories we have
  logger.debug('Skill categories available:', {
    skillCategoriesKeys: SKILL_CATEGORIES.map((c) => c.key),
    categorizedSkillsKeys: Object.keys(categorizedSkills).filter((k) => !['custom_categories', 'hidden_predefined_categories', 'skill_id_map'].includes(k)),
    allCategorizedSkillsInData: Object.keys(resumeData.categorizedSkills || {}),
  });

  // DEBUG: Log custom categories after filtering
  logger.debug('Custom categories after filtering:', {
    total: allCustomCategories.length,
    kept: customCategories.length,
    filtered: allCustomCategories.length - customCategories.length,
    names: customCategories.map((c) => c.name),
  });

  const updateSkills = (updated: Record<string, unknown>) => {
    // Collect all skills from all predefined categories (regardless of domain)
    const allSkills = SKILL_CATEGORIES.reduce((acc, cat) => {
      const categorySkills = (updated)[cat.key] as string[] | undefined;
      return [...acc, ...(categorySkills || [])];
    }, [] as string[]);

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
          await deleteSkillCategoryFromEnhancedResume(resumeId, categoryKey);
        } else {
          await deleteSkillCategory(resumeId, categoryKey);
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
      custom_categories: [...customCategories, newEntry],
    });
  };

  const handleCustomCategoryNameChange = (id: string, name: string) => {
    updateSkills({
      ...categorizedSkills,
      custom_categories: customCategories.map((c) => (c.id === id ? { ...c, name } : c)),
    });
  };

  const handleCustomCategoryNameBlur = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // For enhanced resumes the predefined categories are hidden, so they are not
    // "existing" from the user's perspective and should not block custom category names.
    const predefinedLabels = isEnhancedResume
      ? []
      : SKILL_CATEGORIES.map((c) => c.label.toLowerCase());
    const otherCustomNames = customCategories
      .filter((c) => c.id !== id)
      .map((c) => c.name.toLowerCase());
    const allExisting = [...predefinedLabels, ...otherCustomNames];
    if (allExisting.includes(trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" category already exists`);
      updateSkills({
        ...categorizedSkills,
        custom_categories: customCategories.map((c) => (c.id === id ? { ...c, name: "" } : c)),
      });
      nameInputRefs.current[id]?.focus();
    }
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
          className="flex-1 mt-6 pr-2"
        >
          <div className="flex flex-col gap-6">
            {/* Standard categories — hidden for enhanced resumes */}
            {!isEnhancedResume && (() => {
              const visibleCategories = SKILL_CATEGORIES.filter((cat) => !hiddenPredefined.includes(cat.key));
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
                            const apiCategory = CATEGORY_KEY_MAP[cat.key] ?? cat.key;
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
                            const apiCategory = CATEGORY_KEY_MAP[cat.key] ?? cat.key;
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
