"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getTemplatesByCategory, applyTemplateToResume, getTemplateCategories, TemplateResponse } from "@/api/resumeApi";
import { toast } from "sonner";
import logger from "@/lib/logger";
import { TEMPLATE_DEFAULT_STYLES, STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueTab from "./CatalogueTab";
import { getProfile } from "@/api/userApi";
import { useRouter } from "next/navigation";
import { getSectionOrderByDomainAndCareer } from "@/app/(resume)/templates/_utils/domainSectionOrder";
import { DOMAIN_FAMILY_IMAGES, FALLBACK_TEMPLATE_IMAGE } from "@/app/(resume)/templates/_constants/templateImages";
import { resolveTemplateImageUrl } from "@/lib/imageUtils";

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
}

// Default templates using MongoDB _ids
const DEFAULT_TEMPLATES: TransformedTemplate[] = [
  {
    id: "compact_professional",
    mongoId: "698c12085d07f07c24604031",
    template_id: "compact_professional",
    name: "Compact Professional",
    subtitle: "Modern",
    preview_url: "/assets/templates/template-1.png",
    atsFriendly: true,
    description: "Clean and modern design perfect for tech professionals",
    category: "modern"
  },
  {
    id: "clean_simple",
    mongoId: "698c12085d07f07c24604033",
    template_id: "clean_simple",
    name: "Clean Simple",
    subtitle: "Minimalist",
    preview_url: "/assets/templates/template-2.png",
    atsFriendly: true,
    description: "Traditional professional layout for corporate roles",
    category: "minimalist"
  },
  {
    id: "minimalist_classic",
    mongoId: "69bcda650380c25aee737346",
    template_id: "classic_horizontal_dividers",
    name: "Classic Horizontal Dividers",
    subtitle: "Modern",
    preview_url: "/assets/templates/template-3.png",
    atsFriendly: true,
    description: "Modern professional resume with horizontal line dividers",
    category: "modern"
  },
  {
    id: "professional_classic",
    mongoId: "697ca4b084d83306028ce5b0",
    template_id: "classic_professional",
    name: "Classic Professional",
    subtitle: "Professional",
    preview_url: "/assets/templates/template-4.png",
    atsFriendly: true,
    description: "Clean professional layout with left-aligned header, strong section dividers, and structured single-column format",
    category: "professional"
  },
  {
    id: "classic_professional",
    mongoId: "698b4219fb7a5d9a92ce520a",
    template_id: "classic_professional_variant",
    name: "Classic Professional",
    subtitle: "Professional",
    preview_url: "/assets/templates/template-4.png",
    atsFriendly: true,
    description: "Clean professional layout with left-aligned header, strong section dividers, and structured single-column format",
    category: "professional"
  }
];

interface TemplatesTabProps {
  onTemplateSelect?: () => void;
  resumeId?: string;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect, resumeId }) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
  const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
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
  }> | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [careerImgErrors, setCareerImgErrors] = useState<Record<string, boolean>>({});
  const [previewImgSrc, setPreviewImgSrc] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { selectedTemplate, setSelectedTemplate, setResumeStyle, setSectionOrder, sectionOrder } = useResume();

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
        }>;
        logger.info('Career level templates loaded from storage:');
        careerLevels.forEach((tpl, idx) => {
          logger.info(`  [${idx}] ${tpl.name} (id: ${tpl.id})`);
        });
        setCareerLevelData(careerLevels);
      } catch (err) {
        logger.error('Failed to parse career level templates', err);
        setCareerLevelData(null);
      }
    } else {
      setCareerLevelData(null);
      logger.info('⚠ No career level data found in localStorage');
    }
  }, [userEmail, setSelectedTemplate]);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        logger.info("Fetching templates for category:", selectedCategory);

        // Normalize category name (handle case sensitivity and spaces)
        let categoryParam: string | undefined;
        if (selectedCategory === "All") {
          categoryParam = undefined;
        } else {
          // Convert to lowercase and remove extra spaces
          categoryParam = selectedCategory.toLowerCase().trim();
        }

        logger.info("API call with category param:", categoryParam);
        const data = await getTemplatesByCategory(categoryParam);

        logger.info("Templates fetched from API:", data?.length || 0, data);

        if (data && Array.isArray(data) && data.length > 0) {
          // ✅ Map template_id to correct image paths
          const templateImageMap: Record<string, string> = {
            'compact_professional': '/assets/templates/template-1.png',
            'clean_simple': '/assets/templates/template-2.png',
            'minimalist_classic': '/assets/templates/template-3.png',
            'professional_classic': '/assets/templates/template-4.png',
            'classic_professional': '/assets/templates/template-4.png',
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
        } else {
          logger.warn("No templates returned from API for category:", selectedCategory);
          // Only use defaults if category is "All", otherwise show empty
          if (selectedCategory === "All") {
            setTemplates(DEFAULT_TEMPLATES);
          } else {
            setTemplates([]);
          }
        }
      } catch (error) {
        logger.error("Error fetching templates:", error);
        toast.error("Failed to load templates from API. Using default templates.");
        setTemplates(DEFAULT_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [selectedCategory]);

  const filteredTemplates = templates.filter((tpl) => {
    const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) || tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // ✅ Fetch categories when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      const fetchCategories = async () => {
        try {
          setCategoriesLoading(true);
          const fetchedCategories = await getTemplateCategories();
          logger.info("Fetched categories from API (lowercase):", fetchedCategories);

          // Capitalize categories for display (convert "professional" -> "Professional")
          const capitalizedCategories = fetchedCategories.map(cat =>
            cat.charAt(0).toUpperCase() + cat.slice(1)
          );

          // Add "All" at the beginning if not already present
          const categoriesWithAll = capitalizedCategories.includes("All")
            ? capitalizedCategories
            : ["All", ...capitalizedCategories];

          logger.info("Categories for display (capitalized):", categoriesWithAll);
          setCategories(categoriesWithAll);
        } catch (error) {
          logger.error("Error fetching categories:", error);
          // Fall back to default categories
          setCategories(["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))]);
        } finally {
          setCategoriesLoading(false);
        }
      };
      fetchCategories();
    }
  }, [dropdownOpen, templates]);

  useEffect(() => {
    if (previewTemplate) {
      const fallback = DOMAIN_FAMILY_IMAGES[previewTemplate.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE;
      const resolved = resolveTemplateImageUrl(previewTemplate.preview_url);
      setPreviewImgSrc(resolved !== FALLBACK_TEMPLATE_IMAGE ? resolved : fallback);
    }
  }, [previewTemplate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              if (previewName.includes('lead'))   return apiName.includes('lead');
              if (previewName.includes('mid'))    return apiName.includes('mid');
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

        // ✅ CORRECTED: Pass 'id' from templates list API response as template_id
        await applyTemplateToResume(resumeId, templateId);

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
      {activePanel === "templates" && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
          />
        </div>
      )}

      <div className="flex items-center gap-8 mb-4 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setActivePanel("templates");
            }}
            className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${activePanel === "templates"
              ? "bg-blue-50 text-[#2557a7] border-blue-200"
              : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
              }`}
          >
            {selectedCategory} ▼
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
              {categoriesLoading ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-[#2557a7] border-t-transparent rounded-full"></div>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      logger.info("Category selected:", cat);
                      setSelectedCategory(cat);
                      setDropdownOpen(false);
                      setActivePanel("templates");
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
                      }`}
                  >
                    {cat}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setActivePanel("style");
            setDropdownOpen(false);
          }}
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
                  const careerLevels = ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Lead', 'Manager'];
                  const careerLevel = careerLevels[index] || 'Custom';
                  const familyImage = DOMAIN_FAMILY_IMAGES[careerTpl.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE;
                  const cardImgSrc = !careerImgErrors[careerTpl.id] && careerTpl.preview_url
                    ? resolveTemplateImageUrl(careerTpl.preview_url)
                    : familyImage;
                  return (
                    <div
                      key={`career-${careerTpl.id}-${index}`}
                      onClick={() => {
                        setAppliedTemplateId(careerTpl.id);
                        setSelectedTemplate(null);

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

                          // Preserve any extra sections the user had added before switching template.
                          // Read from context (sectionOrder) — always up-to-date, avoids stale localStorage reads.
                          const addableExtras = new Set(['Achievements', 'Publications', 'Volunteering', 'Awards', 'Hobbies', 'Interests', 'Languages', 'References']);
                          const newOrderSet = new Set(newSectionOrder);
                          const preservedExtras = sectionOrder.filter(name => addableExtras.has(name) && !newOrderSet.has(name));
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

                        // Open preview modal for career level template
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
                        logger.info('Career level template selected:', careerTpl.name, 'ID:', careerTpl.id);
                      }}
                      className={`relative flex flex-col items-center rounded-lg shadow-sm border transition-all duration-200 cursor-pointer ${isSelected
                        ? "border-[#2557a7]"
                        : "border-gray-200 hover:shadow-md"
                        } bg-white overflow-hidden`}
                    >
                      <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
                        100% ATS Friendly
                      </span>
                      <Image
                        src={cardImgSrc}
                        alt={careerLevel}
                        width={160}
                        height={200}
                        className="w-full h-44 mt-6 object-contain bg-gray-100"
                        onError={() => setCareerImgErrors(prev => ({ ...prev, [careerTpl.id]: true }))}
                      />
                      <div className="w-full px-2 py-2 flex flex-col items-center">
                        <p className="text-xs font-semibold text-gray-700 text-center">
                          {(() => {
                            const templateName = careerTpl.name || '';
                            const nameStr = templateName.toLowerCase();

                            let careerLevel = '';
                            if (nameStr.includes('early') && nameStr.includes('career')) {
                              careerLevel = 'Early Career';
                            } else if (nameStr.includes('fresher')) {
                              careerLevel = 'Fresher';
                            } else if (nameStr.includes('manager')) {
                              careerLevel = 'Manager';
                            } else if (nameStr.includes('lead')) {
                              careerLevel = 'Lead';
                            } else if (nameStr.includes('senior')) {
                              careerLevel = 'Senior-Level';
                            } else if (nameStr.includes('mid')) {
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

          {(!careerLevelData || careerLevelData.length === 0) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
              {loading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Loading templates...</p>
                  </div>
                </div>
              ) : filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.template_id}
                    onClick={() => handleTemplateClick(tpl)}
                    className={`relative flex flex-col items-center rounded-lg shadow-sm border ${String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
                      } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
                  >
                    {tpl.atsFriendly && (
                      <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
                        100% ATS Friendly
                      </span>
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
              ) : (
                <div className="col-span-2 text-sm text-gray-500 text-center py-8">
                  No templates found for &quot;{selectedCategory}&quot;
                </div>
              )}
            </div>
          )}

          {/* More Templates Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/templates')}
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
              <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
                  <Image
                    src={previewImgSrc || FALLBACK_TEMPLATE_IMAGE}
                    alt={previewTemplate.name}
                    width={600}
                    height={800}
                    className="w-full h-auto object-contain"
                    onError={() => {
                      const fallback = DOMAIN_FAMILY_IMAGES[previewTemplate.domain_family || ''] || FALLBACK_TEMPLATE_IMAGE;
                      setPreviewImgSrc(fallback);
                    }}
                  />
                </div>
              </div>

              <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {(() => {
                        if (previewTemplate.category !== 'career-level') {
                          return previewTemplate.name;
                        }

                        const templateName = previewTemplate.name || '';
                        const nameStr = templateName.toLowerCase();

                        let careerLevel = '';
                        if (nameStr.includes('early') && nameStr.includes('career')) {
                          careerLevel = 'Early Career';
                        } else if (nameStr.includes('fresher')) {
                          careerLevel = 'Fresher';
                        } else if (nameStr.includes('manager')) {
                          careerLevel = 'Manager';
                        } else if (nameStr.includes('lead')) {
                          careerLevel = 'Lead';
                        } else if (nameStr.includes('senior')) {
                          careerLevel = 'Senior-Level';
                        } else if (nameStr.includes('mid')) {
                          careerLevel = 'Mid-Level';
                        }

                        if (careerLevel && previewTemplate.domain_display_name) {
                          return `${previewTemplate.domain_display_name} ${careerLevel} Template`;
                        }

                        return previewTemplate.domain_display_name || previewTemplate.name;
                      })()}
                    </h3>
                    {previewTemplate.atsFriendly && (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        ✓ 100% ATS Friendly
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{previewTemplate.description}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Professional layout</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Easy to customize</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>ATS optimized</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Print friendly</span>
                      </li>
                    </ul>
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