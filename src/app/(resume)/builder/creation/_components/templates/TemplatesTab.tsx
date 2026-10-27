"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getTemplatesByCategory, applyTemplateToResume, getTemplateCategories, getTemplateById, TemplateResponse } from "@/api/resumeApi";
import { toast } from "sonner";
import logger from "@/lib/logger";
import { TEMPLATE_DEFAULT_STYLES, STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueTab from "./CatalogueTab";
import SectionOrderPanel from "./SectionOrderPanel";
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
  /** Sections in their current order; with onReorderSections this enables the "Section Order" tab. */
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

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect, resumeId, isEnhancedResume = false, sections, onReorderSections }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [activePanel, setActivePanel] = useState<"templates" | "style" | "order">("templates");
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

  // The career-level card open in the preview: it is selected (section order, domain, style flags) only when applied
  const pendingCareerSelectRef = useRef<{ id: string; select: () => string[] | undefined } | null>(null);
  // One apply at a time: a second click while one runs would apply twice and build the section order on stale state
  const applyingRef = useRef(false);

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
    // Preview only: the template is selected (and shown as applied) when Apply Template succeeds
    pendingCareerSelectRef.current = null;
    logger.info("Template selected for preview:", tpl.template_id);

    // Also open the modal for more details
    setPreviewTemplate(tpl);
  };

  // Apply template to resume via API
  const handleApplyTemplate = async (templateToApply?: TransformedTemplate, selectCareerCard?: () => string[] | undefined, guardHeld = false) => {
    // The one open in the preview, or the card whose Apply Template button was pressed
    const target = templateToApply ?? previewTemplate;
    if (target) {
      if (applyingRef.current && !guardHeld) return;
      applyingRef.current = true;
      try {
        // ✅ Get resume ID from prop instead of localStorage
        if (!resumeId) {
          toast.error("No resume found. Please create a resume first.");
          return;
        }

        // ✅ Validate templateId (mongoId contains the 'id' from API response)
        let templateId = target.mongoId;
        if (!templateId || templateId === "0") {
          logger.error("Invalid template ID:", target);
          toast.error("Template ID is not available. Please try refreshing the page.");
          return;
        }

        // Safety-net: if the stored ID is a synthetic "familyId-levelIdx" composite
        // (e.g. "4-1") from the browse-templates flow, resolve the real backend ID
        // just-in-time by fetching all templates and matching on domain_family + name.
        if (/^\d+-\d+$/.test(templateId) && target.category === 'career-level') {
          try {
            const domainFamily = target.domain_family;
            const allTemplates = await getTemplatesByCategory();
            const familyTemplates = allTemplates.filter(
              t => ((t as unknown) as Record<string, unknown>).domain_family === domainFamily
            );
            const previewName = (target.name || '').toLowerCase();
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
              logger.info('Resolved synthetic template ID', target.mongoId, '→', resolvedId);
            } else {
              logger.warn('Could not resolve template ID for', target.name, '— proceeding with stored value');
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

        // Applied: now select the career-level card (from its Apply Template button, or the one open in the preview)
        const selectCard = selectCareerCard
          ?? (!templateToApply && pendingCareerSelectRef.current?.id === target.id ? pendingCareerSelectRef.current.select : undefined);
        pendingCareerSelectRef.current = null;
        const selectedCardOrder = selectCard?.();

        // Only set selectedTemplate for regular templates (not career level)
        if (target.category !== 'career-level') {
          setSelectedTemplate(target.template_id);
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
            localStorage.setItem(`enhancedTemplateDisplayId_${resumeId}`, target.template_id);
          } else {
            // Mark that the user explicitly applied a catalogue/style template.
            const styleKey = userEmail ? `user_chose_style_${userEmail}` : 'user_chose_style';
            localStorage.setItem(styleKey, 'true');
            const styleBackendKey = userEmail ? `styleTemplateBackendId_${userEmail}` : 'styleTemplateBackendId';
            localStorage.setItem(styleBackendKey, templateId);
            // Persist the chosen style id so the migration can detect it on future mounts
            // (selectedTemplateId is removed above, so a separate key is needed)
            if (userEmail) localStorage.setItem(`styleTemplateApplied_${userEmail}`, target.template_id);
          }

          // Sync resumeStyle with the backend's template config so preview matches download
          const templateDefaults = TEMPLATE_DEFAULT_STYLES[target.template_id];
          if (templateDefaults) {
            // Applying a template means this template's own look: drop the accent colour a style card or a
            // Color Theme pick left on the style (the plain templates colour their headings with
            // accentColor || headingColor, so a stale accent would hide the template's own heading colour).
            setResumeStyle(prev => ({ ...prev, ...templateDefaults, accentColor: undefined, sectionHeaderBg: undefined }));
          }

          // Apply catalogue if selected
          const selectedCatalogue = typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') : null;
          if (selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue]) {
            setResumeStyle(prev => ({ ...prev, ...STYLE_CATALOGUES[selectedCatalogue].style }));
          }
        } else {
          // For career level templates, clear selectedTemplate to avoid highlighting other templates
          setSelectedTemplate(null);
          setAppliedTemplateId(target.id);

          // A style (catalogue) picked earlier is laid over whatever template is active: its fonts, colours and
          // heading layout in the preview, and its catalogue id in the export. Applying a template means this
          // template's own look, so drop that overlay; the user's own font and spacing choices are kept.
          localStorage.removeItem('selected_catalogue');
          localStorage.removeItem('selected_section_bg');
          setResumeStyle(prev => ({
            ...prev,
            fontFamily: localStorage.getItem('selected_font') || 'arial',
            lineSpacing: localStorage.getItem('selected_density') || '1.0',
            headingColor: '#1A1A1A',
            bodyColor: '#4b5563',
            // a style template's own sizes (TEMPLATE_DEFAULT_STYLES) would stay in the preview; the builder defaults
            nameFontSize: '20px',
            headingFontSize: '14px',
            bodyFontSize: '10px',
            accentColor: undefined,
            sectionHeaderBg: undefined,
          }));

          // Persist career level template selection to localStorage
          const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
          localStorage.setItem(selectedTemplateKey, target.id);

          // Extract and store section order from backend template config
          const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';

          // Preserve current sections to restore user-added extras later
          const currentSectionOrder = selectedCardOrder ?? sectionOrder;

          // First, detect career level from template name
          const templateName = target.name || '';
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
          if (target.sections) {
            newSectionOrder = getSectionOrderFromTemplate(target.sections);
          }

          // Fallback to domain/career level logic if template doesn't have sections
          if (newSectionOrder.length === 0) {
            const correctDomainFamily = target.domain_family;
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

        toast.success(`${target.name} applied successfully!`);
      } catch (error) {
        logger.error("Error applying template:", error);
        toast.error(error instanceof Error ? error.message : "Failed to apply template");
      } finally {
        applyingRef.current = false;
      }
    }
  };

  return (
    <>
      <div aria-label="Customize" className="mb-3 flex border-b border-[#d5deec]">
        {([
          ["templates", "Templates"],
          ["style", "Style & Layout"],
          ...(sections && onReorderSections ? ([["order", "Section Order"]] as const) : []),
        ] as ReadonlyArray<readonly ["templates" | "style" | "order", string]>).map(([panel, label]) => (
          <button
            key={panel}
            type="button"
            aria-current={activePanel === panel ? "page" : undefined}
            onClick={() => setActivePanel(panel)}
            className={`relative flex-1 px-3 py-2.5 text-[13px] font-medium transition-colors ${
              activePanel === panel ? "text-[#1d4fa8]" : "text-gray-700 hover:text-[#1d4fa8]"
            }`}
          >
            {label}
            {activePanel === panel && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1d4fa8]" />}
          </button>
        ))}
      </div>

      {activePanel === "order" && sections && onReorderSections ? (
        <SectionOrderPanel sections={sections} onReorder={onReorderSections} />
      ) : activePanel === "templates" ? (
        <div className="rounded-xl border border-[#e3e9f2] bg-white p-4">
          <h3 className="text-[16px] font-bold text-gray-900">Choose ATS Template</h3>
          <p className="mt-0.5 mb-4 text-[13px] text-gray-600">Select a template that fits your style and profession. You can customize it anytime.</p>

          {/* Career Level Templates Display */}
          {careerLevelData && careerLevelData.length > 0 && (
            <div className="mb-8">
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
                  // Preview: open the preview; the card is selected only if it is then applied there.
                  // Apply Template: apply it straight away, and select it once that has worked.
                  const openCard = async (applyAfter = false) => {
                    if (applyAfter) {
                      if (applyingRef.current) return;
                      applyingRef.current = true; // held through the fetch below; handleApplyTemplate releases it
                    }
                    const showOrApply = (data: TransformedTemplate) => {
                      if (applyAfter) {
                        void handleApplyTemplate(data, selectCard, true);
                      } else {
                        pendingCareerSelectRef.current = { id: data.id, select: selectCard };
                        setPreviewTemplate(data);
                      }
                    };
                    // Returns the new section order, which the apply step builds on
                    const selectCard = (): string[] | undefined => {
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
                        return finalOrder;
                      } catch (err) {
                        logger.warn('Error updating sectionOrder:', err);
                        return undefined;
                      }
                    };

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
                        showOrApply(previewData);
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
                        showOrApply(previewData);
                      }
                  };
                  const cardName = (() => {
                    const nameStr = (careerTpl.name || '').toLowerCase();
                    const detectedLevel = detectCareerLevelUtil(nameStr);
                    let level = '';
                    if (detectedLevel) {
                      level = detectedLevel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    } else if (nameStr.includes('early') && nameStr.includes('career')) {
                      level = 'Early Career';
                    } else if (nameStr.includes('mid')) {
                      level = 'Mid-Level';
                    }
                    if (level && careerTpl.domain_display_name) return `${careerTpl.domain_display_name} ${level} Template`;
                    return careerTpl.domain_display_name || careerTpl.name;
                  })();

                  return (
                    <div
                      key={`career-${careerTpl.id}-${index}`}
                      className={`relative flex flex-col overflow-hidden rounded-xl bg-white transition-shadow ${isSelected
                        ? "border-2 border-[#1d4fa8]"
                        : "border border-[#e3e9f2] hover:shadow-md"}`}
                    >
                      <div className="absolute top-0 right-0 z-10 pointer-events-none">
                        <div className="bg-linear-to-r from-blue-500 to-blue-700 text-white font-bold px-3 py-1 rounded-tr-xl rounded-bl-xl shadow-lg text-[11px]">
                          100%
                        </div>
                      </div>
                      <div className="m-2 mb-0 h-40 overflow-hidden rounded-lg border border-[#e3e9f2] bg-white pointer-events-none">
                        <TemplatePreviewRenderer
                          previewHtml={careerTpl.preview_html}
                          previewCss={careerTpl.preview_css}
                          fallbackImage={cardImgSrc}
                          errorFallbackImage={familyImage}
                          title={careerLevel}
                          width="100%"
                          height="100%"
                          scale={0.34}
                          hideScroll={true}
                          fillContainer={true}
                          flush
                        />
                      </div>
                      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                        <p className="text-[14px] font-bold leading-snug text-gray-900">{cardName}</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void openCard(false)}
                            className="flex-1 rounded-lg border border-[#d5deec] bg-white whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-gray-900 transition hover:bg-gray-50"
                          >
                            Preview
                          </button>
                          {isSelected ? (
                            <span className="flex flex-1 items-center justify-center rounded-lg bg-[#e6eefb] whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-[#1d4fa8]">
                              Applied ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void openCard(true)}
                              className="flex-1 rounded-lg bg-[#1d4fa8] whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-white transition hover:bg-[#173f86]"
                            >
                              Apply Template
                            </button>
                          )}
                        </div>
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
                templates.map((tpl) => {
                  const isApplied = String(selectedTemplate) === tpl.template_id;
                  return (
                    <div
                      key={tpl.template_id}
                      className={`relative flex flex-col overflow-hidden rounded-xl bg-white transition-shadow ${isApplied
                        ? "border-2 border-[#1d4fa8]"
                        : "border border-[#e3e9f2] hover:shadow-md"}`}
                    >
                      {tpl.atsFriendly && (
                        <div className="absolute top-0 right-0 z-10 pointer-events-none">
                          <div className="bg-linear-to-r from-blue-500 to-blue-700 text-white font-bold px-3 py-1 rounded-tr-xl rounded-bl-xl shadow-lg text-[11px]">
                            100%
                          </div>
                        </div>
                      )}
                      <Image
                        src={tpl.preview_url}
                        alt={`template-${tpl.template_id}`}
                        width={160}
                        height={200}
                        className="m-2 mb-0 h-40 w-[calc(100%-1rem)] rounded-lg border border-[#e3e9f2] bg-white object-cover object-top"
                      />
                      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                        <p className="text-[14px] font-bold leading-snug text-gray-900">{tpl.subtitle || tpl.name}</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleTemplateClick(tpl)}
                            className="flex-1 rounded-lg border border-[#d5deec] bg-white whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-gray-900 transition hover:bg-gray-50"
                          >
                            Preview
                          </button>
                          {isApplied ? (
                            <span className="flex flex-1 items-center justify-center rounded-lg bg-[#e6eefb] whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-[#1d4fa8]">
                              Applied ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleApplyTemplate(tpl)}
                              className="flex-1 rounded-lg bg-[#1d4fa8] whitespace-nowrap px-1.5 py-1 text-[12px] font-semibold text-white transition hover:bg-[#173f86]"
                            >
                              Apply Template
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Template Preview"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title: "Creative Edge — UI/UX Designer / Creative Professional" */}
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e9f2] px-5 py-3.5">
              <h2 className="min-w-0 truncate text-[16px] font-bold text-gray-900">
                {(() => {
                  const careerLevel = getCareerLevel(previewTemplate);
                  const title = careerLevel && careerLevel !== 'Custom'
                    ? `${previewTemplate.domain_display_name || 'Resume'} ${careerLevel} Template`
                    : previewTemplate.name;
                  return previewTemplate.subtitle && previewTemplate.subtitle !== title && previewTemplate.subtitle.toLowerCase() !== 'template'
                    ? `${title} — ${previewTemplate.subtitle}`
                    : title;
                })()}
              </h2>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreviewTemplate(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d5deec] text-gray-700 transition hover:bg-gray-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* The template, rendered with sample content, scrolling inside */}
            <div className="min-h-0 flex-1 bg-white px-5 py-4">
              <div className="mx-auto h-[66vh] w-full overflow-hidden rounded-md border border-[#e3e9f2]">
                <TemplatePreviewRenderer
                  previewHtml={previewTemplate.preview_html}
                  previewCss={previewTemplate.preview_css}
                  fallbackImage={previewImgSrc || FALLBACK_TEMPLATE_IMAGE}
                  errorFallbackImage={DOMAIN_FAMILY_IMAGES[previewTemplate.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE}
                  title={previewTemplate.name}
                  width="100%"
                  height="100%"
                  scale={0.95}
                  hideScroll={false}
                  fillContainer={false}
                  flush
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e3e9f2] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg border border-[#d5deec] bg-white px-5 py-2 text-[14px] font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleApplyTemplate()}
                className="rounded-lg bg-[#1d4fa8] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#173f86]"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesTab;
