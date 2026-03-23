"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ResumeTemplate from "../_components/ResumeTemplate";
import SectionEditorModal from "../_components/SectionEditorModal";
import ExportModal from "../_components/ExportModal";
import TemplateSelectionModal from "../_components/TemplateSelectionModal";
import type { Improvement } from "@/types/api.types";
import { applyFix, deleteFix, getEnhancedResume, enhanceResume } from "@/api/enhancerApi";

import {
  useResume,
  ALL_SECTIONS,
  type SectionName,
} from "../_components/ResumeContext";

const SIDE_TEMPLATES = [
  { id: "atlas", name: "Classic" },
  { id: "apollo", name: "Modern" },
  { id: "terra", name: "Minimal" },
  { id: "tempe", name: "Creative" },
  { id: "classic_professional", name: "Executive" },
] as const;

// Maps frontend template IDs → backend template slugs stored on the document
const BACKEND_TEMPLATE_MAP: Record<string, string> = {
  apollo: "compact_professional",     // Modern (teal preview) → teal backend
  atlas: "professional_classic",      // Classic (serif, traditional)
  terra: "minimalist_classic",        // Minimal (centered name) → minimalist centered
  tempe: "clean_simple",              // Creative (clean, simple)
  classic_professional: "classic_professional", // Executive (serif, labeled groups)
};

export default function BuilderPage() {
  const router = useRouter();

  const {
    resumeData,
    setResumeData,
    enabledSections,
    setEnabledSections,
    activeSection,
    setActiveSection,
    addEditedSection,
    selectedTemplate,
    setSelectedTemplate,
    isLoaded,
  } = useResume();

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "sections" | "ai">(
    "ai"
  );
  const [enhancedId, setEnhancedId] = useState<string | null>(null);
  type AtsScore = { final_score?: number; max_score?: number; profile?: string; domain?: string; total_score?: number; score_improvement?: number };
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);

  const buildAtsScore = (bd: Record<string, unknown>): AtsScore => ({
    final_score: Number(bd.FinalScore ?? bd.Percentage ?? bd.final_score ?? bd.total_score ?? 0),
    max_score: Number(bd.MaxScore ?? bd.max_score ?? 100),
    profile: String(bd.Profile ?? bd.profile ?? 'General'),
    domain: String(bd.Domain ?? bd.domain ?? ''),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);

  // Load real AI improvements from session storage (generated during upload)
  const [improvements, setImprovements] = useState<Improvement[]>([]);

  // Keep the original full list so we can restore suggestions when fields are removed
  const allImprovementsRef = useRef<Improvement[]>([]);
  // Track permanently ignored suggestions (user clicked "Ignore") — never restore these
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  // Track applied fixes: field name → original suggestion_id (e.g. { email: 'contact_issue_0' })
  const appliedFixesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (isLoaded && !resumeData) router.push("/enhancer");
  }, [isLoaded, resumeData, router]);

  useEffect(() => {
    if (activeSection) setIsEditorModalOpen(true);
  }, [activeSection]);

  useEffect(() => {
    // Load enhanced_id from session storage
    const storedEnhancedId = sessionStorage.getItem('enhanced_id');
    if (storedEnhancedId) {
      setEnhancedId(storedEnhancedId);
    }

    // Load ATS score from session storage
    const storedAtsScore = sessionStorage.getItem('ats_score');
    if (storedAtsScore) {
      try {
        const parsed = JSON.parse(storedAtsScore);
        setAtsScore(parsed);
      } catch (err) {
        console.error('Failed to parse ATS score:', err);
      }
    }

    // Load improvements from session storage
    const stored = sessionStorage.getItem('improvements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setImprovements(parsed);
      } catch (err) {
        console.error('Failed to parse improvements:', err);
        setImprovements([]);
      }
    }

    // Load or initialise the permanent backup of all improvements
    const allStored = sessionStorage.getItem('all_improvements');
    if (allStored) {
      try {
        allImprovementsRef.current = JSON.parse(allStored);
      } catch { /* ignore */ }
    } else if (stored) {
      // First visit — create backup from current improvements
      sessionStorage.setItem('all_improvements', stored);
      try {
        allImprovementsRef.current = JSON.parse(stored);
      } catch { /* ignore */ }
    }
  }, []);

  // Returns:
  //   true  — field is definitely filled (suggestion condition met → hide it)
  //   false — field is definitely empty  (suggestion should be visible)
  //   null  — cannot determine (content-quality suggestion; leave as-is)
  const isSuggestionConditionMet = useCallback((imp: Improvement): boolean | null => {
    if (!resumeData) return false;
    const title = (imp.title || '').toLowerCase();
    const section = mapSuggestionToSection(imp);

    // ── Section-level "Add X section" suggestions ──────────────────
    const addMatch = title.match(/add (\w+) section/i);
    if (addMatch) {
      const sName = addMatch[1].toLowerCase();
      const sectionArrays: Record<string, unknown[] | undefined> = {
        achievements:   resumeData.achievements,
        certifications: resumeData.certifications,
        certificates:   resumeData.certifications,
        awards:         resumeData.awards,
        internships:    resumeData.internships,
        volunteering:   resumeData.volunteering,
        hobbies:        resumeData.hobbies,
        interests:      resumeData.interests,
        languages:      resumeData.languages,
        publications:   resumeData.publications,
        references:     resumeData.references,
        projects:       resumeData.projects,
        skills:         resumeData.skills,
      };
      if (sName in sectionArrays) return (sectionArrays[sName]?.length ?? 0) > 0;
    }

    // ── PersonalInfo ────────────────────────────────────────────────
    if (section === 'PersonalInfo' || !section) {
      if (title.includes('phone'))     return !!resumeData.personalInfo?.phone?.trim();
      if (title.includes('linkedin'))  return !!resumeData.personalInfo?.linkedinUrl?.trim();
      if (title.includes('github'))    return !!resumeData.personalInfo?.githubUrl?.trim();
      if (title.includes('email'))     return !!resumeData.personalInfo?.email?.trim();
      if (title.includes('portfolio')) return !!resumeData.personalInfo?.portifolioUrl?.trim();
      if (title.includes('location') && section === 'PersonalInfo') return !!resumeData.personalInfo?.location?.trim();
    }

    // ── Summary ─────────────────────────────────────────────────────
    if (section === 'Summary' || title.includes('summary') || title.includes('objective')) {
      const s = resumeData.professionalSummary;
      return typeof s === 'string' ? !!s.trim() : !!(s as unknown as { summary?: string })?.summary?.trim();
    }

    // ── Experience ──────────────────────────────────────────────────
    if (section === 'Experience') {
      const exp: any[] = resumeData.workExperience || [];
      if (exp.length === 0) return false;
      if (title.includes('location'))                                        return exp.every(e => !!e.location?.trim());
      if (title.includes('start') || title.includes('end') || title.includes('date') || title.includes('duration'))
                                                                             return exp.every(e => e.startDate && e.endDate);
      if (title.includes('description') || title.includes('responsibilit') || title.includes('bullet'))
                                                                             return exp.every(e => !!e.description?.trim());
    }

    // ── Education ───────────────────────────────────────────────────
    if (section === 'Education') {
      const edu: any[] = resumeData.education || [];
      if (edu.length === 0) return false;
      if (title.includes('graduation') || title.includes('gpa') || title.includes('grade'))
                                  return edu.every(e => e.endDate || e.grade);
      if (title.includes('start') || title.includes('end') || title.includes('date'))
                                  return edu.every(e => e.startDate && e.endDate);
      if (title.includes('location')) return edu.every(e => !!e.location?.trim());
    }

    // ── Projects ────────────────────────────────────────────────────
    if (section === 'Projects') {
      const projects: any[] = resumeData.projects || [];
      if (projects.length === 0) return false;
      if (title.includes('link') || title.includes('url') || title.includes('github'))
                                   return projects.every(p => !!p.link?.trim());
      if (title.includes('date') || title.includes('start') || title.includes('end'))
                                   return projects.every(p => p.startDate && p.endDate);
      if (title.includes('description') || title.includes('technolog'))
                                   return projects.every(p => !!p.description?.trim());
    }

    // ── Skills ──────────────────────────────────────────────────────
    if (section === 'Skills') {
      return (resumeData.skills?.length ?? 0) > 0;
    }

    // ── Certificates ────────────────────────────────────────────────
    if (section === 'Certificates') {
      const certs: any[] = resumeData.certifications || [];
      if (certs.length === 0) return false;
      if (title.includes('date') || title.includes('year') || title.includes('expir'))
                               return certs.every(c => c.year || c.date || c.expiryDate);
      if (title.includes('issu') || title.includes('organization') || title.includes('provider'))
                               return certs.every(c => c.issuedBy || c.organization);
    }

    // ── Achievements ─────────────────────────────────────────────────
    if (section === 'Achievements') {
      const ach: any[] = resumeData.achievements || [];
      if (ach.length === 0) return false;
      if (title.includes('date') || title.includes('year')) return ach.every(a => a.date || a.year);
      if (title.includes('description'))                     return ach.every(a => !!a.description?.trim());
    }

    // ── Awards ───────────────────────────────────────────────────────
    if (section === 'Awards') {
      const awards: any[] = resumeData.awards || [];
      if (awards.length === 0) return false;
      if (title.includes('date') || title.includes('year')) return awards.every(a => a.date || a.year);
      if (title.includes('issu') || title.includes('organization')) return awards.every(a => a.issuedBy || a.organization);
    }

    // ── Internships ──────────────────────────────────────────────────
    if (section === 'Internships') {
      const interns: any[] = resumeData.internships || [];
      if (interns.length === 0) return false;
      if (title.includes('location'))  return interns.every(i => !!i.location?.trim());
      if (title.includes('date') || title.includes('start') || title.includes('end') || title.includes('duration'))
                                       return interns.every(i => i.startDate && i.endDate);
      if (title.includes('description') || title.includes('responsibilit'))
                                       return interns.every(i => !!i.description?.trim());
    }

    // ── Volunteering ─────────────────────────────────────────────────
    if (section === 'Volunteering') {
      const vol: any[] = resumeData.volunteering || [];
      if (vol.length === 0) return false;
      if (title.includes('date') || title.includes('start') || title.includes('end'))
                             return vol.every(v => v.startDate && v.endDate);
      if (title.includes('description')) return vol.every(v => !!v.description?.trim());
    }

    // ── Languages ───────────────────────────────────────────────────
    if (section === 'Languages') {
      const langs: any[] = resumeData.languages || [];
      if (langs.length === 0) return false;
      if (title.includes('proficien') || title.includes('level'))
                              return langs.every(l => !!l.proficiency?.trim());
    }

    // ── Publications ─────────────────────────────────────────────────
    if (section === 'Publications') {
      const pubs: any[] = resumeData.publications || [];
      if (pubs.length === 0) return false;
      if (title.includes('date') || title.includes('year')) return pubs.every(p => p.date || p.year);
      if (title.includes('link') || title.includes('url'))  return pubs.every(p => !!p.link?.trim());
    }

    // ── References ──────────────────────────────────────────────────
    if (section === 'References') {
      const refs: any[] = resumeData.references || [];
      if (refs.length === 0) return false;
      if (title.includes('email'))   return refs.every(r => !!r.email?.trim());
      if (title.includes('phone'))   return refs.every(r => !!r.phone?.trim());
      if (title.includes('company') || title.includes('organization')) return refs.every(r => !!r.company?.trim());
    }

    // ── Hobbies / Interests ──────────────────────────────────────────
    if (section === 'Hobbies')   return (resumeData.hobbies?.length ?? 0) > 0;
    if (section === 'Interests') return (resumeData.interests?.length ?? 0) > 0;

    // Cannot determine for content-quality suggestions (e.g. "add metrics") — leave as-is
    return null;
  }, [resumeData]);

  // Restore suggestions when resumeData changes and a previously-accepted
  // suggestion's field is removed again (e.g. user clears phone number).
  // Backend suggestions are never proactively removed — they stay until the
  // user explicitly accepts or ignores them.
  useEffect(() => {
    if (!resumeData || allImprovementsRef.current.length === 0) return;
    setImprovements(prev => {
      const currentIds = new Set(prev.map(imp => imp.id));
      const toRestore = allImprovementsRef.current.filter(imp => {
        if (currentIds.has(imp.id)) return false;   // Already visible
        if (ignoredIds.has(imp.id)) return false;   // Permanently ignored
        return isSuggestionConditionMet(imp) === false; // Restore only when field is empty
      });
      if (toRestore.length === 0) return prev;
      return [...prev, ...toRestore];
    });
  }, [resumeData, ignoredIds, isSuggestionConditionMet]);

  const handleToggleSection = (section: SectionName) => {
    setEnabledSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId as typeof SIDE_TEMPLATES[number]['id']);
  };

  // Map improvement category/section to SectionName for editor
  const mapSuggestionToSection = (suggestion: typeof improvements[0]): SectionName | null => {
    // Check if suggestion has a specific section field
    if (suggestion.section) {
      const sectionMap: Record<string, SectionName> = {
        'contact': 'PersonalInfo',
        'summary': 'Summary',
        'experience': 'Experience',
        'skills': 'Skills',
        'keywords': 'Skills',
        'education': 'Education',
        'projects': 'Projects',
        'contentquality': 'Projects',
        'certifications': 'Certificates',
        'certificates': 'Certificates',
        'achievements': 'Achievements',
        'awards': 'Awards',
        'internships': 'Internships',
        'volunteering': 'Volunteering',
        'hobbies': 'Hobbies',
        'interests': 'Interests',
        'languages': 'Languages',
        'publications': 'Publications',
        'references': 'References',
        'formatting': 'PersonalInfo',
        'atscompatibility': 'PersonalInfo',
      };
      const mapped = sectionMap[suggestion.section.toLowerCase()];
      if (mapped) return mapped;

      // IntelligencePenalty: route based on title content
      if (suggestion.section.toLowerCase() === 'intelligencepenalty') {
        const t = (suggestion.title || '').toLowerCase();
        if (t.includes('language') || t.includes('proficien')) return 'Languages';
        return 'PersonalInfo';
      }

      return null;
    }

    // Fallback: try to infer from category or title
    const category = suggestion.category?.toLowerCase() || '';
    const title = suggestion.title?.toLowerCase() || '';

    if (category === 'sections' || title.includes('section')) {
      // Extract section name from title like "Add Achievements Section"
      const match = title.match(/add (\w+) section/i);
      if (match) {
        const sectionName = match[1].toLowerCase();
        const sectionMap: Record<string, SectionName> = {
          'achievements': 'Achievements',
          'certifications': 'Certificates',
          'certificates': 'Certificates',
          'contact': 'PersonalInfo',
          'awards': 'Awards',
          'languages': 'Languages',
          'publications': 'Publications',
          'volunteering': 'Volunteering',
          'hobbies': 'Hobbies',
          'interests': 'Interests',
          'references': 'References',
        };
        return sectionMap[sectionName] || null;
      }
    }

    // Default mappings based on common patterns
    if (title.includes('contact') || title.includes('phone') || title.includes('email')) {
      return 'PersonalInfo';
    }
    if (title.includes('summary') || title.includes('objective')) {
      return 'Summary';
    }
    if (title.includes('experience') || title.includes('work history')) {
      return 'Experience';
    }
    if (title.includes('skill')) {
      return 'Skills';
    }
    if (title.includes('education')) {
      return 'Education';
    }
    if (title.includes('project')) {
      return 'Projects';
    }
    if (title.includes('certification')) {
      return 'Certificates';
    }
    if (title.includes('achievement')) {
      return 'Achievements';
    }
    if (title.includes('award')) {
      return 'Awards';
    }
    if (title.includes('internship')) {
      return 'Internships';
    }
    if (title.includes('volunteer')) {
      return 'Volunteering';
    }
    if (title.includes('language')) {
      return 'Languages';
    }
    if (title.includes('hobby') || title.includes('hobbies')) {
      return 'Hobbies';
    }
    if (title.includes('interest')) {
      return 'Interests';
    }
    if (title.includes('publication')) {
      return 'Publications';
    }
    if (title.includes('reference')) {
      return 'References';
    }

    return null;
  };

  const handleAcceptSuggestion = async (suggestion: typeof improvements[0]) => {
    const fixType = suggestion.fix_type;
    const originalSuggestionId = suggestion.original_suggestion_id;

    // AUTO fix: call applyFix API → updates resume + refreshes ATS score
    if (fixType === 'auto' && originalSuggestionId) {
      setApplyingFixId(suggestion.id);
      let applied = false;
      try {
        const enhancedId = sessionStorage.getItem('enhanced_id');

        if (enhancedId) {
          const result = await applyFix({
            enhancer_state: enhancedId,
            suggestion_id: originalSuggestionId,
            fix_type: 'auto',
          });

          // Update ATS score from the refreshed ats_breakdown
          const newBreakdown = result.enhancer_state?.ats_breakdown as Record<string, unknown> | undefined;
          if (newBreakdown) {
            const newScore = buildAtsScore(newBreakdown);
            sessionStorage.setItem('ats_score', JSON.stringify(newScore));
            setAtsScore(newScore);
          }

          // Sync preview with the updated backend state
          try {
            // applyFix response has the live state used to generate the PDF — use it first
            const liveResume = result.enhancer_state?.resume as any;
            // getEnhancedResume gives the persisted DB record as fallback
            const historyItem = await getEnhancedResume(enhancedId);
            const dbData = historyItem.enhanced_data as any;

            const formatBullets = (contribs: unknown): string => {
              if (Array.isArray(contribs))
                return (contribs as string[]).filter(Boolean).map(c => `• ${String(c).trim()}`).join('\n');
              return typeof contribs === 'string' ? contribs : '';
            };

            // Helper: pick first non-empty array from multiple candidate paths
            const firstArr = (...candidates: any[]): any[] => {
              for (const c of candidates) {
                if (Array.isArray(c) && c.length > 0) return c;
              }
              return [];
            };

            const patch: Partial<typeof resumeData> = {};

            // ── Experience ────────────────────────────────────────────
            const expArr = firstArr(
              liveResume?.experience, liveResume?.work_experience,
              dbData?.experience, dbData?.work_experience, dbData?.workExperience,
              dbData?.llm_data?.experience,
            );
            if (expArr.length > 0) {
              const mappedExp = expArr.map((exp: any) => {
                const dur = exp.duration as string | undefined;
                const startDate = exp.start_date || exp.from || dur?.split(/\s[-–]\s/)[0] || '';
                const endDate = exp.end_date || exp.to || dur?.split(/\s[-–]\s/)[1] || 'Present';
                return {
                  role: String(exp.role || exp.title || exp.position || ''),
                  company: String(exp.company || exp.organization || ''),
                  location: String(exp.location || ''),
                  startDate, endDate,
                  duration: dur || '',
                  description: formatBullets(exp.key_contributions || exp.contributions || exp.responsibilities) || String(exp.description || ''),
                  currentlyWorking: exp.is_current || exp.currently_working || !dur || dur.toLowerCase().includes('present'),
                };
              }).filter((e: any) => e.company || e.role);
              if (mappedExp.length > 0) patch.workExperience = mappedExp;
            }

            // ── Projects ──────────────────────────────────────────────
            const projArr = firstArr(
              liveResume?.projects, liveResume?.project_details,
              dbData?.projects, dbData?.project_details,
              dbData?.llm_data?.projects, dbData?.llm_data?.project_details,
            );
            if (projArr.length > 0) {
              const mappedProj = projArr.map((proj: any) => ({
                title: String(proj.title || proj.name || proj.project_name || proj.projectName || ''),
                link: String(proj.url || proj.link || proj.github || ''),
                description: formatBullets(proj.key_contributions || proj.contributions || proj.responsibilities) || String(proj.description || proj.summary || ''),
                technologies: Array.isArray(proj.technologies || proj.techStack) ? (proj.technologies || proj.techStack) : [],
                startDate: String(proj.start_date || proj.date || ''),
                endDate: String(proj.end_date || ''),
                client: String(proj.client || ''),
              })).filter((p: any) => p.title);
              if (mappedProj.length > 0) patch.projects = mappedProj;
            }

            // ── Summary ───────────────────────────────────────────────
            const summary = liveResume?.summary || dbData?.summary || dbData?.professional_summary || dbData?.professionalSummary;
            if (summary && typeof summary === 'string') patch.professionalSummary = summary;

            if (Object.keys(patch).length > 0 && resumeData) {
              setResumeData({ ...resumeData, ...patch });
            }
          } catch (syncErr) {
            console.error('Preview sync failed:', syncErr);
          }

          applied = true;
        }
      } catch (err: unknown) {
        const raw = (err as { __raw?: Record<string, unknown> })?.__raw;
        const errDetails = (raw as any)?.error?.details;
        if (errDetails?.error === 'INSUFFICIENT_CREDITS') {
          toast.error(
            `Not enough credits (need ${errDetails.credits_required ?? 10}, have ${errDetails.credits_remaining ?? 0}). Upgrade your plan to apply this fix.`
          );
        } else {
          console.error('Failed to apply fix:', err);
        }
      } finally {
        setApplyingFixId(null);
      }

      // Only remove suggestion from list if fix was successfully applied
      if (applied) {
        setImprovements(prev => prev.filter(imp => imp.id !== suggestion.id));
        const updated = improvements.filter(imp => imp.id !== suggestion.id);
        sessionStorage.setItem('improvements', JSON.stringify(updated));
      }
      return;
    }

    // MANUAL fix: open section editor as before
    const section = mapSuggestionToSection(suggestion);
    setPendingAcceptId(suggestion.id);

    const title = suggestion.title?.toLowerCase() || '';
    if (title.includes('linkedin') || title.includes('github')) {
      setActiveSection('PersonalInfo');
      return;
    }

    if (section) {
      if (!enabledSections.includes(section)) {
        setEnabledSections(prev => [...prev, section]);
      }
      setActiveSection(section);
      setActiveTab('sections');
    } else {
      setPendingAcceptId(null);
      setImprovements(prev => prev.filter(imp => imp.id !== suggestion.id));
      const updated = improvements.filter(imp => imp.id !== suggestion.id);
      sessionStorage.setItem('improvements', JSON.stringify(updated));
    }
  };

  const handleIgnoreSuggestion = (suggestionId: string) => {
    // Mark as permanently ignored so it never comes back even if the field is removed
    setIgnoredIds(prev => new Set([...prev, suggestionId]));

    // Remove from improvements list
    setImprovements(prev => prev.filter(imp => imp.id !== suggestionId));

    // Also update session storage
    const updated = improvements.filter(imp => imp.id !== suggestionId);
    sessionStorage.setItem('improvements', JSON.stringify(updated));
  };

  const handleContinueToExport = async () => {
    if (!enhancedId || !resumeData) {
      setIsExportModalOpen(true);
      return;
    }

    setIsSaving(true);

    try {
      setIsExportModalOpen(true);
    } catch (error) {
      console.error('Failed to prepare export:', error);
      alert('Failed to prepare your resume for export. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!resumeData) return null;

  // Format improvements for display — show all backend suggestions as-is
  const suggestions = improvements.map((imp) => ({
    id: imp.id,
    original: imp.before || null,
    improved: imp.after || imp.title,
    reason: imp.title,
    impact: imp.impact,
    impact_points: imp.impact_points,
    // Keep original for mapping
    _original: imp,
  }));

  /* ================= TEMPLATE PREVIEWS ================= */
  // apollo → TemplateOne (compact_professional): Teal accent, LEFT name, contact below pipe-separated
  const ApolloPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight text-left">
      <div className="mb-1.5">
        <div className="font-bold text-[9px] mb-0.5" style={{ color: "#0D9488" }}>YOUR NAME</div>
        <div className="flex flex-wrap gap-x-0.5 mb-1" style={{ fontSize: "4.5px", color: "#374151" }}>
          <span>email@example.com</span><span className="mx-0.5">|</span>
          <span>+1 234 567 8900</span><span className="mx-0.5">|</span>
          <span style={{ color: "#1d4ed8" }}>LinkedIn</span>
        </div>
        <div style={{ borderTop: "1.5px solid #374151" }} />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/3" />
            <div className="h-0.5 rounded w-1/6" style={{ background: "#0D9488" }} />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>SKILLS</div>
        <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 rounded-full mr-0.5" style={{ background: "#0D9488" }} />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 rounded w-10" style={{ background: "#0D9488" }} />
        </div>
      </div>
    </div>
  );

  // atlas → TemplateTwo (professional_classic): Black, LEFT name, pipe contact, verbose section labels
  const AtlasPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight text-left">
      <div className="mb-1.5">
        <div className="font-bold text-[9px] mb-0.5 uppercase tracking-wide">YOUR NAME</div>
        <div className="text-[5px] flex flex-wrap gap-x-0.5 text-gray-700 mb-1">
          <span>email@example.com</span><span className="mx-0.5">|</span>
          <span>+1 234 567 8900</span><span className="mx-0.5">|</span>
          <span style={{ color: "#1d4ed8" }}>LinkedIn</span>
        </div>
        <div style={{ borderTop: "2px solid #111827" }} />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[6px] mb-0.5 border-b border-gray-800 pb-0.5 uppercase">PROFESSIONAL SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[6px] mb-0.5 border-b border-gray-800 pb-0.5 uppercase">PROFESSIONAL EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-16" />
            <div className="h-0.5 bg-gray-300 rounded w-10" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[6px] mb-0.5 border-b border-gray-800 pb-0.5 uppercase">EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[6px] mb-0.5 border-b border-gray-800 pb-0.5 uppercase">TECHNICAL SKILLS</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-10/12" />
        </div>
      </div>
    </div>
  );

  // terra → TemplateThree (minimalist_classic): centered name, bullet separator, line-decorated headings
  const TerraPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="text-center mb-1.5">
        <div className="font-bold text-[10px] mb-0.5 uppercase">YOUR NAME</div>
        <div className="text-[5px] flex items-center justify-center flex-wrap gap-x-0.5 text-gray-700 mb-1">
          <span>email@example.com</span><span className="mx-0.5">•</span>
          <span>+1 234 567 8900</span><span className="mx-0.5">•</span>
          <span style={{ color: "#1d4ed8" }}>LinkedIn</span>
        </div>
        <div style={{ borderTop: "1px solid #9ca3af" }} />
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px] uppercase mr-1">SUMMARY</div>
          <div className="flex-1" style={{ borderTop: "1px solid #808080" }} />
        </div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px] uppercase mr-1">WORK EXPERIENCE</div>
          <div className="flex-1" style={{ borderTop: "1px solid #808080" }} />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/3" />
            <div className="h-0.5 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px] uppercase mr-1">EDUCATION</div>
          <div className="flex-1" style={{ borderTop: "1px solid #808080" }} />
        </div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="mb-1">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px] uppercase mr-1">SKILLS</div>
          <div className="flex-1" style={{ borderTop: "1px solid #808080" }} />
        </div>
        <div className="flex flex-wrap gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-1 py-0.5 rounded" style={{ background: "#f3f4f6", fontSize: "4px" }}>
              <div className="h-0.5 bg-gray-400 rounded w-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // classic_professional → TemplateFive: LEFT name, pipe contact below, plain uppercase headings with border-b
  const TemplateFivePreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight text-left">
      <div className="mb-1.5">
        <div className="font-bold text-[9px] uppercase tracking-wide mb-0.5">YOUR NAME</div>
        <div className="text-[5px] flex flex-wrap gap-x-0.5 text-gray-700 mb-1">
          <span>email@example.com</span><span className="mx-0.5">|</span>
          <span>+1 234 567 8900</span><span className="mx-0.5">|</span>
          <span style={{ color: "#1d4ed8" }}>LinkedIn</span>
        </div>
        <div style={{ borderTop: "2px solid #111827" }} />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5 uppercase" style={{ borderBottom: "1px solid #374151" }}>SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5 uppercase" style={{ borderBottom: "1px solid #374151" }}>EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/3" />
            <div className="h-0.5 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5 uppercase" style={{ borderBottom: "1px solid #374151" }}>EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-0.5 pb-0.5 uppercase" style={{ borderBottom: "1px solid #374151" }}>SKILLS</div>
        <div className="space-y-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <div className="h-0.5 bg-gray-500 rounded w-8" />
              <span style={{ fontSize: "4px", color: "#374151" }}>:</span>
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // tempe → TemplateFour (clean_simple): centered name, pipe contact, "WORK EXPERIENCE"
  const TempePreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="text-center mb-1.5">
        <div className="font-bold text-[9px] uppercase mb-0.5">YOUR NAME</div>
        <div className="text-[5px] flex items-center justify-center flex-wrap gap-x-0.5 text-gray-700 mb-1">
          <span>email@example.com</span><span className="mx-0.5">|</span>
          <span>+1 234 567 8900</span><span className="mx-0.5">|</span>
          <span style={{ color: "#1d4ed8" }}>LinkedIn</span>
        </div>
        <div style={{ borderTop: "2px solid #111827" }} />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 uppercase">SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
        <div className="border-t border-gray-500 mt-1" />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 uppercase">WORK EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/3" />
            <div className="h-0.5 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
        <div className="border-t border-gray-500 mt-1" />
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 uppercase">EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
        <div className="border-t border-gray-500 mt-1" />
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-0.5 uppercase">SKILLS</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 bg-gray-700 rounded-full mr-0.5" />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-3 pb-6 px-6">
        <div className="bg-gray-100 rounded-3xl p-6 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 min-h-[calc(100vh-120px)]">
          {/* LEFT: RESUME PREVIEW */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Live Preview
                </h3>
                <span className="px-2.5 py-1 bg-[#e8eff9] text-[#2557a7] text-[11px] font-semibold rounded-md">
                  {SIDE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ??
                    "Modern"}{" "}
                  Template
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Active sections: {enabledSections.length}/{ALL_SECTIONS.length}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 flex justify-center overflow-auto">
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-[780px]"
                style={{ minHeight: "1020px" }}
              >
                <ResumeTemplate
                  data={resumeData}
                  enabledSections={enabledSections}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: TABS + CONTENT */}
          <div className="flex flex-col space-y-6">
            {/* TAB HEADER CARD */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === "templates"
                      ? "bg-[#2557a7] text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab("sections")}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === "sections"
                      ? "bg-[#2557a7] text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sections
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`relative flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === "ai"
                      ? "bg-[#2557a7] text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  AI
                  {suggestions.length > 0 && (
                    <span className="bg-[#2557a7] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                      {suggestions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* CONTENT CARD */}
            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              <div className="p-6 max-h-[800px] overflow-y-auto">
                {activeTab === "templates" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Choose Template
                      </h3>
                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold text-[#2557a7] bg-[#e8eff9] hover:bg-[#d0dfef] rounded-xl transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      Select a professional template optimized for ATS systems.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {SIDE_TEMPLATES.map((template) => {
                        const isSelected = selectedTemplate === template.id;
                        return (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`relative group transition-all duration-300 rounded-lg overflow-hidden ${
                              isSelected
                                ? "ring-2 ring-[#2557a7] shadow-lg scale-[1.02]"
                                : "hover:scale-[1.01] hover:shadow-md ring-1 ring-gray-200 hover:ring-[#2557a7]/50"
                            }`}
                          >
                            <div className="bg-white border border-gray-100">
                              {template.id === "apollo" && <ApolloPreview />}
                              {template.id === "atlas" && <AtlasPreview />}
                              {template.id === "terra" && <TerraPreview />}
                              {template.id === "tempe" && <TempePreview />}
                              {template.id === "classic_professional" && <TemplateFivePreview />}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-[#2557a7] rounded-full p-1 shadow-lg">
                                <Check
                                  className="w-3 h-3 text-white"
                                  strokeWidth={3}
                                />
                              </div>
                            )}
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/95 backdrop-blur-sm rounded-md p-1 border shadow-sm">
                              <h4 className="font-bold text-[10px] text-gray-900 text-center">
                                {template.name}
                              </h4>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "sections" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Section Manager
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Toggle sections on/off. Changes reflect instantly in
                      preview.
                    </p>

                    <div className="space-y-4">
                      {ALL_SECTIONS.map((section) => {
                        const enabled = enabledSections.includes(section);
                        const sectionName = section
                          .replace(/([A-Z])/g, " $1")
                          .trim();

                        return (
                          <div
                            key={section}
                            className={`border-2 rounded-2xl p-5 shadow-md transition-all ${
                              enabled
                                ? "border-[#2557a7]/20 bg-[#e8eff9]/40 backdrop-blur-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-[#2557a7] flex-shrink-0" />
                                <span className="text-base font-semibold text-gray-900 capitalize">
                                  {sectionName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleToggleSection(section)}
                                className={`relative w-14 h-8 rounded-full transition-all shadow-sm ${
                                  enabled ? "bg-[#2557a7]" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                    enabled ? "translate-x-6" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                      AI Suggestions
                    </h3>

                    {/* ATS Score Badge */}
                    {atsScore?.final_score !== undefined && (() => {
                      const score = Math.round(atsScore.final_score ?? 0);
                      const maxScore = atsScore.max_score ?? 100;
                      const radius = 54;
                      const circumference = 2 * Math.PI * radius;
                      const offset = circumference - (score / maxScore) * circumference;
                      const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 mb-2">
                          <div className="flex items-center gap-5">
                            {/* Circular progress */}
                            <div className="flex-shrink-0">
                              <svg width="128" height="128" viewBox="0 0 128 128">
                                <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                                <circle
                                  cx="64" cy="64" r={radius}
                                  fill="none"
                                  stroke={scoreColor}
                                  strokeWidth="10"
                                  strokeLinecap="round"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  transform="rotate(-90 64 64)"
                                  style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                                />
                                <text x="64" y="58" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="900" fill={scoreColor}>{score}</text>
                                <text x="64" y="80" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#9ca3af">/ {maxScore}</text>
                              </svg>
                            </div>
                            {/* Labels */}
                            <div>
                              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">ATS Score</p>
                              {atsScore.profile && (
                                <p className="text-xs text-gray-500">{atsScore.profile}{atsScore.domain ? ` · ${atsScore.domain}` : ''}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-sm text-gray-600 mb-3">
                      Review and apply AI-powered improvements to boost your resume.
                    </p>

                    {suggestions.length === 0 ? (
                      <div className="border-2 border-gray-200 bg-gray-50 rounded-xl p-6 text-center">
                        <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 font-medium">No AI suggestions available</p>
                        <p className="text-xs text-gray-500 mt-1">Upload a resume to get personalized improvements</p>
                      </div>
                    ) : (
                      suggestions.map((s, i) => (
                        <div
                          key={s.id || i}
                          className="border border-[#2557a7]/15 bg-[#e8eff9]/20 backdrop-blur-sm rounded-xl p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex gap-2 flex-1">
                              <Sparkles className="w-4 h-4 text-[#2557a7] flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-[#2557a7] font-medium leading-snug">
                                {s.reason}
                              </p>
                            </div>
                          </div>

                          {s.original && (
                            <p className="text-xs text-gray-500 line-through mb-1.5 px-1 italic">
                              {s.original}
                            </p>
                          )}

                          <div className="bg-white border border-gray-200 rounded-lg p-2.5 mb-2.5 shadow-xs">
                            <p className="text-sm font-semibold text-gray-900 leading-snug">
                              {s.improved}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleIgnoreSuggestion(s.id)}
                              className="flex-1 py-1.5 border border-gray-300 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              Ignore
                            </button>
                            <button
                              onClick={() => handleAcceptSuggestion(s._original)}
                              disabled={applyingFixId === s.id}
                              className="flex-1 py-1.5 bg-[#2557a7] hover:bg-[#1a4a8f] text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {applyingFixId === s.id ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Applying…
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Accept
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      onClick={handleContinueToExport}
                      disabled={isSaving}
                      className="w-full mt-4 py-3 bg-[#2557a7] hover:bg-[#1a4a8f] text-white rounded-2xl font-semibold text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Continue to Export'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <SectionEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => {
            if (activeSection) {
              addEditedSection(activeSection);
            }
            setIsEditorModalOpen(false);
            setActiveSection(null);
            setPendingAcceptId(null);
          }}
          onSave={(didChange, section, changedFieldNames, changedFieldValues) => {
            if (!didChange) return;

            // Map field names to keywords that may appear in suggestion titles
            const fieldKeywords: Record<string, string[]> = {
              phone: ['phone'],
              location: ['location'],
              linkedinUrl: ['linkedin'],
              githubUrl: ['github'],
              email: ['email'],
              portifolioUrl: ['portfolio'],
              duration: ['date', 'start', 'end', 'passed_out', 'year', 'graduation'],
              grade: ['gpa', 'grade', 'percentage'],
              gradeType: ['grade', 'gpa'],
              skills: ['soft skill', 'softskill', 'skills'],
              summary: ['summary', 'objective'],
            };

            const toRemove = new Set<string>();

            // Remove the explicitly accepted suggestion (if any)
            if (pendingAcceptId) toRemove.add(pendingAcceptId);

            // Auto-remove suggestions whose suggested field is now filled
            if (changedFieldNames.length > 0 && section) {
              improvements.forEach(imp => {
                if (mapSuggestionToSection(imp) !== section) return;
                const titleLower = (imp.title || '').toLowerCase();
                for (const field of changedFieldNames) {
                  const keywords = fieldKeywords[field] || [field.toLowerCase()];
                  if (keywords.some(kw => titleLower.includes(kw))) {
                    toRemove.add(imp.id);
                    break;
                  }
                }
              });
            }

            if (toRemove.size > 0) {
              setImprovements(prev => prev.filter(imp => !toRemove.has(imp.id)));
              const updated = improvements.filter(imp => !toRemove.has(imp.id));
              sessionStorage.setItem('improvements', JSON.stringify(updated));
            }

            // Call applyFix to refresh ATS score from backend
            const enhancedId = sessionStorage.getItem('enhanced_id');
            if (enhancedId) {
              // Use values passed directly from the modal (fresh, not stale closure)
              const fieldValueMap: Record<string, string> = changedFieldValues || {};

              const handleFixResult = (result: Awaited<ReturnType<typeof applyFix>>) => {
                const newBreakdown = result.enhancer_state?.ats_breakdown as Record<string, unknown> | undefined;
                if (newBreakdown) {
                  const newScore = buildAtsScore(newBreakdown);
                  sessionStorage.setItem('ats_score', JSON.stringify(newScore));
                  setAtsScore(newScore);
                }
              };

              if (pendingAcceptId) {
                // User clicked Accept on a specific suggestion
                const acceptedImp = improvements.find(imp => imp.id === pendingAcceptId);
                const originalId = acceptedImp?.original_suggestion_id;
                if (originalId) {
                  const value = changedFieldNames.length > 0
                    ? (fieldValueMap[changedFieldNames[0]] || undefined)
                    : undefined;
                  // Record which field this fix was applied to (for later deletion)
                  if (changedFieldNames.length > 0) {
                    appliedFixesRef.current[changedFieldNames[0]] = originalId;
                  }
                  applyFix({
                    enhancer_state: enhancedId,
                    suggestion_id: originalId,
                    fix_type: 'manual',
                    value,
                  }).then(handleFixResult).catch(() => { /* best-effort */ });
                }
              } else if (changedFieldNames.length > 0) {
                // Detect cleared fields → call deleteFix to reverse the score + restore suggestion
                for (const field of changedFieldNames) {
                  const clearedValue = (fieldValueMap[field] ?? '').trim() === '';
                  const appliedSuggestionId = appliedFixesRef.current[field];
                  if (clearedValue && appliedSuggestionId) {
                    deleteFix({ enhancer_state: enhancedId, suggestion_id: appliedSuggestionId })
                      .then(result => {
                        delete appliedFixesRef.current[field];
                        handleFixResult(result);
                        // Restore the suggestion back to the list from the backup
                        const restored = allImprovementsRef.current.find(
                          imp => imp.original_suggestion_id === appliedSuggestionId
                        );
                        if (restored && !ignoredIds.has(restored.id)) {
                          setImprovements(prev => {
                            if (prev.some(imp => imp.id === restored.id)) return prev;
                            const updated = [...prev, restored];
                            sessionStorage.setItem('improvements', JSON.stringify(updated));
                            return updated;
                          });
                        }
                      })
                      .catch(() => { /* best-effort */ });
                  }
                }

                // User directly edited sections — apply fix for each matched suggestion
                const matchedImps = improvements.filter(imp => toRemove.has(imp.id));
                matchedImps.forEach(imp => {
                  const originalId = imp.original_suggestion_id;
                  if (!originalId) return;
                  const titleLower = (imp.title || '').toLowerCase();
                  let value: string | undefined;
                  let matchedField: string | undefined;
                  for (const field of changedFieldNames) {
                    const keywords = fieldKeywords[field] || [field.toLowerCase()];
                    if (keywords.some(kw => titleLower.includes(kw))) {
                      value = fieldValueMap[field] || undefined;
                      matchedField = field;
                      break;
                    }
                  }
                  // Record applied fix for future deletion
                  if (matchedField) {
                    appliedFixesRef.current[matchedField] = originalId;
                  }
                  applyFix({
                    enhancer_state: enhancedId,
                    suggestion_id: originalId,
                    fix_type: 'manual',
                    value,
                  }).then(handleFixResult).catch(() => { /* best-effort */ });
                });

                // If no suggestion was matched but skills changed (e.g. user removed a skill),
                // call POST /resume/enhance to recalculate the ATS score
                const skillFields = Object.keys(fieldKeywords).filter(f =>
                  (fieldKeywords[f] ?? []).some((kw: string) => kw.includes('skill'))
                );
                const skillChanged = changedFieldNames.some(f => skillFields.includes(f));
                if (matchedImps.length === 0 && skillChanged) {
                  const originalResumeId = sessionStorage.getItem('original_resume_id') || sessionStorage.getItem('resume_id');
                  if (originalResumeId) {
                    enhanceResume({ resume_id: originalResumeId })
                      .then(result => {
                        const newBreakdown = result.enhancer_state?.ats_breakdown as Record<string, unknown> | undefined;
                        if (newBreakdown) {
                          const newScore = buildAtsScore(newBreakdown);
                          sessionStorage.setItem('ats_score', JSON.stringify(newScore));
                          setAtsScore(newScore);
                        }
                      })
                      .catch(() => { /* best-effort */ });
                  }
                }
              }
            }
          }}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          enhancedId={enhancedId || undefined}
          improvements={improvements}
          atsScore={atsScore || undefined}
          selectedTemplate={selectedTemplate}
        />

        <TemplateSelectionModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleTemplateSelect}
          currentTemplate={selectedTemplate}
        />
      </main>
    </div>
  );
}
