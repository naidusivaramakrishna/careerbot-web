"use client";
import React, { useState, useEffect, useCallback,useRef } from "react";

// Module-level constant — single source of truth for all section → backend key mapping.
// Previously duplicated three times inside the component (component body, triggerAutoSave, handleSaveForm).
const SECTION_KEY_MAP: Record<string, string> = {
  "Personal Info": "personal_info",
  "Professional Summary": "professional_summary",
  "Skills": "skills",
  "Education": "education",
  "Work Experience": "work_experience",
  "Projects": "projects",
  "Certifications": "certifications",
  "Achievements": "achievements",
  "Volunteering": "volunteering",
  "Internships": "internships",
  "Awards": "awards",
  "Hobbies": "hobbies",
  "Interests": "interests",
  "Languages": "languages",
  "Publications": "publications",
  "Patents": "patents",
  "References": "references",
  "Declaration": "declaration",
} as const;

/**
 * Email is account-managed by the API. Personal-info edits must preserve it
 * client-side for the preview, but must never send it as a mutable field.
 */
function omitAccountManagedEmail(
  sectionName: string,
  data: Record<string, unknown> | unknown[]
): Record<string, unknown> | unknown[] {
  if (sectionName !== "Personal Info" || Array.isArray(data)) return data;
  const { email: _accountEmail, ...editableFields } = data;
  return editableFields;
}
import { useSearchParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import SectionItem from "./SectionItem";
import AddNewSection from "./AddNewSection";
import CircularProgress from "./CircularProgress";
import CustomSectionEditor from "./CustomSectionEditor";
import { sectionIcons } from "../../_utils/sectionsConfig";
import { Plus, Sparkles, X, LayoutGrid } from "lucide-react";
import { useResume, CustomSection } from "../../_context/ResumeContext";
import { updateResume, getAllResumes, autoSaveResume } from "@/api/resumeApi";
import { autoSaveEnhancedResume, updateEnhancedResume } from "@/api/enhancerApi";
import { SUGGESTION_SECTION_MAP, getSectionValue, isStructuralSuggestionSatisfied, toSuggestionSectionKey } from "../../_utils/suggestionSection";
import { toast } from "sonner";
import logger from "@/lib/logger";


interface SectionComponentProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}


interface Props {
  sections: { name: string; ai: boolean }[];
  extraSections: { name: string; ai: boolean }[];
  activeSection: number | null;
  formData: Record<string, string>;
  errors: Record<string, string>;
  sectionComponents: Record<string, React.FC<SectionComponentProps>>;
  handleDeleteSection: (index: number) => void;
  handleAddSection: (section: { name: string; ai: boolean }) => void;
  handleChange: (key: string, value: string) => void;
  handleBlur: (key: string, value: string) => void;
  setActiveSection: (index: number | null) => void;
  handleDragEnd: (result: DropResult) => void;
  completionStatus: Record<string, boolean>;
  onSidebarToggle?: (isOpen: boolean) => void;
  clearErrors: (fields?: string[]) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pendingOpenSection?: string | null;
  pendingEditEntryIndex?: number | null;
  onClearPendingSection?: () => void;
}


const EditorTab: React.FC<Props> = ({
  sections,
  extraSections,
  activeSection,
  formData,
  errors,
  sectionComponents,
  handleDeleteSection,
  handleAddSection,
  handleChange,
  handleBlur,
  handleDragEnd,
  completionStatus = {},
  onSidebarToggle,
  clearErrors,
  setErrors,
  pendingOpenSection,
  pendingEditEntryIndex,
  onClearPendingSection,
}) => {
  const nonDeletableSections = [
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
  ];

  const {
    setSectionOrder,
    selectedTemplate,
    setSelectedTemplate,
    setCompletionStatus,
    resumeData,
    setResumeData,
    resumeId: contextResumeId,
    addCustomSection,
    removeCustomSection,
    resumeSource,
    enhancedDataVersion,
    removeEnhancedScoreSection,
    syncEnhancedScore,
    enhancedSuggestions,
    applyManualFix,
    bumpResumeSavedVersion,
  } = useResume();

  const [openModalSection, setOpenModalSection] = useState<string | null>(null);

  // The section-editor modal's Component is keyed on this value (see the
  // `key={`${openModalSection}-${modalMountVersion}`}` below) so it remounts
  // with fresh data every time a *different* section is opened. It must NOT
  // track the live `enhancedDataVersion`, though: that counter also bumps
  // whenever this same section's own debounced auto-save round-trips
  // (autoSaveEnhancedResume -> "enhanced-resume-score-sync" ->
  // syncEnhancedResumeData), which happens seconds after any edit. Keying on
  // the live version made the modal remount mid-edit -- e.g. clicking the
  // pencil icon on a saved Projects entry opens the edit form, the resulting
  // resumeData change arms the autosave debounce, and when it fires the
  // remount reset the section's local "which entry is being edited" state,
  // snapping the just-opened form back to the read-only list. Snapshotting
  // the version only when the modal is opened (or switched to a different
  // section) keeps the "fresh data on open" behavior without remounting
  // while the same section stays open.
  const modalMountVersionRef = useRef(enhancedDataVersion);

  // Tracks the last enhancedDataVersion the autosave-triggering effect below
  // has already accounted for, so a resumeData change caused by a server
  // sync (ResumeProvider's syncEnhancedResumeData, which bumps this version)
  // is never mistaken for a fresh user edit. See that effect for why.
  const lastSyncedEnhancedVersionRef = useRef(enhancedDataVersion);

  // A name only identifies a custom section when it isn't also a reserved standard
  // section name. Standard names are a fixed, unambiguous set (SECTION_KEY_MAP);
  // custom section names are free text and can collide with them for resumes that
  // predate the backend's reserved-name validation. When both exist under the same
  // name, the standard section always wins so the UI never silently misroutes a
  // save/validate/render to the wrong entity.
  const isCustomSectionName = useCallback(
    (name: string | null): boolean => {
      if (!name || SECTION_KEY_MAP[name]) return false;
      return (resumeData.customSections || []).some((cs) => cs.sectionName === name);
    },
    [resumeData.customSections]
  );

  useEffect(() => {
    if (!pendingOpenSection) return;
    setOpenModalSection(pendingOpenSection);
    if (pendingEditEntryIndex !== null && pendingEditEntryIndex !== undefined) {
      const section = pendingOpenSection;
      const idx = pendingEditEntryIndex;
      // Dispatch after the section component mounts inside the modal and registers its listener
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("resume-open-entry", {
          detail: { section, entryIndex: idx },
        }));
      }, 80);
    }
    onClearPendingSection?.();
  }, [pendingOpenSection, pendingEditEntryIndex, onClearPendingSection]);

  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [newCustomSectionName, setNewCustomSectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // A successful item DELETE is already persisted by its dedicated endpoint.
  // Skip the immediately following state-driven autosave so an older full
  // section snapshot cannot race the DELETE and restore that item.
  const skipNextAutoSaveForSectionRef = useRef<string | null>(null);
  // Always-current snapshot of resumeData for memoized callbacks (avoids stale closure)
  const resumeDataRef = useRef(resumeData);
  resumeDataRef.current = resumeData;
  // Keep the debounce callback current without recreating it on unrelated ATS
  // state updates. The saved resume remains the source of truth for each check.
  const enhancedSuggestionsRef = useRef(enhancedSuggestions);
  enhancedSuggestionsRef.current = enhancedSuggestions;
  const applyManualFixRef = useRef(applyManualFix);
  applyManualFixRef.current = applyManualFix;
  const pendingManualSuggestionRef = useRef<{ id: string; initialValue: string } | null>(null);
  useEffect(() => {
    const rememberManualTarget = (event: Event) => {
      const detail = (event as CustomEvent<{ suggestionId?: unknown; ownerSection?: unknown }>).detail;
      const suggestionId = detail?.suggestionId;
      const ownerSection = typeof detail?.ownerSection === "string" ? detail.ownerSection : undefined;
      const suggestion = typeof suggestionId === "string"
        ? enhancedSuggestionsRef.current.find((item) => item.id === suggestionId)
        : undefined;
      pendingManualSuggestionRef.current = suggestion
        ? {
            id: suggestion.id,
            initialValue: getSectionValue(resumeDataRef.current, suggestion.section, suggestion, ownerSection).trim(),
          }
        : null;
    };
    window.addEventListener("careerbot:ats-manual-fix-target", rememberManualTarget);
    return () => window.removeEventListener("careerbot:ats-manual-fix-target", rememberManualTarget);
  }, []);
  // Tracks custom section names whose backend UUID is still pending (blocks modal open)
  const pendingCustomSections = useRef<Set<string>>(new Set());
  const searchParams = useSearchParams();
  // ATS report embeds this editor without a `source=enhanced` URL parameter.
  // The provider is the authoritative source in that case.
  const isEnhancedResume = resumeSource === "enhanced" || searchParams.get("source") === "enhanced";

  // ATS Scan edits an enhanced-resume record. Its ID is different from the
  // normal builder ID held in browser storage, so the provider ID must win.
  const getActiveResumeId = useCallback((): string | null => {
    const candidate = contextResumeId ?? localStorage.getItem("current_resume_id");
    return candidate && candidate !== "null" && candidate !== "undefined" ? candidate : null;
  }, [contextResumeId]);

  useEffect(() => {
    // Skip validation for enhanced resumes — their ID is an enhanced_resume_id,
    // not a builder resume ID, so getAllResumes() won't find it.
    if (isEnhancedResume) return;

    const validateResumeId = async () => {
      const storedId = localStorage.getItem("current_resume_id");

      if (!storedId || storedId === 'null' || storedId === 'undefined') {
        toast.error("Resume ID missing. Redirecting to dashboard...", {
          duration: 3000
        });
        return;
      }

      try {
        const resumes = await getAllResumes();
        const exists = resumes.some(r => r.id === storedId);

        if (!exists) {
          toast.warning("Resume ID mismatch. Using latest resume...");

          if (resumes.length > 0) {
            const newId = resumes[0].id;
            localStorage.setItem("current_resume_id", newId);
            toast.success(`Switched to resume: ${newId.substring(0, 8)}...`);
          } else {
            toast.error("No resumes found. Redirecting...");
          }
        }
      } catch {
        // Failed to validate resume ID
      }
    };

    validateResumeId();
  }, [isEnhancedResume]);


  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    const newOrder = reordered.map((s) => s.name);
    setSectionOrder(newOrder);

    // ✅ Persist manually reordered sections to localStorage
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      localStorage.setItem(sectionOrderKey, JSON.stringify(newOrder));
      logger.info('Saved manually reordered sections to localStorage:', newOrder);
    } catch (err) {
      logger.warn('Error saving section order to localStorage:', err);
    }
  };


  const visibleSections =
    activeSection !== null
      ? sections.filter((_, idx) => idx === activeSection)
      : sections;


  const closeModal = () => {
    setOpenModalSection(null);
  };

  // Snapshot the version only on the transition into a (possibly different)
  // open section, not on every bump while it stays open — see
  // modalMountVersionRef's declaration for why.
  useEffect(() => {
    if (openModalSection) {
      modalMountVersionRef.current = enhancedDataVersion;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModalSection]);


  const handleToggleSection = (sectionName: string) => {
    // Block opening a custom section until its backend UUID has been assigned
    if (pendingCustomSections.current.has(sectionName)) {
      toast.info("Section is still saving — please wait a moment.");
      return;
    }
    if (!selectedTemplate) {
      setSelectedTemplate(1);
      if (onSidebarToggle) {
        onSidebarToggle(false);
      }
    }

    // ✅ Clear errors for the previous section when opening a new one
    if (openModalSection && openModalSection !== sectionName) {
      const previousSectionFields = getSectionFields(openModalSection);
      clearErrors(previousSectionFields);
    }

    setOpenModalSection(
      openModalSection === sectionName ? null : sectionName
    );
  };


  const getSectionFields = (sectionName: string): string[] => {
    const fields: string[] = [];


    Object.keys(formData).forEach((key) => {
      const lowerKey = key.toLowerCase();
      const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");


      if (
        lowerKey.includes(lowerSection) ||
        (sectionName === "Personal Info" &&
          (lowerKey.includes("fullname") ||
            lowerKey.includes("email") ||
            lowerKey.includes("phone") ||
            lowerKey.includes("location") ||
            lowerKey.includes("linkedinUrl")) ||
            lowerKey.includes("portifolioUrl")) ||
        (sectionName === "Professional Summary" &&
          lowerKey.includes("summary")) ||
        (sectionName === "Skills" && lowerKey.includes("skill")) ||
        (sectionName === "Education" && lowerKey.includes("education")) ||
        (sectionName === "Work Experience" &&
          lowerKey.includes("workexperience")) ||
        (sectionName === "Projects" && lowerKey.includes("project")) ||
        (sectionName === "Certifications" &&
          lowerKey.includes("certification")) ||
        (sectionName === "Achievements" &&
          lowerKey.includes("achievement")) ||
        (sectionName === "Volunteering" &&
          lowerKey.includes("volunteering")) ||
        (sectionName === "Internships" &&
          lowerKey.includes("internship")) ||
        (sectionName === "Awards" && lowerKey.includes("award")) ||
        (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
        (sectionName === "Interests" && lowerKey.includes("interest")) ||
        (sectionName === "Languages" && lowerKey.includes("language")) ||
        (sectionName === "Publications" && lowerKey.includes("publication")) ||
        (sectionName === "References" &&
          lowerKey.includes("reference"))
      ) {
        fields.push(key);
      }
    });


    return fields;
  };


  /**
   * A successful editor save is only the first half of a Manual Fix. Confirm
   * each objectively satisfied issue with the backend before changing its UI
   * state; the response then refreshes score, preview, progress and Undo.
   */
  const confirmSavedManualFixes = useCallback(async (sectionName: string, savedResume: typeof resumeData) => {
    if (!isEnhancedResume) return;
    const mappedSections = SUGGESTION_SECTION_MAP[toSuggestionSectionKey(sectionName)] ?? [];
    const candidates = enhancedSuggestionsRef.current.filter((suggestion) =>
      suggestion.status !== "fixed"
      && suggestion.fix_type === "manual"
      && mappedSections.includes(suggestion.section),
    );

    for (const suggestion of candidates) {
      const value = getSectionValue(savedResume, suggestion.section, suggestion, sectionName).trim();
      const manualTarget = pendingManualSuggestionRef.current;
      const wasExplicitlyTargeted = manualTarget?.id === suggestion.id;
      // Semantic findings must be explicitly selected AND changed before any
      // request is sent. Opening an editor or an unrelated autosave can never
      // paint a card green on its own.
      const changedSinceManualTarget = wasExplicitlyTargeted && value !== manualTarget?.initialValue;
      if (!value || (wasExplicitlyTargeted
        ? !changedSinceManualTarget
        : !isStructuralSuggestionSatisfied(savedResume, suggestion))) continue;
      await applyManualFixRef.current(suggestion.id, value);
      if (wasExplicitlyTargeted) pendingManualSuggestionRef.current = null;
    }
  }, [isEnhancedResume]);

  const triggerAutoSave = useCallback(async (sectionName: string) => {
    // Skills uses individual add/delete endpoints on each chip action — no PATCH needed
    if (sectionName === "Skills") return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }


    autoSaveTimerRef.current = setTimeout(async () => {
      const resumeId = getActiveResumeId();

      if (!resumeId || !sectionName || resumeId === 'null' || resumeId === 'undefined') {
        // // console.log("⏸️ Skipping auto-save: No valid resume ID");
        return;
      }

      try {
        setIsAutoSaving(true);
        // // console.log("💾 Auto-saving:", sectionName);

        const live = resumeDataRef.current;
        let sectionData: Record<string, unknown> | unknown[];
        if (sectionName === "Declaration") {
          // Top-level flat fields — must not be nested under a backendKey
          const autoSaveDecl = {
            declaration: live.declaration ?? "",
            declarationDate: live.declarationDate ?? "",
            declarationPlace: live.declarationPlace ?? "",
          };
          const declSaveResponse = await autoSaveResume(resumeId, autoSaveDecl);
          if (declSaveResponse?.warnings?.length) {
            declSaveResponse.warnings.forEach(w => toast.warning(w, { duration: 6000 }));
          }
          setLastSaved(new Date());
          bumpResumeSavedVersion();
          setIsAutoSaving(false);
          return;
        } else if (sectionName === "Professional Summary") {
          const summary = live.professionalSummary?.summary || "";
          const targetRole = live.professionalSummary?.targetRole || "";
          if (!summary && !targetRole) {
            setIsAutoSaving(false);
            return;
          }
          sectionData = { summary, targetRole };
        } else if (sectionName === "Personal Info") {
          sectionData = {
            fullname: live.personalInfo?.fullname || "",
            email: live.personalInfo?.email || "",
            phone: live.personalInfo?.phone
              ? (live.personalInfo.phone.startsWith("+") ? live.personalInfo.phone : `${live.personalInfo.countryCode || "+91"}${live.personalInfo.phone}`)
              : "",
            location: live.personalInfo?.location || "",
            linkedinUrl: live.personalInfo?.linkedinUrl || "",
            githubUrl: live.personalInfo?.githubUrl || "",
            portfolioUrl: live.personalInfo?.portfolioUrl || "",
            dateOfBirth: live.personalInfo?.dateOfBirth || null,
            nationality: live.personalInfo?.nationality || null,
            category: live.personalInfo?.category || null,
            languages: live.personalInfo?.languages || null,
            titlePrefix: live.personalInfo?.titlePrefix || null,
            qualifications: live.personalInfo?.qualifications || null,
            fathersName: live.personalInfo?.fathersName || null,
            gender: live.personalInfo?.gender || null,
            maritalStatus: live.personalInfo?.maritalStatus || null,
            permanentAddress: live.personalInfo?.permanentAddress || null,
            specialisation: live.personalInfo?.specialisation || null,
            medicalRegNo: live.personalInfo?.medicalRegNo || null,
            barEnrollmentNo: live.personalInfo?.barEnrollmentNo || null,
            yearOfEnrollment: live.personalInfo?.yearOfEnrollment || null,
            courtsOfPractise: live.personalInfo?.courtsOfPractise || null,
            rank: live.personalInfo?.rank || null,
            cocNumber: live.personalInfo?.cocNumber || null,
            vesselTypes: live.personalInfo?.vesselTypes || null,
            stcwCertificates: live.personalInfo?.stcwCertificates || null,
            orcidId: live.personalInfo?.orcidId || null,
            hIndex: live.personalInfo?.hIndex || null,
            googleScholarUrl: live.personalInfo?.googleScholarUrl || null,
          };
        } else {
          const sectionMap: Record<string, keyof typeof live> = {
            "Education": "education",
            "Work Experience": "workExperience",
            "Projects": "projects",
            "Certifications": "certifications",
            "Internships": "internships",
            "Achievements": "achievements",
            "Awards": "awards",
            "Volunteering": "volunteering",
            "Publications": "publications",
            "Patents": "patents",
            "References": "references",
            "Hobbies": "hobbies",
            "Interests": "interests",
            "Languages": "languages",
          };
          const key = sectionMap[sectionName];
          const data = key ? live[key] : undefined;
          // Both builder and enhanced: only send items with a backend ID so auto-save
          // never INSERTs new rows. New items are created only on explicit Save
          // (handleSaveForm → updateResume / updateEnhancedResume), which is also what
          // syncs the backend-assigned id back into resumeData for subsequent autosaves.
          //
          // Enhanced used to send the full, unfiltered array here on the assumption
          // that the backend does a full replace on PATCH — it doesn't:
          // autosave_enhanced (service.py) explicitly merges arrays by "id" and
          // appends anything without a matching id as a brand-new entry. Since
          // resumeData items from a fresh parse/enhance never carry the backend id
          // (the id is only assigned server-side, and autosave's 204 response has no
          // body to sync it back from), every autosave cycle re-sent the same
          // id-less items and the backend kept appending duplicates of them.
          sectionData = Array.isArray(data)
            ? (data as Array<Record<string, unknown>>).filter(item => item.id || item._id)
            : [];
        }

        sectionData = omitAccountManagedEmail(sectionName, sectionData);

        // A brand-new item that hasn't been assigned a backend id yet gets filtered
        // out above, so a section with ONLY new items computes to []. Sending that []
        // here is indistinguishable on the backend from "the user cleared this
        // section" -- both ARRAY_MERGE_FIELDS (builder) and autosave_enhanced's
        // `if value == []: merged[key] = []` (enhanced) treat an explicit empty array
        // as an intentional full clear (that rule exists so the LAST item of a
        // section can be deleted at all). Applies to both flows equally — without
        // this guard, autosaving a section that consists of nothing but a
        // just-typed/just-parsed, not-yet-explicitly-saved entry wipes it entirely
        // once the debounce fires, even though nothing was ever explicitly deleted.
        // Deletions already go through their own endpoints
        // (deleteResumeSectionItem/deleteSectionItemFromEnhancedResume), never
        // through autosave, so skipping an empty payload here is always safe.
        if (Array.isArray(sectionData) && sectionData.length === 0) {
          setIsAutoSaving(false);
          return;
        }

        const backendKey = SECTION_KEY_MAP[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");

        if (isEnhancedResume) {
          const snakeToCamelSectionMap: Record<string, string> = {
            personal_info: "personalInfo", professional_summary: "professionalSummary",
            skills: "skills", education: "education", work_experience: "workExperience",
            projects: "projects", certifications: "certifications", achievements: "achievements",
            volunteering: "volunteering", internships: "internships", awards: "awards",
            hobbies: "hobbies", interests: "interests", languages: "languages",
            publications: "publications", patents: "patents", references: "references",
          };
          const camelKey = snakeToCamelSectionMap[backendKey] || backendKey;
          await autoSaveEnhancedResume(resumeId, { [camelKey]: sectionData });
          await confirmSavedManualFixes(sectionName, live);
        } else {
          const updatePayload = { [backendKey]: sectionData };
          const autoSaveResponse = await autoSaveResume(resumeId, updatePayload);

          if (autoSaveResponse?.warnings?.length) {
            autoSaveResponse.warnings.forEach(w => {
              const msg = typeof w === 'string' ? w : (w as Record<string, unknown>)?.message as string || "Saved with warnings";
              toast.warning(msg, { duration: 6000 });
            });
          }

          // Sync backend-assigned IDs back into resumeData. Without this, the next
          // auto-save re-sends the same entry without an id and the backend creates
          // another duplicate row instead of updating the one it just created.
          if (autoSaveResponse && Array.isArray(sectionData)) {
            const camelKeyMap: Record<string, string> = {
              education: "education", work_experience: "workExperience",
              projects: "projects", certifications: "certifications",
              internships: "internships", achievements: "achievements",
              awards: "awards", volunteering: "volunteering",
              publications: "publications", patents: "patents", references: "references",
              hobbies: "hobbies", interests: "interests", languages: "languages",
            };
            const camelKey = camelKeyMap[backendKey];
            const resp = autoSaveResponse as unknown as Record<string, unknown>;
            const backendItems = camelKey ? resp[camelKey] : undefined;
            if (Array.isArray(backendItems)) {
              setResumeData(prev => {
                const currentItems = prev[camelKey as keyof typeof prev];
                if (!Array.isArray(currentItems)) return prev;
                const merged = (currentItems as Array<Record<string, unknown>>).map((item, idx) => {
                  if (item.id || item._id) return item;
                  const bid = (backendItems[idx] as Record<string, unknown>)?.id
                    || (backendItems[idx] as Record<string, unknown>)?._id;
                  return bid ? { ...item, id: bid } : item;
                });
                return { ...prev, [camelKey]: merged };
              });
            }
          }
        }

        setLastSaved(new Date());
        bumpResumeSavedVersion();
        // // console.log("✅ Auto-saved successfully");

      } catch {
        // Auto-save failed silently
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhancedResume, getActiveResumeId, confirmSavedManualFixes]);


  useEffect(() => {
    const cancelStaleSectionAutosave = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: unknown; suppressNext?: unknown }>).detail;
      const section = detail?.section;
      if (typeof section !== "string" || section !== openModalSection) return;
      if (detail?.suppressNext === true) {
        skipNextAutoSaveForSectionRef.current = section;
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
    window.addEventListener("resume-item-deleted", cancelStaleSectionAutosave);
    return () => window.removeEventListener("resume-item-deleted", cancelStaleSectionAutosave);
  }, [openModalSection]);

  useEffect(() => {
    // Multi-entry sections update resumeData instead of formData. A successful
    // item delete has already been persisted by DELETE; do not replay the
    // pre-delete snapshot through its debounced PATCH.
    if (openModalSection) {
      if (skipNextAutoSaveForSectionRef.current === openModalSection) {
        skipNextAutoSaveForSectionRef.current = null;
        return;
      }
      // Defense in depth alongside the {origin:"autosave"} tag in
      // enhancerApi.ts/ResumeContext.tsx (which stops autosave's OWN
      // response from re-triggering this effect): enhancedDataVersion bumps
      // whenever ResumeProvider replaces resumeData from ANY server sync
      // (explicit Save, apply/delete fix, undo) -- see syncEnhancedResumeData.
      // If that's what changed resumeData this render, it is not a fresh
      // user edit, and re-arming autosave for it would both send a needless
      // PATCH and risk the same effect-loop for those paths while a section
      // modal happens to be open.
      if (lastSyncedEnhancedVersionRef.current !== enhancedDataVersion) {
        lastSyncedEnhancedVersionRef.current = enhancedDataVersion;
        return;
      }
      triggerAutoSave(openModalSection);
    }
  }, [formData, resumeData, openModalSection, triggerAutoSave, enhancedDataVersion]);


  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);


  const isRequiredField = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    const optionalFields = [
      // Personal Info
      "linkedin url",
      "portfolio url",

      // General
      "currentlyworking",
      "startdate",
      "enddate",
      "date",
      "year",
      "location",

      // Work/Internship/Projects
      "link",
      "technologies",
      "description",

      // Education
      "scoretype",
      "scorevalue",

      // Certifications
      "issuedby",
      "expirydate",
      "credentialid",

      // Hobbies/Interests/Achievements
      "achievement",
      "category",
      "proficiencylevel",

      // Languages (proficiency is REQUIRED, not optional)

      // Publications
      "authors",
      "url",

      // References
      "relation",
      "contact",

      // Volunteering
      "role",
    ];
    return !optionalFields.some((optional) => lowerKey.includes(optional));
  };


  // ✅ FIXED: Validate and return new errors, don't rely on stale state
  const validateSectionFields = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!openModalSection) return { isValid: true, newErrors: {} };

    // Custom sections have no required fields — skip validation
    if (isCustomSectionName(openModalSection)) return { isValid: true, newErrors: {} };

    // Languages validates via resume-validate-section DOM event, not formData
    if (openModalSection === "Languages") return { isValid: true, newErrors: {} };

    // ProfessionalSummary writes directly to resumeData context, not formData
    if (openModalSection === "Professional Summary") {
      const summary = resumeData.professionalSummary?.summary?.trim() || "";
      const newErrors: Record<string, string> = {};
      if (!summary) newErrors["summary"] = "This field is required";
      return { isValid: !!summary, newErrors };
    }

    // Skills writes directly to resumeData.skills (a categorized object) via its own
    // picker UI, never through formData — sectionRequiredFields["Skills"] = ["skills"]
    // has no corresponding formData["skills"] input to check, so the generic
    // formData-based loop below always found it "empty" and blocked saving even after
    // skills were actually added. Skills has its own dedicated save path further down
    // in handleSaveForm, so just skip the formData check here.
    if (openModalSection === "Skills") {
      return { isValid: true, newErrors: {} };
    }

    const sectionFields = getSectionFields(openModalSection);
    const newErrors: Record<string, string> = {};
    let hasEmptyRequiredFields = false;


    sectionFields.forEach((key) => {
      const value = formData[key] || "";
      const isRequired = isRequiredField(key);
      if (isRequired) {
        if (!value || value.trim() === "") {
          newErrors[key] = "This field is required";
          hasEmptyRequiredFields = true;
        }
      }
    });


    return {
      isValid: !hasEmptyRequiredFields,
      newErrors
    };
  };


  const transformFormDataToBackend = (sectionName: string) => {
    // // console.log("🔄 Transforming section:", sectionName);

    // ✅ FIXED: Multi-entry sections read from resumeData context, not formData
    // These sections manage their own component state and only update context
    if (["Education", "Work Experience", "Projects", "Certifications", "Internships", "Achievements", "Awards", "Volunteering", "Publications", "Patents", "References", "Hobbies", "Interests", "Languages"].includes(sectionName)) {
      const contextKey = sectionName
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[àá]/, "a");

      const sectionMap: Record<string, keyof typeof resumeData> = {
        "education": "education",
        "work_experience": "workExperience",
        "projects": "projects",
        "certifications": "certifications",
        "internships": "internships",
        "achievements": "achievements",
        "awards": "awards",
        "volunteering": "volunteering",
        "publications": "publications",
        "patents": "patents",
        "references": "references",
        "hobbies": "hobbies",
        "interests": "interests",
        "languages": "languages",
      };

      const key = sectionMap[contextKey] || (sectionName.toLowerCase().replace(/ /g, "_") as keyof typeof resumeData);
      const data = resumeData?.[key];
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }

    if (sectionName === "Declaration") {
      return {
        declaration: resumeData.declaration ?? "",
        declarationDate: resumeData.declarationDate ?? "",
        declarationPlace: resumeData.declarationPlace ?? "",
      };
    }

    if (sectionName === "Professional Summary") {
      return {
        summary: resumeData.professionalSummary?.summary || "",
        targetRole: resumeData.professionalSummary?.targetRole || "",
      };
    }

    if (sectionName === "Skills") {
      // Backend expects CategorizedSkills with {name} objects per category
      const cats = resumeData.categorizedSkills;
      if (cats) {
        const toNameObjs = (arr: string[]) => (arr || []).map(s => ({ name: s }));
        const anyCats = cats as Record<string, string[]>;
        return {
          programming_languages: toNameObjs(anyCats.programming_languages),
          frameworks: toNameObjs(anyCats.frameworks),
          soft_skills: toNameObjs(anyCats.soft_skills),
          project_management: toNameObjs(anyCats.project_management),
          marketing_sales: toNameObjs(anyCats.marketing_sales),
        };
      }
      return {};
    }

    if (sectionName === "Personal Info") {
      const countryCode = formData["countryCode"] || "+91";
      const rawPhone = formData["phone"] || "";
      // Combine countryCode + phone for backend (expects phone starting with +)
      const phone = rawPhone ? (rawPhone.startsWith("+") ? rawPhone : `${countryCode}${rawPhone}`) : "";
      return {
        fullname: formData["fullname"] || "",
        email: formData["email"] || "",
        phone,
        location: formData["location"] || "",
        linkedinUrl: formData["linkedinUrl"] || "",
        githubUrl: formData["githubUrl"] || "",
        portfolioUrl: formData["portfolioUrl"] || "",
        // Common optional fields
        dateOfBirth: formData["dateOfBirth"] || null,
        nationality: formData["nationality"] || null,
        category: formData["category"] || null,
        languages: formData["languages"] || null,
        titlePrefix: formData["titlePrefix"] || null,
        qualifications: formData["qualifications"] || null,
        // Government Standard
        fathersName: formData["fathersName"] || null,
        gender: formData["gender"] || null,
        maritalStatus: formData["maritalStatus"] || null,
        permanentAddress: formData["permanentAddress"] || null,
        // Healthcare
        specialisation: formData["specialisation"] || null,
        medicalRegNo: formData["medicalRegNo"] || null,
        // Legal
        barEnrollmentNo: formData["barEnrollmentNo"] || null,
        yearOfEnrollment: formData["yearOfEnrollment"] || null,
        courtsOfPractise: formData["courtsOfPractise"] || null,
        // Marine
        rank: formData["rank"] || null,
        cocNumber: formData["cocNumber"] || null,
        vesselTypes: formData["vesselTypes"] || null,
        stcwCertificates: formData["stcwCertificates"] || null,
        // Research Scholar
        orcidId: formData["orcidId"] || null,
        hIndex: formData["hIndex"] || null,
        googleScholarUrl: formData["googleScholarUrl"] || null,
      };
    }

    return {};
  };
  const handleSaveForm = async () => {
  if (!openModalSection) return;

  try {
    setIsSaving(true);

    // ✅ Step 1: Always clear previous validation errors before revalidating
    const sectionFields = getSectionFields(openModalSection);
    clearErrors(sectionFields);

    // ✅ Step 2a: For multi-entry sections, trigger component-level validation via DOM event.
    // The section component (WorkExperience, Education, etc.) runs validateRequired on all
    // editing entries synchronously and sets resultRef.valid = false if any required field is empty.
    const sectionValidationResult = { valid: true };
    window.dispatchEvent(
      new CustomEvent("resume-validate-section", {
        detail: { section: openModalSection, resultRef: sectionValidationResult },
      })
    );

    // ✅ Step 2b: Validate formData-based fields (Personal Info, Professional Summary)
    const { isValid, newErrors } = validateSectionFields();

    if (!isValid || !sectionValidationResult.valid) {
      // show errors and stop save
      Object.entries(newErrors).forEach(([key]) => {
        handleBlur(key, formData[key] || "");
      });
      toast.error("Please fill in all required fields");
      setIsSaving(false);
      return;
    }

    // ✅ Step 3: Fetch resumeId safely (with fallback)
    let resumeId = getActiveResumeId();
    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      if (isEnhancedResume) {
        toast.error("Enhanced resume ID is missing. Please refresh and try again.");
        setIsSaving(false);
        return;
      }
      // // console.warn("⚠️ No valid resume ID found, refetching...");
      const resumes = await getAllResumes();
      if (resumes.length > 0) {
        resumeId = resumes[0].id;
        localStorage.setItem("current_resume_id", resumeId);
        toast.info(`Using existing resume ${resumeId.substring(0, 8)}...`);
      } else {
        toast.error("No resumes found. Please create one before saving.");
        setIsSaving(false);
        return;
      }
    }

    // ✅ Step 4a: Skills are managed via individual skill endpoints — skip PATCH
    if (openModalSection === "Skills") {
      toast.success("Skills saved successfully!");
      closeModal();
      setIsSaving(false);
      return;
    }

    // ✅ Step 4: For custom sections, save customSections array directly
    const isCustomSection = isCustomSectionName(openModalSection);

    let updatePayload: Record<string, unknown>;

    if (isCustomSection) {
      // resumeDataRef.current, not resumeData directly: a custom section
      // created just before this Save click goes through its own async
      // create-then-swap-id flow (handleCreateCustomSection), and the
      // "New field name" -> "+ Add Field" interactions happen in between.
      // If any of those state updates landed after this render's resumeData
      // closure was captured but before the click handler ran, `resumeData.
      // customSections` here is stale -- sending it as the FULL replacement
      // array silently wipes out the section that was just created (it was
      // never in this stale snapshot to begin with), even though local UI
      // state shows it correctly. resumeDataRef.current is kept live on
      // every render (see the ref assignment above) specifically to avoid
      // this class of bug -- it's already used this same way elsewhere in
      // this file (triggerAutoSave); this save path was the one place still
      // reading the closure directly.
      updatePayload = { customSections: resumeDataRef.current.customSections };
    } else if (openModalSection === "Declaration") {
      // declaration, declarationDate, declarationPlace are all top-level fields — don't nest under a key
      updatePayload = transformFormDataToBackend(openModalSection) as Record<string, unknown>;
    } else {
      const sectionData = omitAccountManagedEmail(
        openModalSection,
        transformFormDataToBackend(openModalSection) as Record<string, unknown> | unknown[]
      );

      const backendKey =
        SECTION_KEY_MAP[openModalSection] ||
        openModalSection.toLowerCase().replace(/\s+/g, "_");

      updatePayload = { [backendKey]: sectionData };
    }

    // // console.log("📤 Sending payload:", updatePayload);

    // ✅ Step 5: Call update API safely (route to enhanced endpoint if needed)
    let saveResponse;
    if (isEnhancedResume) {
      const snakeToCamelMap: Record<string, string> = {
        personal_info: "personalInfo", professional_summary: "professionalSummary",
        skills: "skills", education: "education", work_experience: "workExperience",
        projects: "projects", certifications: "certifications", achievements: "achievements",
        volunteering: "volunteering", internships: "internships", awards: "awards",
        hobbies: "hobbies", interests: "interests", languages: "languages",
        publications: "publications", patents: "patents", references: "references",
      };
      const camelPayload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updatePayload)) {
        camelPayload[snakeToCamelMap[k] || k] = v;
      }
      saveResponse = await updateEnhancedResume(resumeId, { enhanced_sections: camelPayload });
    } else {
      saveResponse = await updateResume(resumeId, updatePayload);
    }

    // ✅ Step 5b: Sync backend-assigned IDs back into context (builder + enhanced)
    const sectionToRespKey: Record<string, string> = {
      "Education": "education",
      "Work Experience": "workExperience",
      "Projects": "projects",
      "Certifications": "certifications",
      "Internships": "internships",
      "Achievements": "achievements",
      "Awards": "awards",
      "Volunteering": "volunteering",
      "Publications": "publications",
      "Patents": "patents",
      "References": "references",
      "Hobbies": "hobbies",
      "Interests": "interests",
      "Languages": "languages",
    };
    if (saveResponse && openModalSection) {
      const resp = saveResponse as unknown as Record<string, unknown>;
      // Enhanced response may nest section data under enhanced_resume
      const respSource = isEnhancedResume
        ? ((resp?.enhanced_resume as Record<string, unknown>) ?? resp)
        : resp;
      const enhancedData = isEnhancedResume && respSource?.enhanced_data && typeof respSource.enhanced_data === "object"
        ? respSource.enhanced_data as Record<string, unknown>
        : respSource;
      // A save can return ats_display/suggestions inside enhancer_state rather
      // than a top-level ats_score. Pass the complete response through the
      // normalizer so score, progress bars, and cards stay one snapshot.
      if (isEnhancedResume) {
        // The response is the only safe source for the freshly scored section.
        // Tell the synchronizer which editor was saved so a deduction that is
        // genuinely absent from its canonical breakdown remains visible as a
        // green fixed card instead of vanishing from the ATS rail.
        syncEnhancedScore(saveResponse, {
          resolvedSuggestionSections: [toSuggestionSectionKey(openModalSection)],
        });
      }
      const respKey = sectionToRespKey[openModalSection];
      if (respKey && Array.isArray(enhancedData[respKey])) {
        const backendItems = enhancedData[respKey] as Array<{ id?: string; _id?: string }>;
        setResumeData(prev => {
          const currentItems = prev[respKey as keyof typeof prev];
          if (!Array.isArray(currentItems)) return prev;
          const merged = (currentItems as Array<Record<string, unknown>>).map((item, idx) => {
            const backendId = backendItems[idx]?.id || backendItems[idx]?._id;
            return backendId ? { ...item, id: backendId } : item;
          });
          return { ...prev, [respKey]: merged };
        });
      }
      // Sync customSections for both builder and enhanced
      const rawEnhanced = resp?.enhanced_resume as Record<string, unknown> | undefined;
      const syncedCustomSections = (resp?.customSections ?? rawEnhanced?.customSections) as typeof resumeData.customSections | undefined;
      if (isCustomSection && syncedCustomSections && syncedCustomSections.length > 0) {
        setResumeData(prev => ({ ...prev, customSections: syncedCustomSections }));
      }
    }

    // A section removed from the sidebar is also removed from sectionOrder.
    // Saving data into that section again must restore it to the render order;
    // otherwise the API contains the item but every preview template hides it.
    if (isEnhancedResume && openModalSection) {
      setSectionOrder(previous => {
        const alreadyPresent = previous.includes(openModalSection);
        const restored = alreadyPresent ? previous : [...previous, openModalSection];
        try {
          const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
          const key = userEmail ? `sectionOrder_${userEmail}` : "sectionOrder";
          localStorage.setItem(key, JSON.stringify(restored));
        } catch { /* storage is optional */ }
        return alreadyPresent ? previous : restored;
      });
    }

    // Score updates now happen purely server-side: the Save call above
    // (bulk_update_enhanced) triggers a real AI rescore, so there is no
    // separate client-side "guess which suggestions are now satisfied and
    // call /enhance/apply" step here anymore.

    // ✅ Step 6: Mark section complete + clear all validation
    // For custom sections: only mark green when all fields have values
    const isComplete = isCustomSection
      ? (() => {
          const cs = (resumeData.customSections || []).find(c => c.sectionName === openModalSection);
          return !!(cs && cs.fields.length > 0 && cs.fields.every(field => {
            if (field.fieldType === 'list') return (field.value as string[]).some(v => v.trim() !== '');
            return String(field.value).trim() !== '';
          }));
        })()
      : true;
    setCompletionStatus((prev) => ({
      ...prev,
      [openModalSection]: isComplete,
    }));

    clearErrors(sectionFields); // remove local validation
    toast.success(`${openModalSection} saved successfully!`);
    bumpResumeSavedVersion();
    closeModal();
  } catch (error) {
    const axiosError = error as { response?: { data?: { error?: { message?: string; details?: { validation_errors?: Array<{ field: string; message: string }> } } } } };
    const validationErrors = axiosError?.response?.data?.error?.details?.validation_errors;

    if (validationErrors && validationErrors.length > 0) {
      // Set inline field errors and show exact messages from the API
      const fieldErrors: Record<string, string> = {};
      validationErrors.forEach(ve => {
        // field format: "personalInfo → phone" → extract key after "→ "
        const fieldKey = ve.field.includes("→") ? ve.field.split("→").pop()?.trim() ?? ve.field : ve.field;
        fieldErrors[fieldKey] = ve.message;
        toast.error(ve.message, { duration: 6000 });
      });
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    } else if (axiosError?.response?.data?.error?.message) {
      toast.error(axiosError.response.data.error.message);
    } else if (error instanceof Error) {
      toast.error(error.message || "Failed to save section.");
    } else {
      toast.error("Unexpected error occurred while saving.");
    }
  } finally {
    setIsSaving(false);
  }
};



  // Custom section add/delete must save through the SAME resume the modal
  // is actually editing. Both callers below used to always call the builder's
  // updateResume(resumeId, ...) -- PATCH /resumes/{id} -- even when editing
  // an enhanced resume, whose data lives in a completely different
  // collection under a different id. The add/delete appeared to work (the
  // optimistic local state updated immediately) but never reached the
  // enhanced resume's stored document, so it was silently lost on reload.
  const persistCustomSections = async (
    resumeId: string,
    updatedSections: typeof resumeData.customSections,
  ): Promise<typeof resumeData.customSections | undefined> => {
    if (isEnhancedResume) {
      const response = await updateEnhancedResume(resumeId, {
        enhanced_sections: { customSections: updatedSections },
      });
      const resp = response as unknown as Record<string, unknown>;
      const rawEnhanced = resp?.enhanced_resume as Record<string, unknown> | undefined;
      return (resp?.customSections ?? rawEnhanced?.customSections) as
        | typeof resumeData.customSections
        | undefined;
    }
    const response = await updateResume(resumeId, { customSections: updatedSections } as Parameters<typeof updateResume>[1]);
    return response.customSections;
  };

  const handleCreateCustomSection = (name: string) => {
    // `sections` is only the local sidebar display-order state -- it never
    // learns about a custom section that was created any other way than
    // through this exact button (e.g. directly via the API/Swagger, or a
    // section synced from the backend but not yet reflected in
    // sectionOrder). Checking resumeData.customSections too closes that
    // gap: it's the actual source of truth for which custom sections exist,
    // so a name collision is caught regardless of how the existing one got
    // there. Without this, "Strengths" already existing server-side didn't
    // stop a second, differently-id'd "Strengths" from being created here --
    // two real sections with the same name, both rendered in the preview.
    const liveCustomSections = resumeDataRef.current.customSections || [];
    const alreadyExists =
      sections.some((s) => s.name.toLowerCase() === name.toLowerCase()) ||
      liveCustomSections.some(
        (cs) => cs.sectionName.toLowerCase() === name.toLowerCase()
      );
    if (alreadyExists) {
      toast.error(`"${name}" section already exists`);
      return;
    }
    const newSection: CustomSection = {
      id: `custom_${typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`,
      sectionName: name,
      fields: [],
    };
    // `addCustomSection` schedules a React state update. Update this ref now
    // as well, so a second create event in the same render cycle uses the
    // first section in its full-snapshot request instead of replacing it.
    const updatedSections = [...liveCustomSections, newSection];
    resumeDataRef.current = { ...resumeDataRef.current, customSections: updatedSections };
    addCustomSection(newSection);
    handleAddSection({ name, ai: false });
    // Add to sectionOrder so templates render it
    setSectionOrder(prev => [...prev, name]);
    // Block the section modal until the backend UUID is assigned
    pendingCustomSections.current.add(name);
    // Persist to backend (fire-and-forget)
    const resumeId = getActiveResumeId();
    if (resumeId && resumeId !== "null" && resumeId !== "undefined") {
      // resumeDataRef.current, not resumeData: same stale-closure risk as
      // the save/delete/render paths -- sending a stale customSections list
      // as the full replacement here would silently drop any other very
      // recent custom-section change along with this create.
      persistCustomSections(resumeId, updatedSections)
        .then(syncedCustomSections => {
          // Sync real backend UUIDs into context so subsequent saves UPDATE instead of INSERT
          if (syncedCustomSections && syncedCustomSections.length > 0) {
            resumeDataRef.current = { ...resumeDataRef.current, customSections: syncedCustomSections };
            setResumeData(prev => ({ ...prev, customSections: syncedCustomSections }));
          }
        })
        .catch(() => {
          // Roll back the optimistic local state applied above (
          // addCustomSection, sectionOrder). Without this, a failed create
          // left a permanent ghost: sectionOrder is persisted to
          // localStorage, so the section kept reappearing as a sidebar tile
          // on every future page load even though the backend never had it
          // -- clicking it opened a modal with the right title (just an
          // echo of the name) but a genuinely blank body, since
          // resumeData.customSections (fetched fresh from the backend) had
          // no matching entry. `sections` itself isn't touched directly
          // here -- it's a controlled prop synced from sectionOrder by the
          // parent (ResumeSide), so removing the name from sectionOrder
          // reconciles the sidebar tile away on its own.
          resumeDataRef.current = {
            ...resumeDataRef.current,
            customSections: (resumeDataRef.current.customSections || []).filter(
              section => section.id !== newSection.id,
            ),
          };
          removeCustomSection(newSection.id);
          setSectionOrder(prev => prev.filter(n => n !== name));
          toast.error(`Failed to save "${name}" to the server. Please try creating it again.`);
        })
        .finally(() => {
          pendingCustomSections.current.delete(name);
        });
    } else {
      pendingCustomSections.current.delete(name);
    }
    toast.success(`"${name}" created and added to sections`);
    setNewCustomSectionName("");
    setIsAddingCustomSection(false);
  };

  // sections[] is the live main list — count grows when user adds a section, shrinks when they delete one
  const totalSections = sections.length;
  const completedCount = sections.filter((s) => completionStatus[s.name]).length;
  const completionPercentage = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;


  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
            Resume Sections
          </h3>
          <p className="text-xs text-gray-800">
            Complete each section to build a perfect resume
          </p>
        </div>
        <div className="relative">
          <CircularProgress percentage={completionPercentage} totalSections={totalSections} completedCount={completedCount} size={54} strokeWidth={4} />
        </div>
      </div>


      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-2 p-1 rounded-xl"
            >
              {visibleSections.map((s, idx) => {
                const originalIndex =
                  activeSection !== null ? activeSection : idx;
                const Icon = sectionIcons[s.name] || LayoutGrid;
                const id = `${s.name}-${originalIndex}`;


                return (
                  <Draggable
                    key={id}
                    draggableId={id}
                    index={originalIndex}
                    isDragDisabled={activeSection !== null}
                  >
                    {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`transition-transform duration-200 ease-in-out ${
                          snap.isDragging ? "scale-[1.01]" : "scale-100"
                        }`}
                      >
                        <SectionItem
                          title={s.name}
                          icon={<Icon size={16} />}
                          ai={s.ai}
                          dragHandleProps={p.dragHandleProps}
                          isDragging={snap.isDragging}
                          isActive={openModalSection === s.name}
                          onToggle={() => handleToggleSection(s.name)}
                          onDelete={() => handleDeleteSection(originalIndex)}
                          onDeleteAsync={(() => {
                            // Enhanced resumes do not use the builder section-delete
                            // route. Clear the section through the enhanced PATCH API,
                            // then update the sidebar only after persistence succeeds.
                            if (isEnhancedResume && SECTION_KEY_MAP[s.name]) {
                              return async () => {
                                const rid = getActiveResumeId();
                                if (!rid || rid === "null" || rid === "undefined") {
                                  throw new Error("Enhanced resume ID is missing");
                                }
                                const enhancedSectionKeyMap: Record<string, string> = {
                                  work_experience: "workExperience",
                                  professional_summary: "professionalSummary",
                                  personal_info: "personalInfo",
                                };
                                const backendKey = SECTION_KEY_MAP[s.name];
                                const enhancedKey = enhancedSectionKeyMap[backendKey] || backendKey;
                                const deleteResponse = await updateEnhancedResume(rid, {
                                  enhanced_sections: { [enhancedKey]: [] },
                                });
                                // Prefer the server recalculation. The local projection is
                                // retained only for older API deployments that return no
                                // score snapshot at all.
                                const responseRecord = deleteResponse as unknown as Record<string, unknown>;
                                const containsScore = [
                                  responseRecord.ats_display,
                                  responseRecord.ats_breakdown,
                                  responseRecord.ats_score,
                                  (responseRecord.enhancer_state as Record<string, unknown> | undefined)?.ats_display,
                                  (responseRecord.enhancer_state as Record<string, unknown> | undefined)?.ats_breakdown,
                                ].some(Boolean);
                                if (containsScore) syncEnhancedScore(deleteResponse);
                                else removeEnhancedScoreSection(s.name);
                                handleDeleteSection(originalIndex);
                              };
                            }

                            // resumeDataRef.current, not resumeData/
                            // isCustomSectionName's own (also resumeData-based)
                            // check: a section created moments before this
                            // render settles can be missing from this render's
                            // resumeData snapshot, making this lookup a false
                            // miss. That silently returns undefined here, which
                            // falls SectionItem back to its generic
                            // deleteResumeSection(sectionKey) path -- built for
                            // fixed sections (SECTION_POLICIES), not custom
                            // ones -- and 400s with "Unknown section", surfaced
                            // as this exact "Failed to delete section" alert.
                            const liveCustomSections = resumeDataRef.current.customSections || [];
                            const customSection = !SECTION_KEY_MAP[s.name]
                              ? liveCustomSections.find(cs => cs.sectionName === s.name)
                              : undefined;
                            if (!customSection) return undefined;
                            return async () => {
                              const rid = getActiveResumeId();
                              // Filter by NAME, not just this one match's id. The
                              // sidebar only ever shows ONE tile per distinct
                              // name (sectionOrder is a flat list of names, with
                              // no way to represent "two sections called
                              // Strengths" as two entries) -- so if a second
                              // customSections entry with the same name exists
                              // (e.g. created directly via the API, bypassing
                              // sectionOrder entirely, as happened during
                              // testing), it's invisible in the sidebar but
                              // still renders in the preview/export, which reads
                              // customSections directly. Filtering by id alone
                              // left that second entry as an unreachable ghost
                              // the user could never delete through this UI --
                              // clicking the one visible "delete" always has to
                              // mean "remove every section under this name".
                              //
                              // resumeDataRef.current, not resumeData directly --
                              // same stale-closure risk as handleSaveForm's
                              // custom-section branch (see the comment there):
                              // a section created or edited just before this
                              // delete click can still be missing from this
                              // render's resumeData snapshot, so filtering that
                              // stale array and sending it as the full
                              // replacement would silently wipe out unrelated,
                              // very recent changes along with the deletion.
                              const filtered = (resumeDataRef.current.customSections || []).filter(
                                cs => cs.sectionName !== s.name
                              );
                              removeCustomSection(customSection.id);
                              setSectionOrder(prev => prev.filter(n => n !== s.name));
                              handleDeleteSection(originalIndex);
                              if (rid && rid !== "null" && rid !== "undefined") {
                                await persistCustomSections(rid, filtered);
                              }
                            };
                          })()}
                          disableDelete={nonDeletableSections.includes(s.name)}
                          isComplete={completionStatus[s.name] || false}
                          resumeId={getActiveResumeId() ?? undefined}
                          sectionKey={SECTION_KEY_MAP[s.name] || s.name.toLowerCase().replace(/\s+/g, "_")}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>


      <AddNewSection />


      {extraSections.length > 0 && (
        <div className="mt-3 space-y-2 max-h-screen">
          {extraSections.map((s, i) => {
            const Icon = sectionIcons[s.name] || (() => <span>★</span>);
            return (
              <button
                key={i}
                onClick={() => handleAddSection(s)}
                className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
                    <Icon size={16} />
                  </div>
                  <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                    {s.name}
                  </p>
                </div>


                <div className="flex items-center gap-2">
                  {s.ai && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
                      <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
                    </span>
                  )}
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200
                              bg-gradient-to-br from-white-50 to-white-500 text-gray-600
                              group-hover:from-blue-500 group-hover:to-blue-700
                              group-hover:text-white group-hover:scale-110"
                  >
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}


      {/* ── Custom Sections Area ── */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Custom Sections</span>
          </div>
          {!isAddingCustomSection && (
            <button
              onClick={() => setIsAddingCustomSection(true)}
              className="flex items-center gap-1 text-xs text-[#2557a7] hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>


        {/* Inline input to add a new custom section */}
        {isAddingCustomSection && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
              placeholder="Section name (e.g., Patents, Awards)"
              value={newCustomSectionName}
              onChange={(e) => setNewCustomSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCustomSectionName.trim()) {
                  handleCreateCustomSection(newCustomSectionName.trim());
                } else if (e.key === "Escape") {
                  setNewCustomSectionName("");
                  setIsAddingCustomSection(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (newCustomSectionName.trim()) {
                  handleCreateCustomSection(newCustomSectionName.trim());
                }
              }}
              className="px-3 py-2 bg-[#2557a7] text-white text-sm rounded-lg hover:bg-[#1f4e98] transition"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewCustomSectionName("");
                setIsAddingCustomSection(false);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {openModalSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
              disabled={isSaving}
            >
              <X size={20} />
            </button>


            <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
              {openModalSection}
            </h2>


            <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
              {(() => {
                // Render CustomSectionEditor only if it's a custom section (never for a
                // reserved standard name).
                //
                // resumeDataRef.current, not resumeData: a section created
                // moments before this modal opened can still be missing from
                // this render's resumeData snapshot (same stale-closure class
                // as the save/delete paths above). A false miss here doesn't
                // error -- it silently falls through past `if (!Component)
                // return null`, since a custom section name was never
                // registered in sectionComponents either, rendering a
                // completely blank modal body (no fields, no "+ Add Field"
                // row, just Save/Cancel) instead of the actual editor.
                const customSection = !SECTION_KEY_MAP[openModalSection ?? ""]
                  ? (resumeDataRef.current.customSections || []).find(
                      (cs) => cs.sectionName === openModalSection
                    )
                  : undefined;
                if (customSection) {
                  return <CustomSectionEditor section={customSection} />;
                }
                const Component = sectionComponents[openModalSection];
                if (!Component) return null;
                return (
                  <Component
                    key={`${openModalSection}-${modalMountVersionRef.current}`}
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                );
              })()}
            </div>


            <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between gap-3">
              {/* Auto-save status — inline, left-aligned */}
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                {isAutoSaving && (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-blue-500 truncate">Auto-saving…</span>
                  </>
                )}
                {!isAutoSaving && lastSaved && (
                  <span className="text-green-600 truncate">
                    ✓ Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForm}
                  disabled={isSaving}
                  className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default EditorTab;

