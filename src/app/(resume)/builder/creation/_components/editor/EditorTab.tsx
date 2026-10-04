"use client";
import React, { useState, useEffect, useCallback,useRef } from "react";

// Module-level constant — single source of truth for all section → backend key mapping.
// Previously duplicated three times inside the component (component body, triggerAutoSave, handleSaveForm).
const SECTION_KEY_MAP: Record<string, string> = {
  "Personal Info": "personal_info",
  "Professional Summary": "professional_summary",
  "Service Record": "service_record",
  "Skills": "skills",
  "Education": "education",
  "Work Experience": "work_experience",
  "Vessels Operated": "vessels_operated",
  "Ports Experience": "ports_experience",
  "Sea Service Record": "sea_service_record",
  "Maritime Certifications": "maritime_certifications",
  "Research Grants": "research_grants",
  "Editorial Activities": "editorial_activities",
  "Conference Presentations": "conference_presentations",
  "Projects": "projects",
  "Certifications": "certifications",
  "Licenses and Credentials": "licenses",
  "Certificates and Clearances": "certificates_and_clearances",
  "Bar Admissions and Licenses": "bar_admissions_and_licenses",
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
import { buildBuilderSectionPayload, SECTION_STATE_KEYS } from "../../_utils/sectionPayloadKeys";
import { findCustomSectionByName, normalizeCustomSectionName } from "../../_utils/customSectionIdentity";
import { prepareEducationForPersistence } from "@/utils/educationPersistence";
import { Plus, Sparkles, X, LayoutGrid } from "lucide-react";
import { useResume, CustomSection } from "../../_context/ResumeContext";
import { useModalMountVersion } from "../../_hooks/useModalMountVersion";
import { updateResume, getAllResumes, autoSaveResume, transformCustomSectionsForBackend } from "@/api/resumeApi";
import { autoSaveEnhancedResume, updateEnhancedResume } from "@/api/enhancerApi";
import { SUGGESTION_SECTION_MAP, getSectionValue, isStructuralSuggestionSatisfied, toSuggestionSectionKey } from "../../_utils/suggestionSection";
import { toast } from "sonner";
import logger from "@/lib/logger";

/**
 * Custom sections are a collection-level resource. Enhanced-resume autosave
 * merges array entries by id, so it cannot represent an omitted section as a
 * delete and its acknowledgement does not contain the assigned ids. Use the
 * full-replace endpoint for add/delete so the returned snapshot becomes the
 * next authoritative local collection.
 */
export async function persistEnhancedCustomSections(
  enhancedId: string,
  sections: CustomSection[],
  coreCompetenciesDismissed?: boolean,
): Promise<CustomSection[] | undefined> {
  const response = await updateEnhancedResume(enhancedId, {
    enhanced_sections: {
      customSections: transformCustomSectionsForBackend(sections || []),
      // The backend flattens enhanced_sections into enhanced_data, where
      // resumeMappers reads this flag so a deleted Core Competencies section
      // is not synthesized again on the next load.
      ...(coreCompetenciesDismissed === undefined ? {} : { coreCompetenciesDismissed }),
    },
  } as Parameters<typeof updateEnhancedResume>[1]);
  const enhancedData = response?.enhanced_data as Record<string, unknown> | undefined;
  return (enhancedData?.customSections ?? enhancedData?.custom_sections) as
    | CustomSection[]
    | undefined;
}

interface SectionComponentProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}

/**
 * "resume-item-deleted" listener body, pulled out of its useEffect so it's
 * directly testable. A section's delete handler (e.g. Certifications.tsx)
 * dispatches this event before calling its DELETE endpoint; this cancels a
 * QUEUED debounced autosave for that section and, if one has already fired
 * and is awaiting a response, hands its promise back via `awaitInFlight` so
 * the caller can await it -- guaranteeing DELETE is always the last request
 * to reach the backend for that section.
 */
/** Fields that are optional across every section, by a case-insensitive substring match on the field key. */
function isRequiredField(key: string): boolean {
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
}

/**
 * isRequiredField() above treats "location" as optional everywhere, since
 * it's genuinely optional on Work Experience, Education, etc. Personal
 * Info's location field is the one exception -- required there. Exported
 * (and pulled out of the component) so this section-specific override is
 * directly testable without rendering EditorTab.
 */
export function isFieldRequiredForSection(key: string, openModalSection: string | null): boolean {
  return isRequiredField(key) || (openModalSection === "Personal Info" && key.toLowerCase() === "location");
}

/**
 * Professional Summary autosave gate: Summary is the required field here
 * (Target Role is optional, per the editor's own "*" marker). List-based
 * sections (Education, Projects, etc.) already skip autosaving an entry
 * until it has a backend id, which keeps an incomplete/new entry out of the
 * live preview until the user explicitly saves it -- Professional Summary
 * has no id concept to gate on the same way, so without this it would
 * autosave (and update the live preview) from a Target Role edit alone
 * while Summary was still empty, silently bypassing the "required" marker.
 * Confirmed via a real report of exactly this happening.
 */
export function shouldAutoSaveProfessionalSummary(summary: string): boolean {
  return summary.trim().length > 0;
}

export function handleStaleSectionAutosaveEvent(
  event: Event,
  ctx: {
    openModalSection: string | null;
    skipNextAutoSaveForSectionRef: React.MutableRefObject<string | null>;
    autoSaveTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
    autoSaveInFlightRef: React.MutableRefObject<Promise<void> | null>;
  },
): void {
  const detail = (event as CustomEvent<{
    section?: unknown;
    suppressNext?: unknown;
    awaitInFlight?: { promise?: Promise<void> };
  }>).detail;
  const section = detail?.section;
  if (typeof section !== "string" || section !== ctx.openModalSection) return;
  if (detail?.suppressNext === true) {
    ctx.skipNextAutoSaveForSectionRef.current = section;
  }
  if (ctx.autoSaveTimerRef.current) {
    clearTimeout(ctx.autoSaveTimerRef.current);
    ctx.autoSaveTimerRef.current = null;
  }
  // The timer above only cancels a QUEUED autosave. If one has already fired
  // and its PATCH is in flight, hand its promise back so the caller (a
  // delete handler) can await it before issuing DELETE -- otherwise that
  // stale, pre-delete PATCH can still reach the backend after DELETE and
  // resurrect the item there.
  if (detail?.awaitInFlight && ctx.autoSaveInFlightRef.current) {
    detail.awaitInFlight.promise = ctx.autoSaveInFlightRef.current;
  }
}

/**
 * Explicit Save (handleSaveForm) sends the FULL section array through a
 * full-replace endpoint, while debounced autosave sends only id-carrying
 * items through an id-merge PATCH (see triggerAutoSave above). Those are two
 * independent writers with different merge semantics, and nothing previously
 * stopped a queued/in-flight autosave -- armed by the same edit the user is
 * now explicitly saving -- from landing after Save's full-replace. That
 * interleaving is what produced duplicated/reverted rows (e.g. education
 * entries) when a field was edited and Save was clicked before the 3s
 * autosave debounce elapsed. Mirrors the "resume-item-deleted" delete-race
 * guard above: cancel a queued autosave outright, and await one already in
 * flight so it is guaranteed to land BEFORE (never after) explicit Save's
 * own full-replace PATCH.
 */
export async function awaitPendingSectionAutosave(ctx: {
  autoSaveTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  autoSaveInFlightRef: React.MutableRefObject<Promise<void> | null>;
}): Promise<void> {
  // Loop: settling the in-flight autosave updates resumeData, which can
  // re-arm the debounce timer while we wait. Return only when nothing is
  // queued or in flight. (canArmSectionAutosave covers a re-arm that lands
  // after this returns, while the explicit Save itself is in flight.)
  // A promise already awaited counts as settled even if a caller left it in
  // the ref (EditorTab's own autosave clears it in .finally; nothing else
  // must be able to spin this loop forever).
  let awaited: Promise<void> | null = null;
  for (;;) {
    if (ctx.autoSaveTimerRef.current) {
      clearTimeout(ctx.autoSaveTimerRef.current);
      ctx.autoSaveTimerRef.current = null;
    }
    const inFlight = ctx.autoSaveInFlightRef.current;
    if (!inFlight || inFlight === awaited) return;
    awaited = inFlight;
    await inFlight;
  }
}

/**
 * Re-entrancy lock for explicit Save, taken synchronously on click (before
 * awaitPendingSectionAutosave's network wait), so a second click and Cancel
 * are refused/disabled from the first frame.
 */
export function beginExplicitSave(ctx: {
  explicitSaveInProgressRef: React.MutableRefObject<boolean>;
  setIsSaving: (saving: boolean) => void;
}): boolean {
  if (ctx.explicitSaveInProgressRef.current) return false;
  ctx.setIsSaving(true);
  // Taken last: nothing after it can throw before handleSaveForm's try, whose
  // finally (endExplicitSave) always releases it.
  ctx.explicitSaveInProgressRef.current = true;
  return true;
}

export function endExplicitSave(ctx: {
  explicitSaveInProgressRef: React.MutableRefObject<boolean>;
  setIsSaving: (saving: boolean) => void;
}): void {
  ctx.explicitSaveInProgressRef.current = false;
  ctx.setIsSaving(false);
}

/**
 * Explicit Save cancels a QUEUED autosave before it writes. If that Save then
 * does not complete because the REQUEST failed, re-arm the autosave it
 * cancelled, or the last edits would never be persisted. Not when client
 * validation blocked it: that data must not be written by any path.
 */
export function restoreCancelledAutosave(ctx: {
  cancelledQueuedAutosave: boolean;
  saveSucceeded: boolean;
  /** Client validation refused the data: re-sending it via autosave would write what Save blocked. */
  blockedByValidation: boolean;
  section: string | null;
  triggerAutoSave: (section: string) => unknown;
}): boolean {
  if (!ctx.cancelledQueuedAutosave || ctx.saveSucceeded || ctx.blockedByValidation || !ctx.section) return false;
  ctx.triggerAutoSave(ctx.section);
  return true;
}

/**
 * Give items that have no id yet the id the backend assigned to the item at
 * the same index. Shared by the autosave write-back to state and to
 * resumeDataRef, so an explicit Save that awaited that autosave sends the ids.
 */
export function mergeBackendItemIds(
  currentItems: Array<Record<string, unknown>>,
  backendItems: unknown[],
): Array<Record<string, unknown>> {
  return currentItems.map((item, idx) => {
    if (item.id || item._id) return item;
    const backend = backendItems[idx] as Record<string, unknown> | undefined;
    const bid = backend?.id || backend?._id;
    return bid ? { ...item, id: bid } : item;
  });
}

/** Autosave must not arm while an explicit Save is writing the section. */
export function canArmSectionAutosave(
  explicitSaveInProgressRef: React.MutableRefObject<boolean>,
): boolean {
  return !explicitSaveInProgressRef.current;
}

/**
 * Explicit-Save payload for a custom section. Enhanced resumes go through
 * updateEnhancedResume, which (unlike updateResume) does not transform, so
 * send the backend shape exactly as persistEnhancedCustomSections does.
 */
export function buildCustomSectionsSavePayload(
  sections: CustomSection[] | undefined,
  isEnhancedResume: boolean,
): { customSections: unknown } {
  return {
    customSections: isEnhancedResume
      ? transformCustomSectionsForBackend(sections || [])
      : sections,
  };
}

/** Custom sections (with backend ids) returned by an explicit Save. */
export function readSyncedCustomSections(
  resp: Record<string, unknown> | undefined,
  isEnhancedResume: boolean,
): CustomSection[] | undefined {
  if (!resp) return undefined;
  if (!isEnhancedResume) return resp.customSections as CustomSection[] | undefined;
  const source = (resp.enhanced_resume as Record<string, unknown> | undefined) ?? resp;
  const enhanced = source.enhanced_data as Record<string, unknown> | undefined;
  return (enhanced?.customSections ?? enhanced?.custom_sections
    ?? source.customSections ?? resp.customSections) as CustomSection[] | undefined;
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

  // Keys the open section editor below; stable while the same section stays
  // open, fresh on every open. See useModalMountVersion.
  const modalMountVersion = useModalMountVersion(openModalSection, enhancedDataVersion);

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
      return Boolean(findCustomSectionByName(resumeData.customSections, name));
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
  // The debounced autosave PATCH currently in flight, if any. clearTimeout
  // only cancels a QUEUED autosave -- once the timer has fired and its PATCH
  // is awaiting a response, clearing the (already-consumed) timer ref is a
  // no-op, and that request still reaches the backend with a pre-delete
  // section snapshot. cancelStaleSectionAutosave hands this back to the
  // "resume-item-deleted" dispatcher (see its awaitInFlight handling below)
  // so a delete handler can await the in-flight request before issuing its
  // own DELETE -- guaranteeing DELETE is the request that lands last.
  const autoSaveInFlightRef = useRef<Promise<void> | null>(null);
  // Held by handleSaveForm from the click until it finishes; see beginExplicitSave.
  const explicitSaveInProgressRef = useRef(false);
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


  // Deliberately does NOT cancel a pending autosave: X / Cancel only close the
  // modal (they don't revert local edits), and that autosave is what persists
  // the last few seconds of typing. After a successful explicit Save there is
  // nothing pending: awaitPendingSectionAutosave cleared it and
  // canArmSectionAutosave kept it from re-arming while Save ran.
  const closeModal = () => {
    setOpenModalSection(null);
  };


  const handleToggleSection = (sectionName: string) => {
    // Block opening a custom section until its backend UUID has been assigned
    if (pendingCustomSections.current.has(sectionName)) {
      toast.info("Section is still saving — please wait a moment.");
      return;
    }

    // Recover a legacy ghost custom section: older serialization removed the
    // empty section object but left its name in sectionOrder/sidebar. Restore
    // an editable shell before opening so the modal can add its first field.
    if (
      !SECTION_KEY_MAP[sectionName]
      && !findCustomSectionByName(resumeDataRef.current.customSections, sectionName)
    ) {
      const recoveredSection: CustomSection = {
        id: `custom_${typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`,
        sectionName: sectionName.trim(),
        fields: [],
      };
      const recoveredSections = [
        ...(resumeDataRef.current.customSections || []),
        recoveredSection,
      ];
      resumeDataRef.current = {
        ...resumeDataRef.current,
        customSections: recoveredSections,
      };
      addCustomSection(recoveredSection);
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
    // ✅ Special handling for Personal Info: return expected field names
    // so validation works even if formData is initially empty
    if (sectionName === "Personal Info") {
      // Core fields required for all templates
      const coreFields = [
        "fullname",
        "email",
        "phone",
        "countryCode",
        "location",
        "linkedinUrl",
        "githubUrl",
        "portfolioUrl",
      ];

      // Template-specific fields grouped by domain
      const domainSpecificFields: Record<string, string[]> = {
        government_standard: [
          "dateOfBirth",
          "nationality",
          "category",
          "languages",
          "gender",
          "maritalStatus",
          "fathersName",
          "permanentAddress",
        ],
        healthcare: [
          "titlePrefix",
          "qualifications",
          "specialisation",
          "medicalRegNo",
        ],
        legal: [
          "barEnrollmentNo",
          "yearOfEnrollment",
          "courtsOfPractise",
        ],
        marine_merchant_navy: [
          "rank",
          "cocNumber",
          "vesselTypes",
          "stcwCertificates",
        ],
        research_scholar: [
          "qualifications",
          "orcidId",
          "googleScholarUrl",
          "hIndex",
        ],
      };

      // Get active domain
      const activeDomain = getActiveDomain();

      // Return core fields + domain-specific fields for the active domain
      const fieldsToReturn = [
        ...coreFields,
        ...(domainSpecificFields[activeDomain] || []),
      ];

      return fieldsToReturn.filter(field => {
        return Object.keys(formData).some(key => key.toLowerCase() === field.toLowerCase()) ||
               coreFields.includes(field);
      });
    }

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
            lowerKey.includes("countrycode") ||
            lowerKey.includes("location") ||
            lowerKey.includes("linkedinurl") ||
            lowerKey.includes("githuburl") ||
            lowerKey.includes("portfoliourl") ||
            // Template-specific fields
            lowerKey.includes("dateofbirth") ||
            lowerKey.includes("nationality") ||
            lowerKey.includes("category") ||
            lowerKey.includes("languages") ||
            lowerKey.includes("titleprefix") ||
            lowerKey.includes("qualifications") ||
            lowerKey.includes("fathersname") ||
            lowerKey.includes("maritalstatus") ||
            lowerKey.includes("gender") ||
            lowerKey.includes("permanentaddress") ||
            lowerKey.includes("specialisation") ||
            lowerKey.includes("medicalregno") ||
            lowerKey.includes("barenrollmentno") ||
            lowerKey.includes("yearofenrollment") ||
            lowerKey.includes("courtsofpractise") ||
            lowerKey.includes("rank") ||
            lowerKey.includes("cocnumber") ||
            lowerKey.includes("vesseltypes") ||
            lowerKey.includes("stcwcertificates") ||
            lowerKey.includes("orcidid") ||
            lowerKey.includes("googlescholarurl") ||
            lowerKey.includes("hindex"))) ||
        (sectionName === "Professional Summary" &&
          lowerKey.includes("summary")) ||
        (sectionName === "Skills" && lowerKey.includes("skill")) ||
        (sectionName === "Education" && lowerKey.includes("education")) ||
        (sectionName === "Work Experience" &&
          lowerKey.includes("workexperience")) ||
        (sectionName === "Projects" && lowerKey.includes("project")) ||
        (sectionName === "Certifications" &&
          lowerKey.includes("certification")) ||
        (sectionName === "Licenses and Credentials" &&
          lowerKey.includes("license")) ||
        (sectionName === "Certificates and Clearances" &&
          lowerKey.includes("certificateandclearance")) ||
        (sectionName === "Bar Admissions and Licenses" &&
          lowerKey.includes("baradmissionandlicense")) ||
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
          lowerKey.includes("reference")) ||
        (sectionName === "Research Grants" && lowerKey.includes("researchgrant")) ||
        (sectionName === "Editorial Activities" && lowerKey.includes("editorialactivit")) ||
        (sectionName === "Conference Presentations" && lowerKey.includes("conferencepresentation"))
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
      // "autosave" origin: this runs right after this section's own autosave
      // PATCH, while its editor modal may still be open. Skip the resumeData
      // replacement applyManualFix would otherwise do -- it would overwrite
      // anything typed in the few seconds since that PATCH was sent.
      await applyManualFixRef.current(suggestion.id, value, "autosave");
      if (wasExplicitlyTargeted) pendingManualSuggestionRef.current = null;
    }
  }, [isEnhancedResume]);

  const triggerAutoSave = useCallback(async (sectionName: string) => {
    if (!canArmSectionAutosave(explicitSaveInProgressRef)) return;
    // Skills uses individual add/delete endpoints on each chip action — no PATCH needed
    if (sectionName === "Skills") return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }


    autoSaveTimerRef.current = setTimeout(() => {
      // Wrapped (rather than making the setTimeout callback itself async) so
      // the resulting promise can be tracked in autoSaveInFlightRef for the
      // full duration of this autosave, including the network round-trip --
      // see the ref's own comment for why a delete handler needs to await it.
      const run = async () => {
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
          if (!shouldAutoSaveProfessionalSummary(summary)) {
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
          const sectionMap = SECTION_STATE_KEYS as Record<string, keyof typeof live>;
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

        // Imported Education rows can retain parser-only aliases on the server.
        // Since autosave merges by id, clear those aliases after folding their
        // values into the canonical builder fields or every reload compounds them.
        if (sectionName === "Education" && Array.isArray(sectionData)) {
          sectionData = prepareEducationForPersistence(sectionData as Array<Record<string, unknown>>);
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
            service_record: "serviceRecord", vessels_operated: "vesselsOperated", ports_experience: "portsExperience", sea_service_record: "seaServiceRecord", maritime_certifications: "maritimeCertifications",
            skills: "skills", education: "education", work_experience: "workExperience",
            projects: "projects", certifications: "certifications", licenses: "licenses", certificates_and_clearances: "certificatesAndClearances", bar_admissions_and_licenses: "barAdmissionsAndLicenses", achievements: "achievements",
            volunteering: "volunteering", internships: "internships", awards: "awards",
            hobbies: "hobbies", interests: "interests", languages: "languages",
            publications: "publications", patents: "patents", references: "references",
            research_grants: "researchGrants", editorial_activities: "editorialActivities", conference_presentations: "conferencePresentations",
          };
          const camelKey = snakeToCamelSectionMap[backendKey] || backendKey;
          await autoSaveEnhancedResume(resumeId, { [camelKey]: sectionData });
          await confirmSavedManualFixes(sectionName, live);
        } else {
          const updatePayload = buildBuilderSectionPayload(backendKey, sectionData);
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
              projects: "projects", certifications: "certifications", licenses: "licenses", certificates_and_clearances: "certificatesAndClearances", bar_admissions_and_licenses: "barAdmissionsAndLicenses",
              internships: "internships", achievements: "achievements", service_record: "serviceRecord", vessels_operated: "vesselsOperated", ports_experience: "portsExperience", sea_service_record: "seaServiceRecord", maritime_certifications: "maritimeCertifications",
              awards: "awards", volunteering: "volunteering",
              publications: "publications", patents: "patents", references: "references",
              hobbies: "hobbies", interests: "interests", languages: "languages",
              research_grants: "researchGrants", editorial_activities: "editorialActivities", conference_presentations: "conferencePresentations",
            };
            const camelKey = camelKeyMap[backendKey];
            const resp = autoSaveResponse as unknown as Record<string, unknown>;
            const backendItems = camelKey ? resp[camelKey] : undefined;
            if (Array.isArray(backendItems)) {
              // Also update the live ref NOW: an explicit Save awaiting this
              // autosave reads resumeDataRef before React re-renders.
              const refItems = resumeDataRef.current[camelKey as keyof typeof resumeDataRef.current];
              if (Array.isArray(refItems)) {
                resumeDataRef.current = {
                  ...resumeDataRef.current,
                  [camelKey]: mergeBackendItemIds(refItems as Array<Record<string, unknown>>, backendItems),
                };
              }
              setResumeData(prev => {
                const currentItems = prev[camelKey as keyof typeof prev];
                if (!Array.isArray(currentItems)) return prev;
                return { ...prev, [camelKey]: mergeBackendItemIds(currentItems as Array<Record<string, unknown>>, backendItems) };
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
      };
      autoSaveInFlightRef.current = run().finally(() => {
        autoSaveInFlightRef.current = null;
      });
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhancedResume, getActiveResumeId, confirmSavedManualFixes]);


  useEffect(() => {
    const cancelStaleSectionAutosave = (event: Event) =>
      handleStaleSectionAutosaveEvent(event, {
        openModalSection,
        skipNextAutoSaveForSectionRef,
        autoSaveTimerRef,
        autoSaveInFlightRef,
      });
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

  // ✅ Update completion status for multi-entry sections when data changes (auto-save)
  useEffect(() => {
    if (!openModalSection) return;

    const multiEntrySections: Record<string, keyof typeof resumeData> = {
      "Education": "education",
      "Work Experience": "workExperience",
      "Projects": "projects",
      "Certifications": "certifications",
      "Licenses and Credentials": "licenses",
      "Certificates and Clearances": "certificatesAndClearances",
      "Bar Admissions and Licenses": "barAdmissionsAndLicenses",
      "Achievements": "achievements",
      "Awards": "awards",
      "Volunteering": "volunteering",
      "Publications": "publications",
      "Patents": "patents",
      "References": "references",
      "Hobbies": "hobbies",
      "Interests": "interests",
      "Languages": "languages",
      "Internships": "internships",
      "Service Record": "serviceRecord",
      "Vessels Operated": "vesselsOperated",
      "Ports Experience": "portsExperience",
      "Sea Service Record": "seaServiceRecord",
      "Maritime Certifications": "maritimeCertifications",
      "Research Grants": "researchGrants",
      "Editorial Activities": "editorialActivities",
      "Conference Presentations": "conferencePresentations",
    };

    const dataKey = multiEntrySections[openModalSection];
    if (dataKey) {
      const sectionData = resumeData[dataKey];
      const hasData = Array.isArray(sectionData) && sectionData.length > 0;
      setCompletionStatus(prev => ({
        ...prev,
        [openModalSection]: hasData,
      }));
    }
  }, [resumeData, openModalSection, setCompletionStatus]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);


  // ✅ Check if a template domain is active (determines if domain-specific fields are required)
  const getActiveDomain = (): string => {
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';

      const careerLevelStorage = localStorage.getItem(careerLevelKey);
      const selectedTemplateId = localStorage.getItem(selectedTemplateKey);

      if (careerLevelStorage && selectedTemplateId) {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{ id?: string | number; domain_family?: string }>;
        const activeTemplate = careerLevels.find(t => String(t.id) === String(selectedTemplateId));
        return activeTemplate?.domain_family || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // ✅ Check if a field is required for the current template domain
  const isDomainSpecificFieldRequired = (key: string, domain: string): boolean => {
    const lowerKey = key.toLowerCase();

    if (domain === 'government_standard') {
      return ['dateofbirth', 'nationality', 'category', 'languages', 'gender', 'maritalstatus', 'fathersname', 'permanentaddress'].some(f => lowerKey.includes(f));
    } else if (domain === 'healthcare') {
      return ['titleprefix', 'qualifications', 'specialisation', 'medicalregno'].some(f => lowerKey.includes(f));
    } else if (domain === 'legal') {
      return ['barenrollmentno', 'yearofenrollment', 'courtsofpractise'].some(f => lowerKey.includes(f));
    } else if (domain === 'marine_merchant_navy') {
      return ['rank', 'cocnumber', 'vesseltypes', 'stcwcertificates'].some(f => lowerKey.includes(f));
    } else if (domain === 'research_scholar') {
      return ['qualifications', 'orcidid', 'hindex', 'googlescholarurl'].some(f => lowerKey.includes(f));
    }
    return false;
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
      // Determine if this field is required
      let isRequired = isFieldRequiredForSection(key, openModalSection);

      // For Personal Info, check if domain-specific fields are required for the current template
      if (openModalSection === "Personal Info" && !isRequired) {
        const activeDomain = getActiveDomain();
        isRequired = isDomainSpecificFieldRequired(key, activeDomain);
      }

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
    // Live data, not this render's closure: explicit Save calls this after
    // awaiting an in-flight autosave whose backend ids were written to
    // resumeDataRef synchronously (see mergeBackendItemIds).
    const liveResumeData = resumeDataRef.current;
    // // console.log("🔄 Transforming section:", sectionName);

    // ✅ FIXED: Multi-entry sections read from resumeData context, not formData
    // These sections manage their own component state and only update context
    if (["Education", "Work Experience", "Service Record", "Vessels Operated", "Ports Experience", "Sea Service Record", "Maritime Certifications", "Research Grants", "Editorial Activities", "Conference Presentations", "Projects", "Certifications", "Licenses and Credentials", "Certificates and Clearances", "Bar Admissions and Licenses", "Internships", "Achievements", "Awards", "Volunteering", "Publications", "Patents", "References", "Hobbies", "Interests", "Languages"].includes(sectionName)) {
      const contextKey = sectionName
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[àá]/, "a");

      const sectionMap: Record<string, keyof typeof resumeData> = {
        "education": "education",
        "work_experience": "workExperience",
        "service_record": "serviceRecord",
        "vessels_operated": "vesselsOperated",
        "ports_experience": "portsExperience",
        "sea_service_record": "seaServiceRecord",
        "maritime_certifications": "maritimeCertifications",
        "research_grants": "researchGrants",
        "editorial_activities": "editorialActivities",
        "conference_presentations": "conferencePresentations",
        "projects": "projects",
        "certifications": "certifications",
        "licenses": "licenses",
        "licenses_and_credentials": "licenses",
        "certificates_and_clearances": "certificatesAndClearances",
        "bar_admissions_and_licenses": "barAdmissionsAndLicenses",
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
      const data = liveResumeData?.[key];
      if (Array.isArray(data)) {
        return sectionName === "Education"
          ? prepareEducationForPersistence(data as Array<Record<string, unknown>>)
          : data;
      }
      return [];
    }

    if (sectionName === "Declaration") {
      return {
        declaration: liveResumeData.declaration ?? "",
        declarationDate: liveResumeData.declarationDate ?? "",
        declarationPlace: liveResumeData.declarationPlace ?? "",
      };
    }

    if (sectionName === "Professional Summary") {
      return {
        summary: liveResumeData.professionalSummary?.summary || "",
        targetRole: liveResumeData.professionalSummary?.targetRole || "",
      };
    }

    if (sectionName === "Skills") {
      // Backend expects CategorizedSkills with {name} objects per category
      const cats = liveResumeData.categorizedSkills;
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

  if (!beginExplicitSave({ explicitSaveInProgressRef, setIsSaving })) return;
  const savedSection = openModalSection;
  // Whether this Save cancelled a queued autosave, and whether it completed --
  // see restoreCancelledAutosave in the finally below.
  const cancelledQueuedAutosave = autoSaveTimerRef.current !== null;
  let saveSucceeded = false;
  let blockedByValidation = false;

  try {
    // Cancel/await any autosave still pending for this section before sending
    // Save's own full-replace payload -- see awaitPendingSectionAutosave.
    await awaitPendingSectionAutosave({ autoSaveTimerRef, autoSaveInFlightRef });

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
      blockedByValidation = true;
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
      // Each add/remove already bumps this itself right when it lands (see
      // Skills.tsx) so the preview updates without waiting for this Save
      // click at all. Bumped again here too, defensively, so this button
      // always matches every other section's Save behavior.
      bumpResumeSavedVersion();
      saveSucceeded = true;
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
      updatePayload = buildCustomSectionsSavePayload(resumeDataRef.current.customSections, isEnhancedResume);
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

      updatePayload = buildBuilderSectionPayload(backendKey, sectionData);
    }

    // // console.log("📤 Sending payload:", updatePayload);

    // ✅ Step 5: Call update API safely (route to enhanced endpoint if needed)
    let saveResponse;
    if (isEnhancedResume) {
      const snakeToCamelMap: Record<string, string> = {
        personal_info: "personalInfo", professional_summary: "professionalSummary",
        skills: "skills", education: "education", work_experience: "workExperience",
        projects: "projects", certifications: "certifications", licenses: "licenses", achievements: "achievements",
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
      "Licenses and Credentials": "licenses",
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
      const syncedCustomSections = readSyncedCustomSections(resp, isEnhancedResume) as typeof resumeData.customSections | undefined;
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
          const cs = findCustomSectionByName(resumeDataRef.current.customSections, openModalSection);
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
    saveSucceeded = true;
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
    endExplicitSave({ explicitSaveInProgressRef, setIsSaving });
    restoreCancelledAutosave({ cancelledQueuedAutosave, saveSucceeded, blockedByValidation, section: savedSection, triggerAutoSave });
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
    const previousSections = resumeDataRef.current.customSections || [];
    const hadGeneratedCoreCompetencies = previousSections.some(
      section => section.source === "core_competencies",
    );
    const retainsGeneratedCoreCompetencies = (updatedSections || []).some(
      section => section.source === "core_competencies",
    );
    const coreCompetenciesDismissed = resumeDataRef.current.coreCompetenciesDismissed === true
      || (hadGeneratedCoreCompetencies && !retainsGeneratedCoreCompetencies);
    if (coreCompetenciesDismissed && !resumeDataRef.current.coreCompetenciesDismissed) {
      resumeDataRef.current = {
        ...resumeDataRef.current,
        coreCompetenciesDismissed: true,
      };
      setResumeData(previous => ({ ...previous, coreCompetenciesDismissed: true }));
    }
    if (isEnhancedResume) {
      return persistEnhancedCustomSections(resumeId, updatedSections || [], coreCompetenciesDismissed);
    }
    const response = await updateResume(resumeId, {
      customSections: updatedSections,
      coreCompetenciesDismissed,
    } as Parameters<typeof updateResume>[1]);
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
      Boolean(findCustomSectionByName(liveCustomSections, name));
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
          // This create already landed on the backend -- same fix as Skills.tsx's
          // individual add/delete endpoints: bump so the preview panel's
          // server-rendered image (keyed on resumeSavedVersion, not live
          // resumeData) refetches now instead of staying on its pre-create
          // snapshot until an unrelated save or a page refresh.
          bumpResumeSavedVersion();
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
    // Keep every editor area in one normal-flow column. ResumeSide places
    // EditorTab inside a vertical flex container; returning a fragment here
    // made the draggable list, Add New Sections, and Custom Sections separate
    // flex items. On a long resume the list could shrink while its cards still
    // painted at their intrinsic height, putting later controls on top of
    // cards such as Ports Experience and Sea Service Record.
    <div className="flex shrink-0 min-w-0 flex-col pb-6">
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
                              ? findCustomSectionByName(liveCustomSections, s.name)
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
                                cs => normalizeCustomSectionName(cs.sectionName) !== normalizeCustomSectionName(s.name)
                              );
                              removeCustomSection(customSection.id);
                              setSectionOrder(prev => prev.filter(n => n !== s.name));
                              handleDeleteSection(originalIndex);
                              if (rid && rid !== "null" && rid !== "undefined") {
                                await persistCustomSections(rid, filtered);
                                // Same fix as the create path above: this delete
                                // already landed, so bump now rather than leaving
                                // the preview panel's image on its pre-delete
                                // snapshot until an unrelated save or a refresh.
                                bumpResumeSavedVersion();
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


      <section className="mt-5 shrink-0" aria-label="Additional resume sections">
        <AddNewSection />


      {extraSections.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
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
      <div className="mt-6 shrink-0 border-t border-gray-200 pt-4">
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              autoFocus
              className="min-w-0 flex-[1_1_12rem] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
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
              className="shrink-0 px-3 py-2 bg-[#2557a7] text-white text-sm rounded-lg hover:bg-[#1f4e98] transition"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewCustomSectionName("");
                setIsAddingCustomSection(false);
              }}
              className="shrink-0 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      </section>

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
                  ? findCustomSectionByName(
                      resumeDataRef.current.customSections,
                      openModalSection,
                    )
                  : undefined;
                if (customSection) {
                  return <CustomSectionEditor section={customSection} />;
                }
                const Component = sectionComponents[openModalSection];
                if (!Component) return null;
                return (
                  <Component
                    key={`${openModalSection}-${modalMountVersion}`}
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
    </div>
  );
};


export default EditorTab;

