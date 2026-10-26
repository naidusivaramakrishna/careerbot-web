"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Star, Medal, CircleCheck, Briefcase, Building2 } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getTemplatesByCategory, applyTemplateToResume, getTemplateCategories, getTemplateById, TemplateResponse } from "@/api/resumeApi";
import { toast } from "sonner";
import logger from "@/lib/logger";
import { TEMPLATE_DEFAULT_STYLES, STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueTab from "./CatalogueTab";
import type { DropResult } from "@hello-pangea/dnd";
import { getProfile } from "@/api/userApi";
import { useRouter, useSearchParams } from "next/navigation";
import { getSectionOrderByDomainAndCareer, getSectionOrderFromTemplate, addCareerLevelSections, SECTION_KEY_TO_DISPLAY_NAME, getDomainSectionOrder } from "@/app/(resume)/templates/_utils/domainSectionOrder";
import { detectCareerLevel as detectCareerLevelUtil } from "@/utils/careerLevelDetection";
import { DOMAIN_FAMILY_IMAGES, FALLBACK_TEMPLATE_IMAGE } from "@/app/(resume)/templates/_constants/templateImages";
import { resolveTemplateImageUrl } from "@/lib/imageUtils";
import { TemplatePreviewRenderer } from "@/components/templates";

// Format backend level strings to display format
const formatBackendLevel = (backendLevel?: string): string | undefined => {
  if (!backendLevel) return undefined;
  const level = backendLevel.toLowerCase();
  if (level === 'fresher' || level === 'entry_level') return 'Fresher';
  if (level === 'early_career') return 'Early Career';
  if (level === 'mid_level' || level === 'mid-level') return 'Mid-Level';
  if (level === 'senior_level' || level === 'senior-level') return 'Senior-Level';
  if (level === 'lead') return 'Lead';
  if (level === 'architect') return 'Architect';
  if (level === 'manager') return 'Manager';
  if (level === 'director') return 'Director';
  if (level === 'vice_president' || level === 'vp') return 'Vice President';
  return undefined;
};

// Get career level from template, preferring backend level
const getCareerLevel = (template: TransformedTemplate): string => {
  const backendLevel = (template as unknown as Record<string, unknown>).level as string | undefined;
  if (backendLevel) {
    return formatBackendLevel(backendLevel) || 'Custom';
  }

  const name = template.name || '';
  const nameStr = name.toLowerCase();
  if (nameStr.includes('early') && nameStr.includes('career')) return 'Early Career';
  if (nameStr.includes('fresher')) return 'Fresher';
  if (nameStr.includes('architect')) return 'Architect';
  if (nameStr.includes('manager')) return 'Manager';
  if (nameStr.includes('lead')) return 'Lead';
  if (nameStr.includes('senior')) return 'Senior-Level';
  if (nameStr.includes('director')) return 'Director';
  if (nameStr.includes('vice') || nameStr.includes('vp')) return 'Vice President';
  if (nameStr.includes('mid')) return 'Mid-Level';
  return 'Custom';
};

// Interface updated with mongoId (_id)
interface TransformedTemplate {
  id: string;
  mongoId: string; // MongoDB _id
  template_id: string;
  name: string;
  subtitle: string;
  preview_url: string;
  atsFriendly: boolean;
  description: string;
  category: string;
  domain_family?: string;
  domain_display_name?: string;
  level?: string;  // e.g., 'early_career', 'mid_level', 'senior_level'
  experience_years?: string;  // e.g., '0-2', '1-3'
  preview_html?: string;
  preview_css?: string;
  sections?: Record<string, Record<string, unknown>>;
}

interface TemplatesTabProps {
  onTemplateSelect?: () => void;
  resumeId?: string;
  /** ATS Scan uses an enhanced-resume ID; its export receives the chosen template directly. */
  isEnhancedResume?: boolean;
  /** Sections in their current order; with onReorderSections this enables the "Section Order" tab
   *  (the tab itself is added in the next PR of the series; until then these props are accepted and unused). */
  sections?: { name: string }[];
  onReorderSections?: (result: DropResult) => void;
}

/**
 * Store fetched preview_html/preview_css back into careerLevelTemplates_<email>
 * so later mounts render the cards without one GET /templates/{id} per card.
 * Only writes when the stored list is still the one that was enriched.
 */
function persistEnrichedCareerLevels(
  careerLevelKey: string,
  original: ReadonlyArray<object> | null,
  enriched: ReadonlyArray<object> | null,
) {
  if (!original || !enriched || enriched === original) return;
  const hasPreview = (tpl: object | undefined) => !!(tpl as { preview_html?: string } | undefined)?.preview_html;
  if (!enriched.some((tpl, i) => hasPreview(tpl) && !hasPreview(original[i]))) return;
  try {
    const stored = localStorage.getItem(careerLevelKey);
    if (stored !== JSON.stringify(original)) return;
    localStorage.setItem(careerLevelKey, JSON.stringify(enriched));
  } catch {
    // Storage full / unavailable — the cards still render from state.
  }
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect, resumeId, isEnhancedResume = false }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
  const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
  const [templates, setTemplates] = useState<TransformedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [careerLevelData, setCareerLevelData] = useState<Array<{
    id: string;
    name: string;
    preview_url: string;
    description?: string;
    ats_friendly?: boolean;
    subtitle?: string;
    domain_family?: string;
    domain_display_name?: string;
    preview_html?: string;
    preview_css?: string;
  }> | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [previewImgSrc, setPreviewImgSrc] = useState<string>('');

  const { selectedTemplate, setSelectedTemplate, setResumeStyle, setSectionOrder, sectionOrder } = useResume();

  // Cache enrichment promise to prevent duplicate API calls
  const enrichmentCacheRef = useRef<Promise<typeof careerLevelData> | null>(null);

  // Enrich career level data with preview HTML/CSS (cached to prevent 100+ API calls)
  const enrichCareerLevelData = useCallback(
    async (templates: typeof careerLevelData) => {
      if (!templates || templates.length === 0) return templates;
      // Cards that already carry their preview (stored from an earlier fetch or
      // from the list payload) need no GET /templates/{id}.
      if (templates.every((tpl) => tpl.preview_html && tpl.preview_css)) return templates;

      // Return cached result if already enriching
      if (enrichmentCacheRef.current) {
        return enrichmentCacheRef.current;
      }

      const enrichmentPromise = (async () => {
        try {
          const enriched = await Promise.all(
            templates.map(async (tpl) => {
              if (tpl.preview_html && tpl.preview_css) return tpl;
              try {
                const fullTemplate = await getTemplateById(tpl.id);
                return {
                  ...tpl,
                  preview_html: fullTemplate.preview_html,
                  preview_css: fullTemplate.preview_css,
                };
              } catch (err) {
                logger.warn(`Failed to fetch preview for ${tpl.name}, using fallback`, err);
                return tpl;
              }
            })
          );
          return enriched;
        } catch (err) {
          logger.error('Error enriching career level data:', err);
          return templates;
        }
      })();

      enrichmentCacheRef.current = enrichmentPromise;
      return enrichmentPromise;
    },
    []
  );

  // Get user email for scoped localStorage keys
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const profile = await getProfile();
        if (profile.email) {
          setUserEmail(profile.email);
          logger.info('User email set for scoped storage:', profile.email);
        }
      } catch (err) {
        logger.warn('Failed to get user email for scoped storage', err);
      }
    };

    fetchUserEmail();
  }, []);

  // Check for applied template from templates page
  useEffect(() => {
    if (typeof window === 'undefined' || !userEmail) return; // Wait for userEmail to be set

    let ignore = false; // guard: skip state writes if unmounted / userEmail changed mid-fetch

    // ATS selections belong to the enhanced resume, not to the user's normal
    // builder/domain-template state. Restoring the display ID keeps the native
    // preview on the applied layout whenever the ATS template drawer reopens.
    if (isEnhancedResume && resumeId) {
      const appliedDisplayId = localStorage.getItem(`enhancedTemplateDisplayId_${resumeId}`);
      if (appliedDisplayId) setSelectedTemplate(appliedDisplayId);
      setAppliedTemplateId(null);
      setCareerLevelData(null);
      return () => { ignore = true; };
    }

    // Create user-scoped localStorage keys
    const selectedTemplateKey = `selectedTemplateId_${userEmail}`;
    const careerLevelKey = `careerLevelTemplates_${userEmail}`;

    const storedTemplateId = localStorage.getItem(selectedTemplateKey);
    const storedCareerLevels = localStorage.getItem(careerLevelKey);

    logger.info('TemplatesTab mount - checking localStorage with email:', userEmail);
    logger.info('Keys being used:', {
      selectedTemplateKey,
      careerLevelKey
    });
    logger.info('Values found in localStorage:', {
      storedTemplateId,
      storedCareerLevels: storedCareerLevels ? 'exists' : 'null'
    });

    if (storedTemplateId) {
      setAppliedTemplateId(storedTemplateId);
      setSelectedTemplate(null); // Clear regular template selection when loading career level
      logger.info('✓ Applied template ID set to:', storedTemplateId);
    } else {
      setAppliedTemplateId(null);
      logger.info('⚠ No template ID found in localStorage');
    }

    if (storedCareerLevels) {
      try {
        const careerLevels = JSON.parse(storedCareerLevels) as Array<{
          id: string;
          name: string;
          preview_url: string;
          description?: string;
          ats_friendly?: boolean;
          subtitle?: string;
          domain_family?: string;
          preview_html?: string;
          preview_css?: string;
        }>;
        logger.info('Career level templates loaded from storage:', careerLevels.length);

        // Enrich with preview data
        const enrichAndSet = async () => {
          const enriched = await enrichCareerLevelData(careerLevels);
          if (ignore) return; // unmounted / userEmail changed while fetching
          setCareerLevelData(enriched);
          persistEnrichedCareerLevels(careerLevelKey, careerLevels, enriched);
        };
        enrichAndSet();
      } catch (err) {
        logger.error('Failed to parse career level templates', err);
        setCareerLevelData(null);
      }
    } else {
      // Only auto-populate when the user hasn't explicitly chosen a catalogue/style template.
      // If user_chose_style is set, clearing careerLevelTemplates (done by handleApplyTemplate)
      // must not re-seed SE data and silently discard their explicit style choice.
      const styleKey = `user_chose_style_${userEmail}`;

      // Migration: if the user applied a style template after this flag was introduced
      // (signalled by styleTemplateApplied_{email}) but user_chose_style was somehow lost,
      // restore it. Note: truly pre-deploy style users have no persistent localStorage signal
      // and will see SE auto-populate once; they self-heal by re-applying their style.
      const styleAppliedKey = userEmail ? `styleTemplateApplied_${userEmail}` : null;
      if (styleAppliedKey && localStorage.getItem(styleAppliedKey) && !localStorage.getItem(styleKey)) {
        localStorage.setItem(styleKey, 'true');
      }

      if (localStorage.getItem(styleKey) === 'true') {
        setCareerLevelData(null);
      } else {
        // New user with no domain selected — auto-populate software_engineering career levels
        // so TemplatesTab shows career level cards and PreviewPanel shows Template2.tsx.
        const autoPopulate = async () => {
          try {
            const allTemplates = await getTemplatesByCategory();
            if (ignore) return; // unmounted / email changed before the fetch resolved
            const seTemplates = (allTemplates || []).filter((t: TemplateResponse) => {
              return (t as unknown as Record<string, unknown>).domain_family === 'software_engineering';
            });

            if (seTemplates.length === 0) {
              setCareerLevelData(null);
              return;
            }

            const levelOrder = ['fresher', 'early career', 'mid-level', 'senior-level', 'lead', 'architect', 'manager'];
            const sorted = [...seTemplates].sort((a, b) => {
              const aIdx = levelOrder.findIndex(l => (a.name || '').toLowerCase().includes(l));
              const bIdx = levelOrder.findIndex(l => (b.name || '').toLowerCase().includes(l));
              if (aIdx === -1) return 1;
              if (bIdx === -1) return -1;
              return aIdx - bIdx;
            });

            const careerLevelData = sorted.map((t: TemplateResponse) => ({
              id: t.id?.toString() || t._id || '',
              name: t.name,
              preview_url: t.preview_url || '/assets/templates/template-1.jpg',
              description: t.description || 'Professional resume template',
              ats_friendly: t.ats_friendly ?? true,
              subtitle: t.name?.split('-')?.[1]?.trim() || 'Template',
              domain_family: 'software_engineering',
              domain_display_name: 'Software Engineering',
            }));

            // Find Early Career template; fall back to first in list
            const earlyCareerTpl = careerLevelData.find(t =>
              t.name.toLowerCase().includes('early') && t.name.toLowerCase().includes('career')
            ) || careerLevelData[0];

            localStorage.setItem(careerLevelKey, JSON.stringify(careerLevelData));
            const domainFamilyKey = `domainFamily_${userEmail}`;
            localStorage.setItem(domainFamilyKey, 'software_engineering');

            if (earlyCareerTpl?.id) {
              localStorage.setItem(selectedTemplateKey, earlyCareerTpl.id);
              setAppliedTemplateId(earlyCareerTpl.id);
              setSelectedTemplate(null);

              // Set section order for software_engineering + early career
              const sectionOrder = getSectionOrderByDomainAndCareer('software_engineering', 'early career');
              const sectionOrderKey = `sectionOrder_${userEmail}`;
              localStorage.setItem(sectionOrderKey, JSON.stringify(sectionOrder));
              setSectionOrder(sectionOrder);
            }

            // Enrich with preview data
            const enriched = await enrichCareerLevelData(careerLevelData);
            if (ignore) return;
            setCareerLevelData(enriched);
            persistEnrichedCareerLevels(careerLevelKey, careerLevelData, enriched);
            logger.info('Auto-populated software_engineering career levels:', careerLevelData.length, '| applied:', earlyCareerTpl?.name);
          } catch (err) {
            logger.warn('Failed to auto-populate software_engineering templates', err);
            setCareerLevelData(null);
          }
        };
        autoPopulate();
      }
    }
    return () => { ignore = true; };
  }, [userEmail, setSelectedTemplate, enrichCareerLevelData, isEnhancedResume, resumeId, setSectionOrder]);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        logger.info("Fetching all templates");

        const data = await getTemplatesByCategory();

        logger.info("Templates fetched from API:", data?.length || 0, data);

        if (data && Array.isArray(data) && data.length > 0) {
          // ✅ Map template_id to correct image paths
          const templateImageMap: Record<string, string> = {
            'compact_professional': '/assets/templates/template-1.png',
            'clean_simple': '/assets/templates/template-2.png',
            'minimalist_classic': '/assets/templates/template-3.png',
            // Legacy IDs previously emitted by the picker. Keep these until
            // every persisted selection has migrated to the canonical IDs.
            'classic_horizontal_dividers': '/assets/templates/template-3.png',
            'professional_classic': '/assets/templates/template-4.png',
            'classic_professional': '/assets/templates/template-4.png',
            'classic_professional_variant': '/assets/templates/template-4.png',
          };

          // ✅ Only show templates that have valid image mappings (filter out unknown templates)
          const knownTemplateIds = Object.keys(templateImageMap);

          const transformedTemplates: TransformedTemplate[] = data
            .filter((tpl: TemplateResponse) => {
              const templateId = tpl.template_id || tpl.id?.toString() || "0";
              return knownTemplateIds.includes(templateId);
            })
            .map((tpl: TemplateResponse) => {
              const templateId = tpl.template_id || tpl.id?.toString() || "0";

              // Prefer backend preview_url; fall back to local mapped image
              const previewUrl = tpl.preview_url
                ? resolveTemplateImageUrl(tpl.preview_url)
                : (templateImageMap[templateId] || FALLBACK_TEMPLATE_IMAGE);

              return {
                id: tpl.id?.toString() || tpl.template_id || "0",
                mongoId: tpl.id?.toString() || tpl._id || "0",
                template_id: templateId,
                name: tpl.name || "Template",
                subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
                preview_url: previewUrl,
                atsFriendly: tpl.ats_friendly ?? true,
                description: tpl.description || "Professional resume template",
                category: tpl.category || "modern"
              };
            });
          logger.info("Templates transformed:", transformedTemplates.length, transformedTemplates);
          setTemplates(transformedTemplates);
        }
      } catch (error) {
        logger.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (previewTemplate) {
      const fallback = DOMAIN_FAMILY_IMAGES[previewTemplate.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE;
      const resolved = resolveTemplateImageUrl(previewTemplate.preview_url);
      setPreviewImgSrc(resolved !== FALLBACK_TEMPLATE_IMAGE ? resolved : fallback);
    }
  }, [previewTemplate]);

  // ✅ Handle template click for instant preview
  const handleTemplateClick = (tpl: TransformedTemplate) => {
    // Update selected template immediately for live preview
    setSelectedTemplate(tpl.template_id);
    setAppliedTemplateId(null);
    logger.info("Template selected for preview:", tpl.template_id);

    // Also open the modal for more details
    setPreviewTemplate(tpl);
  };

  // Apply template to resume via API
  const handleApplyTemplate = async () => {
    if (previewTemplate) {
      try {
        // ✅ Get resume ID from prop instead of localStorage
        if (!resumeId) {
          toast.error("No resume found. Please create a resume first.");
          return;
        }

        // ✅ Validate templateId (mongoId contains the 'id' from API response)
        let templateId = previewTemplate.mongoId;
        if (!templateId || templateId === "0") {
          logger.error("Invalid template ID:", previewTemplate);
          toast.error("Template ID is not available. Please try refreshing the page.");
          return;
        }

        // Safety-net: if the stored ID is a synthetic "familyId-levelIdx" composite
        // (e.g. "4-1") from the browse-templates flow, resolve the real backend ID
        // just-in-time by fetching all templates and matching on domain_family + name.
        if (/^\d+-\d+$/.test(templateId) && previewTemplate.category === 'career-level') {
          try {
            const domainFamily = previewTemplate.domain_family;
            const allTemplates = await getTemplatesByCategory();
            const familyTemplates = allTemplates.filter(
              t => ((t as unknown) as Record<string, unknown>).domain_family === domainFamily
            );
            const previewName = (previewTemplate.name || '').toLowerCase();
            const match = familyTemplates.find(t => {
              const apiName = (t.name || '').toLowerCase();
              if (previewName.includes('early') && previewName.includes('career'))
                return apiName.includes('early') && apiName.includes('career');
              if (previewName.includes('senior')) return apiName.includes('senior');
              if (previewName.includes('lead')) return apiName.includes('lead');
              if (previewName.includes('mid')) return apiName.includes('mid');
              if (previewName.includes('manager')) return apiName.includes('manager');
              if (previewName.includes('fresher')) return apiName.includes('fresher');
              return false;
            });
            const resolvedId = match ? String(match.id || '') || match._id || '' : '';
            if (resolvedId) {
              templateId = resolvedId;
              logger.info('Resolved synthetic template ID', previewTemplate.mongoId, '→', resolvedId);
            } else {
              logger.warn('Could not resolve template ID for', previewTemplate.name, '— proceeding with stored value');
            }
          } catch (resolveErr) {
            logger.warn('Failed to resolve template ID, proceeding with stored value:', resolveErr);
          }
        }

        // Enhanced resumes use the dedicated export pipeline. Applying them to
        // the normal-resume endpoint changes a different record, leaving the
        // ATS preview and enhanced export out of sync. The selected backend
        // ID is persisted below and is supplied directly to enhanced export.
        if (!isEnhancedResume) {
          await applyTemplateToResume(resumeId, templateId);
        }

        // Only set selectedTemplate for regular templates (not career level)
        if (previewTemplate.category !== 'career-level') {
          setSelectedTemplate(previewTemplate.template_id);
          setAppliedTemplateId(null); // Clear career level template selection

          // Clear career level template data from localStorage to prevent interference
          const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
          const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
          localStorage.removeItem(selectedTemplateKey);
          localStorage.removeItem(careerLevelKey);
          localStorage.removeItem('selected_catalogue');
          setCareerLevelData(null);

          if (isEnhancedResume) {
            // An ATS workspace may be opened for several enhanced resumes in the
            // same browser. This value must be scoped to the enhanced-resume ID;
            // a user-scoped key made one resume's export use another resume's
            // previously selected backend template.
            localStorage.setItem(`enhancedTemplateBackendId_${resumeId}`, templateId);
            localStorage.setItem(`enhancedTemplateDisplayId_${resumeId}`, previewTemplate.template_id);
          } else {
            // Mark that the user explicitly applied a catalogue/style template.
            const styleKey = userEmail ? `user_chose_style_${userEmail}` : 'user_chose_style';
            localStorage.setItem(styleKey, 'true');
            const styleBackendKey = userEmail ? `styleTemplateBackendId_${userEmail}` : 'styleTemplateBackendId';
            localStorage.setItem(styleBackendKey, templateId);
            // Persist the chosen style id so the migration can detect it on future mounts
            // (selectedTemplateId is removed above, so a separate key is needed)
            if (userEmail) localStorage.setItem(`styleTemplateApplied_${userEmail}`, previewTemplate.template_id);
          }

          // Sync resumeStyle with the backend's template config so preview matches download
          const templateDefaults = TEMPLATE_DEFAULT_STYLES[previewTemplate.template_id];
          if (templateDefaults) {
            setResumeStyle(prev => ({ ...prev, ...templateDefaults }));
          }

          // Apply catalogue if selected
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
        } else {
          // For career level templates, clear selectedTemplate to avoid highlighting other templates
          setSelectedTemplate(null);
          setAppliedTemplateId(previewTemplate.id);

          // Persist career level template selection to localStorage
          const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
          localStorage.setItem(selectedTemplateKey, previewTemplate.id);

          // Extract and store section order from backend template config
          const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';

          // Preserve current sections to restore user-added extras later
          const currentSectionOrder = sectionOrder;

          // First, detect career level from template name
          const templateName = previewTemplate.name || '';
          let careerLevel: string | undefined;
          const nameStr = templateName.toLowerCase();
          if (nameStr.includes('early') && nameStr.includes('career')) {
            careerLevel = 'early career';
          } else if (nameStr.includes('fresher')) {
            careerLevel = 'fresher';
          } else if (nameStr.includes('architect')) {
            careerLevel = 'architect';
          } else if (nameStr.includes('manager')) {
            careerLevel = 'manager';
          } else if (nameStr.includes('lead')) {
            careerLevel = 'lead';
          } else if (nameStr.includes('senior')) {
            careerLevel = 'senior-level';
          } else if (nameStr.includes('mid')) {
            careerLevel = 'mid-level';
          }

          let newSectionOrder: string[] = [];

          // Try to get section order from template's sections config
          if (previewTemplate.sections) {
            newSectionOrder = getSectionOrderFromTemplate(previewTemplate.sections);
          }

          // Fallback to domain/career level logic if template doesn't have sections
          if (newSectionOrder.length === 0) {
            const correctDomainFamily = previewTemplate.domain_family;
            newSectionOrder = getSectionOrderByDomainAndCareer(correctDomainFamily, careerLevel);
          }

          // Add career-level specific sections (e.g., Internships for Freshers)
          newSectionOrder = addCareerLevelSections(newSectionOrder, careerLevel);

          // Preserve only custom sections (not sections from old or new template).
          // Get old template's sections from stored domain, compute what it had, and filter those out.
          const oldDomainFamily = typeof window !== 'undefined' ? localStorage.getItem(`domainFamily_${userEmail}`) : null;
          const oldTemplateOrder = oldDomainFamily ? getDomainSectionOrder(oldDomainFamily) : [];
          const newOrderSet = new Set(newSectionOrder);
          const oldOrderSet = new Set(oldTemplateOrder);
          const preservedExtras = currentSectionOrder.filter(
            name => !oldOrderSet.has(name) && !newOrderSet.has(name)
          );
          const finalOrder = [...newSectionOrder, ...preservedExtras];

          // Store section order
          if (finalOrder.length > 0) {
            localStorage.setItem(sectionOrderKey, JSON.stringify(finalOrder));
            setSectionOrder(finalOrder);
            logger.info('Stored sectionOrder from career-level template with preserved extras:', finalOrder);
          }

          // Clear style-template flags — domain templates take over
          const styleKey = userEmail ? `user_chose_style_${userEmail}` : 'user_chose_style';
          localStorage.removeItem(styleKey);
          const styleBackendKey = userEmail ? `styleTemplateBackendId_${userEmail}` : 'styleTemplateBackendId';
          localStorage.removeItem(styleBackendKey);
          if (userEmail) localStorage.removeItem(`styleTemplateApplied_${userEmail}`);
        }

        setPreviewTemplate(null);

        if (onTemplateSelect) onTemplateSelect();

        toast.success(`${previewTemplate.name} applied successfully!`);
      } catch (error) {
        logger.error("Error applying template:", error);
        toast.error(error instanceof Error ? error.message : "Failed to apply template");
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-8 mb-4 relative">
        <button
          onClick={() => setActivePanel("templates")}
          className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${activePanel === "templates"
            ? "bg-blue-50 text-[#2557a7] border-blue-200"
            : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
            }`}
        >
          Templates
        </button>

        <button
          onClick={() => setActivePanel("style")}
          className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${activePanel === "style"
            ? "bg-blue-50 text-[#2557a7] border-blue-200"
            : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
            }`}
        >
          Style
        </button>
      </div>

      {activePanel === "templates" ? (
        <div>
          {/* Career Level Templates Display */}
          {careerLevelData && careerLevelData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Career Level Templates for Your Selection</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {careerLevelData.map((careerTpl, index) => {
                  // Match by template name AND ID for safety
                  const isSelected = (appliedTemplateId === careerTpl.id || appliedTemplateId === String(careerTpl.id)) && careerTpl.name;
                  const _n = (careerTpl.name || '').toLowerCase();
                  const detected = detectCareerLevelUtil(_n);
                  const careerLevel = detected
                    ? detected.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : ((_n.includes('early') && _n.includes('career')) ? 'Early Career' :
                      _n.includes('mid') ? 'Mid-Level' : 'Custom');
                  const familyImage = DOMAIN_FAMILY_IMAGES[careerTpl.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE;
                  const cardImgSrc = careerTpl.preview_url
                    ? resolveTemplateImageUrl(careerTpl.preview_url)
                    : familyImage;
                  return (
                    <div
                      key={`career-${careerTpl.id}-${index}`}
                      onClick={async () => {
                        setAppliedTemplateId(careerTpl.id);
                        setSelectedTemplate(null);

                        // Clear style-template flags — domain template now active
                        const _styleKey = userEmail ? `user_chose_style_${userEmail}` : 'user_chose_style';
                        localStorage.removeItem(_styleKey);
                        const _styleBackendKey = userEmail ? `styleTemplateBackendId_${userEmail}` : 'styleTemplateBackendId';
                        localStorage.removeItem(_styleBackendKey);
                        if (userEmail) localStorage.removeItem(`styleTemplateApplied_${userEmail}`);

                        // ✅ Update sectionOrder in localStorage AND context when career level changes
                        try {
                          // Use index-based careerLevel (already correctly set above from the
                          // careerLevels array) — avoids relying on backend template name keywords
                          // which may not match expected strings like 'fresher'/'mid'/'senior'.
                          const newSectionOrder = getSectionOrderByDomainAndCareer(careerTpl.domain_family, careerLevel);
                          // Use localStorage.getItem('userEmail') directly — same source as ResumeContext's polling
                          // and ResumeSide.handleAddSection, so the key always matches.
                          const _lsEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
                          const sectionOrderKey = _lsEmail ? `sectionOrder_${_lsEmail}` : 'sectionOrder';
                          const domainFamilyKey = _lsEmail ? `domainFamily_${_lsEmail}` : 'domainFamily';

                          // Preserve only custom sections (not sections from old or new template).
                          // Get old template's sections and filter those out along with new template sections.
                          const oldDomainFamily = _lsEmail ? localStorage.getItem(`domainFamily_${_lsEmail}`) : null;
                          const oldTemplateOrder = oldDomainFamily ? getDomainSectionOrder(oldDomainFamily) : [];
                          const newOrderSet = new Set(newSectionOrder);
                          const oldOrderSet = new Set(oldTemplateOrder);
                          const preservedExtras = sectionOrder.filter(
                            name => !oldOrderSet.has(name) && !newOrderSet.has(name)
                          );
                          const finalOrder = [...newSectionOrder, ...preservedExtras];

                          // Write to localStorage FIRST so that ResumeContext's useEffect([selectedTemplate])
                          // reads the correct finalOrder when setSelectedTemplate(null) triggers it below.
                          localStorage.setItem(sectionOrderKey, JSON.stringify(finalOrder));
                          localStorage.setItem(domainFamilyKey, careerTpl.domain_family || '');
                          setSectionOrder(finalOrder);

                          logger.info('Updated sectionOrder for career level:', careerLevel, 'domain:', careerTpl.domain_family, 'Order:', newSectionOrder);
                        } catch (err) {
                          logger.warn('Error updating sectionOrder:', err);
                        }

                        // Fetch full template details including preview HTML/CSS
                        try {
                          const fullTemplate = await getTemplateById(careerTpl.id);

                          // Open preview modal with full template data
                          const previewData: TransformedTemplate = {
                            id: fullTemplate.id?.toString() || fullTemplate._id || careerTpl.id,
                            mongoId: fullTemplate.id?.toString() || fullTemplate._id || careerTpl.id,
                            template_id: fullTemplate.template_id || careerTpl.id,
                            name: fullTemplate.name || careerTpl.name,
                            subtitle: fullTemplate.subtitle || careerTpl.subtitle || 'Template',
                            preview_url: fullTemplate.preview_url || careerTpl.preview_url,
                            atsFriendly: fullTemplate.ats_friendly ?? careerTpl.ats_friendly ?? true,
                            description: fullTemplate.description || careerTpl.description || 'Professional resume template',
                            category: 'career-level',
                            domain_family: careerTpl.domain_family,
                            domain_display_name: careerTpl.domain_display_name,
                            preview_html: fullTemplate.preview_html,
                            preview_css: fullTemplate.preview_css,
                            sections: ((fullTemplate as unknown) as Record<string, unknown>).sections as Record<string, Record<string, unknown>> | undefined,
                          };
                          setPreviewTemplate(previewData);
                          logger.info('Career level template with full details:', fullTemplate.name, 'Has preview:', !!fullTemplate.preview_html);
                        } catch (err) {
                          logger.error('Failed to fetch full template details:', err);
                          // Fallback to basic preview data if fetch fails
                          const previewData: TransformedTemplate = {
                            id: careerTpl.id,
                            mongoId: careerTpl.id,
                            template_id: careerTpl.id,
                            name: careerTpl.name,
                            subtitle: careerTpl.subtitle || 'Template',
                            preview_url: careerTpl.preview_url,
                            atsFriendly: careerTpl.ats_friendly ?? true,
                            description: careerTpl.description || 'Professional resume template',
                            category: 'career-level',
                            domain_family: careerTpl.domain_family,
                            domain_display_name: careerTpl.domain_display_name
                          };
                          setPreviewTemplate(previewData);
                        }
                      }}
                      className={`relative flex flex-col items-center rounded-lg shadow-sm border transition-all duration-200 cursor-pointer ${isSelected
                        ? "border-[#2557a7]"
                        : "border-gray-200 hover:shadow-md"
                        } bg-white overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 pointer-events-none">
                        <div className="bg-linear-to-r from-blue-500 to-blue-700 text-white font-bold px-3 py-1 rounded-tr-xl rounded-bl-xl shadow-lg flex items-center gap-1.5 text-[10px] backdrop-blur-sm border-l border-b border-white/30">
                          <Star className="w-3 h-3 fill-white text-white" />
                          <span className="text-[10px]">100% ATS</span>
                        </div>
                      </div>
                      <div className="w-full h-44 mt-6 bg-gray-100 pointer-events-none">
                        <TemplatePreviewRenderer
                          previewHtml={careerTpl.preview_html}
                          previewCss={careerTpl.preview_css}
                          fallbackImage={cardImgSrc}
                          errorFallbackImage={familyImage}
                          title={careerLevel}
                          width="100%"
                          height="100%"
                          scale={0.35}
                          hideScroll={true}
                          fillContainer={true}
                        />
                      </div>
                      <div className="w-full px-2 py-2 flex flex-col items-center">
                        <p className="text-xs font-semibold text-gray-700 text-center">
                          {(() => {
                            const templateName = careerTpl.name || '';
                            const nameStr = templateName.toLowerCase();

                            let careerLevel = '';
                            const nameStrLower = nameStr.toLowerCase();
                            const detectedLevel = detectCareerLevelUtil(nameStrLower);
                            if (detectedLevel) {
                              careerLevel = detectedLevel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            } else if (nameStrLower.includes('early') && nameStrLower.includes('career')) {
                              careerLevel = 'Early Career';
                            } else if (nameStrLower.includes('mid')) {
                              careerLevel = 'Mid-Level';
                            }

                            if (careerLevel && careerTpl.domain_display_name) {
                              return `${careerTpl.domain_display_name} ${careerLevel} Template`;
                            }

                            return careerTpl.domain_display_name || careerTpl.name;
                          })()}
                        </p>
                        {isSelected && (
                          <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No career-level data: the user chose a style template (user_chose_style_<email>),
              or auto-populate / parsing failed. careerLevelData stays null in those cases, so
              show the general template grid instead of a spinner that never resolves. */}
          {(!careerLevelData || careerLevelData.length === 0) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
              {templates.length > 0 ? (
                templates.map((tpl) => (
                  <div
                    key={tpl.template_id}
                    onClick={() => handleTemplateClick(tpl)}
                    className={`relative flex flex-col items-center rounded-lg shadow-sm border ${String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
                      } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
                  >
                    {tpl.atsFriendly && (
                      <div className="absolute top-0 right-0 pointer-events-none">
                        <div className="bg-linear-to-r from-blue-500 to-blue-700 text-white font-bold px-3 rounded-tr-xl rounded-bl-xl shadow-lg flex items-center gap-1.5 text-[10px] backdrop-blur-sm border-l border-b border-white/30">
                          <Star className="w-3 h-3 fill-white text-white" />
                          <span className='text-[10px]'>100% ATS</span>
                        </div>
                      </div>
                    )}
                    <Image
                      src={tpl.preview_url}
                      alt={`template-${tpl.template_id}`}
                      width={160}
                      height={200}
                      className="w-full h-44 mt-6 object-contain bg-gray-100"
                    />
                    <div className="w-full px-2 py-2 flex flex-col items-center">
                      <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
                      {String(selectedTemplate) === tpl.template_id && (
                        <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
                      )}
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Loading templates...</p>
                  </div>
                </div>
              ) : (
                <div className="col-span-2 text-sm text-gray-500 text-center py-8">
                  No templates found
                </div>
              )}
            </div>
          )}

          {/* More Templates Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (resumeId) params.set("resumeId", resumeId);
                if (source) params.set("source", source);
                const qs = params.toString();
                router.push(`/templates${qs ? `?${qs}` : ''}`);
              }}
              className="px-6 py-2.5 bg-[#2557a7] hover:bg-[#1f4e98] text-white font-semibold cursor-pointer rounded-lg transition-all duration-200 text-sm"
            >
              Browse More Templates
            </button>
          </div>
        </div>
      ) : (
        <CatalogueTab />
      )}

      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 bg-gray-100 overflow-hidden">
                <div className="bg-white w-full h-full">
                  <TemplatePreviewRenderer
                    previewHtml={previewTemplate.preview_html}
                    previewCss={previewTemplate.preview_css}
                    fallbackImage={previewImgSrc || FALLBACK_TEMPLATE_IMAGE}
                    errorFallbackImage={DOMAIN_FAMILY_IMAGES[previewTemplate.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE}
                    title={previewTemplate.name}
                    width="100%"
                    height="100%"
                    scale={0.9}
                    hideScroll={false}
                    fillContainer={false}
                  />
                </div>
              </div>

              <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {(() => {
                        const careerLevel = getCareerLevel(previewTemplate);
                        if (careerLevel && careerLevel !== 'Custom') {
                          return `${previewTemplate.domain_display_name || 'Resume'} ${careerLevel} Template`;
                        }
                        return previewTemplate.name;
                      })()}
                    </h3>
                    {previewTemplate.atsFriendly && (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        ✓ 100% ATS Friendly
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Template Details</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 flex items-start gap-2">
                        <div className="bg-gray-100 rounded-md p-1.5 shrink-0">
                          <CircleCheck className="w-3 h-3 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500 font-semibold">ATS</div>
                          <div className="text-xs font-bold text-gray-700">Optimized</div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 flex items-start gap-2">
                        <div className="bg-gray-100 rounded-md p-1.5 shrink-0">
                          <Medal className="w-3 h-3 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500 font-semibold">Career Level</div>
                          <div className="text-xs font-bold text-gray-700">
                            {getCareerLevel(previewTemplate)}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 flex items-start gap-2">
                        <div className="bg-gray-100 rounded-md p-1.5 shrink-0">
                          <Briefcase className="w-3 h-3 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500 font-semibold">Experience</div>
                          <div className="text-xs font-bold text-gray-700">
                            {((previewTemplate as unknown as Record<string, unknown>).experience_years as string) || '0-2'} yrs
                          </div>
                        </div>
                      </div>
                      {previewTemplate.domain_display_name && (
                        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 flex items-start gap-2">
                          <div className="bg-gray-100 rounded-md p-1.5 shrink-0">
                            <Building2 className="w-3 h-3 text-black" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-500 font-semibold">Domain</div>
                            <div className="text-xs font-bold text-gray-700 truncate">{previewTemplate.domain_display_name}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Why Choose This Template</h4>
                    <ul className="space-y-1.5">
                      {(() => {
                        const description = previewTemplate.description;
                        const sentences = description
                          .split('. ')
                          .slice(0, 3)
                          .map((sentence) => sentence.trim().replace(/\.$/, ''));

                        return sentences.map((sentence, index) => (
                          <li key={index} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                            <span>{sentence}.</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Best Suited For</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block bg-white border border-gray-300 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700">
                        {(() => {
                          const level = getCareerLevel(previewTemplate);
                          if (level === 'Fresher') return 'Fresher candidates';
                          if (level === 'Early Career') return 'Early career professionals';
                          return `${level} professionals`;
                        })()}
                      </span>
                      <span className="inline-block bg-white border border-gray-300 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700">
                        {((previewTemplate as unknown as Record<string, unknown>).experience_years as string) || '0-2'} years experience
                      </span>
                      {previewTemplate.domain_display_name && (
                        <span className="inline-block bg-white border border-gray-300 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 truncate">
                          {previewTemplate.domain_display_name} roles
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleApplyTemplate}
                      className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Apply This Template
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesTab;
