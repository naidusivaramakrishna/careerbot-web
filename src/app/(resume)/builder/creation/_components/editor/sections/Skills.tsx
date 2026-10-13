"use client";
import React, { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useResume, type CustomCategory } from "../../../_context/ResumeContext";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput, { type TechnologyChipsInputHandle } from "../TechnologyChipsInput";
import { addSkillToCategory, deleteSkillCategory, deleteSkillById, renameSkillCategory } from "@/api/resumeApi";
import { addSkillToEnhancedResume, deleteSkillFromEnhancedResume, deleteSkillCategoryFromEnhancedResume, renameSkillCategoryInEnhancedResume } from "@/api/enhancerApi";
import { toast } from "sonner";
import { findSkillCategory, getSkillsForDomain, skillCategoryApiName, type SkillCategory, type SkillDomain } from "@/config/domainSkills";
import { printedSkillKeysForDomain, templateSkillCategoryLabel } from "@/app/(resume)/templates/skillsFilterByDomain";
import { getSkillsEditorDomain, useAccountEmail } from "@/app/(resume)/templates/_utils/activeTemplateDomain";
import logger from "@/lib/logger";
import { isBuiltInCategoryName, renameCategoryErrorMessage } from "../../../_utils/skillCategoryName";
import { announceSkillAdded } from "../../../_utils/skillAddedEvent";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const Skills: React.FC = () => {
  const { resumeData, setResumeData, resolveSkillRemovedSuggestions, bumpResumeSavedVersion } = useResume();
  const { errors } = useValidation();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const skillsInputRefs = useRef<Record<string, TechnologyChipsInputHandle | null>>({});
  const latestCustomIdRef = useRef<string | null>(null);
  // Name each custom category had when its name box gained focus -- the name the
  // backend knows it by, which the rename call must address.
  const nameOnFocusRef = useRef<Record<string, string>>({});

  // Resolve the domain exactly as PreviewPanel does (applied career-level
  // template), so the editor never offers categories the preview, PDF and DOCX
  // filter out.
  const resumeId = resumeData.resume_id;
  const accountEmail = useAccountEmail();
  const rawDomain = getSkillsEditorDomain(accountEmail);
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
    // Functional update merged onto the LATEST categorizedSkills. Callers must
    // pass ONLY the field(s) they change -- never `{...categorizedSkills, ...}`:
    // that closure snapshot predates the skill_id_map entry onAddSkill just
    // wrote, and its stale skill_id_map would win the merge and break every
    // add-then-delete.
    setResumeData(prev => {
      const merged = { ...prev.categorizedSkills, ...updated } as Record<string, unknown>;
      // Collect skills from every predefined category key -- including other
      // domains' categories kept in state but not displayed -- so the flat list
      // matches what the loader builds.
      const META_KEYS = new Set(['custom_categories', 'hidden_predefined_categories', 'skill_id_map']);
      const allSkills = Object.entries(merged)
        .filter(([key, value]) => !META_KEYS.has(key) && Array.isArray(value) && value.every((v) => typeof v === 'string'))
        .flatMap(([, value]) => value as string[]);
      const customSkills = ((merged.custom_categories || []) as CustomCategory[]).flatMap((c) => c.skills);
      return {
        ...prev,
        categorizedSkills: merged as unknown as typeof prev.categorizedSkills,
        skills: [...allSkills, ...customSkills],
      };
    });
  };

  const handleDeletePredefinedCategory = async (categoryKey: string) => {
    const resumeId = resumeData.resume_id;
    // A template-default category that holds no skills was never saved: there is
    // nothing on the server to delete, and the server rightly rejects a name it
    // does not know. Hiding it locally is the whole delete.
    const localSkills = (resumeData.categorizedSkills as unknown as Record<string, unknown> | undefined)?.[categoryKey];
    const neverSaved = !Array.isArray(localSkills) || localSkills.length === 0;
    if (resumeId && !neverSaved) {
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
      [categoryKey]: [],
      hidden_predefined_categories: [...hiddenPredefined, categoryKey],
    });
    // The delete already landed on the backend above -- bump so the preview
    // panel's server-rendered image (keyed on resumeSavedVersion, not live
    // resumeData; see PreviewPanel.tsx) refetches now instead of staying on
    // its pre-delete snapshot until the next unrelated save or a refresh.
    bumpResumeSavedVersion();
    toast.success("Category deleted successfully.");
  };

  const handleCategorySkillsChange = (categoryKey: string, updatedSkills: string[]) => {
    updateSkills({ [categoryKey]: updatedSkills });
  };

  // ── Custom categories ──
  const handleAddCustomCategory = () => {
    const newEntry: CustomCategory = { id: uid(), name: "", skills: [] };
    latestCustomIdRef.current = newEntry.id;
    updateSkills({
      custom_categories: [...allCustomCategories, newEntry],
    });
  };

  const handleCustomCategoryNameChange = (id: string, name: string) => {
    updateSkills({
      custom_categories: allCustomCategories.map((c) => (c.id === id ? { ...c, name } : c)),
    });
  };

  // Set one custom category's name (and re-key its skill ids, which are keyed by
  // "<category name>:<skill>") on the LATEST state -- safe to call after an await.
  const applyCustomCategoryName = (id: string, name: string, previousName?: string) => {
    setResumeData(prev => {
      const current = (prev.categorizedSkills || {}) as unknown as Record<string, unknown>;
      const customs = ((current.custom_categories || []) as CustomCategory[]).map((c) =>
        c.id === id ? { ...c, name } : c,
      );
      const idMap = { ...((current.skill_id_map || {}) as Record<string, string>) };
      if (previousName && previousName !== name) {
        Object.keys(idMap).forEach((key) => {
          if (key.startsWith(`${previousName}:`)) {
            idMap[`${name}:${key.slice(previousName.length + 1)}`] = idMap[key];
            delete idMap[key];
          }
        });
      }
      return {
        ...prev,
        categorizedSkills: { ...current, custom_categories: customs, skill_id_map: idMap } as unknown as typeof prev.categorizedSkills,
      };
    });
  };

  // A built-in category the API already stores (it refuses to rename those) is
  // locked. Judge by the name the box had when it gained focus, not the text
  // being typed: a draft such as "Framework", on the way to "Frameworks &
  // Libraries", slugifies to a built-in name and would freeze the box mid-word.
  const isLockedBuiltIn = (custom: CustomCategory) =>
    custom.skills.length > 0 && isBuiltInCategoryName(nameOnFocusRef.current[custom.id] ?? custom.name);

  const handleCustomCategoryNameBlur = async (id: string, name: string) => {
    const trimmed = name.trim();
    const savedName = (nameOnFocusRef.current[id] ?? "").trim();
    delete nameOnFocusRef.current[id];
    if (!trimmed) {
      // An emptied name would orphan the saved skills (add/remove need a name).
      if (savedName) applyCustomCategoryName(id, savedName);
      return;
    }
    // For enhanced resumes the predefined categories are hidden, so they are not
    // "existing" from the user's perspective and should not block custom category names.
    // Likewise a predefined category the user deleted is no longer on screen, so
    // its label must be free to use again (the API maps it back to that bucket).
    const predefinedLabels = isEnhancedResume
      ? []
      : EDITOR_CATEGORIES.filter((c) => !hiddenPredefined.includes(c.key)).map((c) => c.label.toLowerCase());
    const otherCustomNames = customCategories
      .filter((c) => c.id !== id)
      .map((c) => c.name.toLowerCase());
    const allExisting = [...predefinedLabels, ...otherCustomNames];
    if (allExisting.includes(trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" category already exists`);
      applyCustomCategoryName(id, savedName);
      nameInputRefs.current[id]?.focus();
      // focus() ran onFocus with this render's refused name; the category is
      // still stored under savedName, which the next rename must address.
      nameOnFocusRef.current[id] = savedName;
      return;
    }

    // Rename on the server only for a category that exists there: it was saved
    // under a name (savedName) and holds at least one skill. A brand-new or empty
    // category has nothing stored, so the new name is simply used from now on.
    const custom = customCategories.find((c) => c.id === id);
    const resumeId = resumeData.resume_id;
    const renamesSavedCategory = Boolean(
      resumeId && savedName && savedName !== trimmed && custom && custom.skills.length > 0,
    );
    // The API routes a built-in name to that built-in bucket and refuses to
    // rename onto it, so say so now instead of after a round trip.
    if (renamesSavedCategory && isBuiltInCategoryName(trimmed)) {
      toast.error(`"${trimmed}" is a built-in category name. Please choose a different name.`);
      applyCustomCategoryName(id, savedName);
      return;
    }
    if (trimmed !== name) applyCustomCategoryName(id, trimmed);
    if (!renamesSavedCategory || !resumeId) return;
    try {
      if (isEnhancedResume) {
        await renameSkillCategoryInEnhancedResume(resumeId, savedName, trimmed);
      } else {
        await renameSkillCategory(resumeId, savedName, trimmed);
      }
      applyCustomCategoryName(id, trimmed, savedName);
      bumpResumeSavedVersion();
      toast.success("Category renamed successfully.");
    } catch (err) {
      applyCustomCategoryName(id, savedName);
      toast.error(renameCategoryErrorMessage(err, trimmed));
    }
  };

  const handleCustomCategorySkillsChange = (id: string, skills: string[]) => {
    updateSkills({
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
      custom_categories: allCustomCategories.filter((c) => c.id !== id),
    });
    bumpResumeSavedVersion();
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
                            // Bump now, not just on the Skills modal's "Save" click: the
                            // add already landed on the backend above, and the preview
                            // panel's server-rendered image only refetches on this signal
                            // (see PreviewPanel.tsx's resumeSavedVersion comment) -- without
                            // it, a newly added skill stayed invisible in the preview until
                            // an unrelated save or a full page refresh.
                            bumpResumeSavedVersion();
                            toast.success("Skill added successfully.");
                            announceSkillAdded(skill, skillCategoryApiName(cat.key));
                          } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : "Failed to add skill. Please try again.";
                            toast.error(errorMsg);
                            throw new Error("api_failed");
                          }
                        } : undefined}
                        onRemoveSkill={resumeData.resume_id ? async (skill) => {
                          const storedSkillId = categorizedSkills.skill_id_map?.[`${cat.key}:${skill}`];
                          // The enhanced delete endpoint (delete_skill_from_enhanced_category)
                          // matches the skill's real backend id only and rejects a plain
                          // name with "Skill with ID '<name>' not found in <category>"
                          // (resumeMappers.ts backfills ids for parser-extracted skills;
                          // this is the safety net for whatever it still misses). The
                          // builder endpoint (delete_skill_from_resume) falls back to a
                          // case-insensitive name match, so a builder skill with no stored
                          // id is still deleted by its name. With no usable identifier,
                          // REJECT, do not return: TechnologyChipsInput.handleRemove drops
                          // the chip only when this promise resolves, so resolving would
                          // hide a skill that is still on the server.
                          const skillIdentifier = storedSkillId ?? (isEnhancedResume ? undefined : skill);
                          if (!skillIdentifier) {
                            toast.error("Could not remove this skill. Please refresh the page and try again.");
                            throw new Error("api_failed");
                          }
                          try {
                            const apiCategory = skillCategoryApiName(cat.key);
                            if (isEnhancedResume) {
                              await deleteSkillFromEnhancedResume(resumeData.resume_id!, apiCategory, skillIdentifier);
                              // The delete endpoint only returns the technical_skills
                              // array, not a rescored ats_display -- resolve any "not
                              // demonstrated" suggestion for this exact skill locally
                              // instead of waiting on a rescore that never happens.
                              resolveSkillRemovedSuggestions(skill, apiCategory);
                            } else {
                              await deleteSkillById(resumeData.resume_id!, apiCategory, skillIdentifier);
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
                            bumpResumeSavedVersion();
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
                      readOnly={isLockedBuiltIn(custom)}
                      title={isLockedBuiltIn(custom) ? "Built-in category — it cannot be renamed" : undefined}
                      onFocus={() => { nameOnFocusRef.current[custom.id] = custom.name; }}
                      onBlur={(e) => { void handleCustomCategoryNameBlur(custom.id, e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          skillsInputRefs.current[custom.id]?.focus();
                        }
                      }}
                      ref={(el) => { nameInputRefs.current[custom.id] = el; }}
                      placeholder="Category name (e.g. Architecture Patterns)"
                      // The skills API accepts category names of at most 50 characters.
                      maxLength={50}
                      className="text-sm font-semibold text-[#3b3b3b] bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-[#2b78bc] outline-none w-full placeholder:text-gray-400 mb-1 pb-0.5 transition-colors"
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
                          // See the predefined-category handler above: the add already
                          // landed on the backend, so bump now instead of waiting on an
                          // unrelated save or a page refresh for the preview to catch up.
                          bumpResumeSavedVersion();
                          toast.success("Skill added successfully.");
                          announceSkillAdded(skill, custom.name);
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Failed to add skill. Please try again.";
                          toast.error(errorMsg);
                          throw new Error("api_failed");
                        }
                      } : undefined}
                      onRemoveSkill={resumeData.resume_id && custom.name ? async (skill) => {
                        const storedSkillId = categorizedSkills.skill_id_map?.[`${custom.name}:${skill}`];
                        // See the predefined-category handler above: builder resumes can
                        // delete by name, enhanced resumes need the real backend id, and
                        // with neither we reject so the chip stays put.
                        const skillIdentifier = storedSkillId ?? (isEnhancedResume ? undefined : skill);
                        if (!skillIdentifier) {
                          toast.error("Could not remove this skill. Please refresh the page and try again.");
                          throw new Error("api_failed");
                        }
                        try {
                          if (isEnhancedResume) {
                            await deleteSkillFromEnhancedResume(resumeData.resume_id!, custom.name, skillIdentifier);
                            resolveSkillRemovedSuggestions(skill, custom.name);
                          } else {
                            await deleteSkillById(resumeData.resume_id!, custom.name, skillIdentifier);
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
                          bumpResumeSavedVersion();
                          toast.success("Skill removed successfully.");
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Failed to remove skill. Please try again.";
                          toast.error(errorMsg);
                          throw new Error("api_failed");
                        }
                      } : undefined}
                    />
                  </div>
                  <div className="mt-6 flex items-center">
                    {!isLockedBuiltIn(custom) && (
                    <button
                      type="button"
                      onClick={() => {
                        const input = nameInputRefs.current[custom.id];
                        input?.focus();
                        input?.select();
                      }}
                      className="p-1.5 text-gray-300 hover:text-[#2b78bc] focus-visible:text-[#2b78bc] transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      title="Rename category"
                      aria-label={`Rename ${custom.name || "category"}`}
                    >
                      <Pencil size={15} />
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomCategory(custom.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 focus-visible:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      title="Remove category"
                      aria-label={`Remove ${custom.name || "category"}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
