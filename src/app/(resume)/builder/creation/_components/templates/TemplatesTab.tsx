"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getTemplatesByCategory, applyTemplateToResume, getTemplateCategories, TemplateResponse } from "@/api/resumeApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

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
}

// Default templates using MongoDB _ids
const DEFAULT_TEMPLATES: TransformedTemplate[] = [
  {
    id: "compact_professional",
    mongoId: "6971ce1b4c0df89e108ce5b3",
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
    mongoId: "6971cbe74c0df89e108ce5b0",
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
    mongoId: "6971ccb34c0df89e108ce5b1",
    template_id: "minimalist_classic",
    name: "Minimalist Classic",
    subtitle: "Minimalist",
    preview_url: "/assets/templates/template-3.png",
    atsFriendly: true,
    description: "Clean and simple layout with understated elegance",
    category: "minimalist"
  },
  {
    id: "professional_classic",
    mongoId: "6971cd7c4c0df89e108ce5b2",
    template_id: "professional_classic",
    name: "Professional Classic",
    subtitle: "Professional",
    preview_url: "/assets/templates/template-4.png",
    atsFriendly: true,
    description: "Traditional layout ideal for corporate professionals",
    category: "professional"
  }
];

interface TemplatesTabProps {
  onTemplateSelect?: () => void;
  resumeId?: string;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect, resumeId }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
  const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

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
          const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => {
            return {
              id: tpl.id?.toString() || tpl.template_id || "0",
              // ✅ mongoId should contain the 'id' from API response for backend calls
              mongoId: tpl.id?.toString() || tpl._id || "0",
              template_id: tpl.template_id || tpl.id?.toString() || "0",
              name: tpl.name || "Template",
              subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
              preview_url: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
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
        const templateId = previewTemplate.mongoId;
        if (!templateId || templateId === "0") {
          logger.error("Invalid template ID:", previewTemplate);
          toast.error("Template ID is not available. Please try refreshing the page.");
          return;
        }

        // ✅ CORRECTED: Pass 'id' from templates list API response as template_id
        const result = await applyTemplateToResume(resumeId, templateId);

        // Keep the template selected for UI
        setSelectedTemplate(previewTemplate.template_id);
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
            className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
              activePanel === "templates"
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
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
                      selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
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
          className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
            activePanel === "style"
              ? "bg-blue-50 text-[#2557a7] border-blue-200"
              : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
          }`}
        >
          Style
        </button>
      </div>
      
      {activePanel === "templates" ? (
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
                className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
                  String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
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
      ) : (
        <div className="flex flex-col gap-4 text-gray-700">
          {/* Font Family */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
            <select
              value={resumeStyle.fontFamily}
              onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
            >
              <option value="times-new-roman">Times New Roman</option>
              <option value="arial">Arial</option>
              <option value="monospace">Monospace</option>                            
              <option value="calibri">Calibri</option>
            </select>
          </div>

          {/* Typography Scale */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
              Typography Scale
            </h4>        
            <div className="grid grid-cols-1 gap-3">
              {/* Name Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="20"
                    max="48"
                    value={parseInt(resumeStyle.nameFontSize) || 28}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.nameFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Heading Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={parseInt(resumeStyle.headingFontSize) || 18}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.headingFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Body Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="16"
                    value={parseInt(resumeStyle.bodyFontSize) || 12}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.bodyFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Formatting */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
            <div className="flex gap-2">
              <button
                onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  resumeStyle.bold 
                    ? "bg-blue-100 border-blue-300 text-blue-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                B
              </button>
              <button
                onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
                  resumeStyle.italic 
                    ? "bg-blue-100 border-blue-300 text-blue-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                I
              </button>
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={parseFloat(resumeStyle.lineSpacing) || 1.5}
                onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="text"
                value={resumeStyle.lineSpacing}
                onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
                className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tight</span>
              <span>Normal</span>
              <span>Loose</span>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
              Color Palette
            </h4>        
            <div className="grid grid-cols-1 gap-3">
              {/* Heading Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={resumeStyle.headingColor}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
                    className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={resumeStyle.headingColor}
                    placeholder="#000000"
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
                    <button
                      key={color}
                      style={{ backgroundColor: color }}
                      onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
                      className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
                    />
                  ))}
                </div>
              </div>

              {/* Body Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={resumeStyle.bodyColor}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                    className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={resumeStyle.bodyColor}
                    placeholder="#000000"
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
                      className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Inter, sans-serif',
                  nameFontSize: '32px',
                  headingFontSize: '18px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.5',
                  headingColor: '#1f2937',
                  bodyColor: '#374151'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Modern
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Playfair Display, serif',
                  nameFontSize: '36px',
                  headingFontSize: '20px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.6',
                  headingColor: '#0f172a',
                  bodyColor: '#1f2937'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Classic
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Roboto, sans-serif',
                  nameFontSize: '28px',
                  headingFontSize: '16px',
                  bodyFontSize: '13px',
                  lineSpacing: '1.4',
                  headingColor: '#1e40af',
                  bodyColor: '#374151'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Corporate
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Open Sans, sans-serif',
                  nameFontSize: '30px',
                  headingFontSize: '17px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.5',
                  headingColor: '#059669',
                  bodyColor: '#4b5563'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Creative
              </button>
            </div>
          </div>
        </div>
      )}
      
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
                  <Image
                    src={previewTemplate.preview_url}
                    alt={previewTemplate.name}
                    width={600}
                    height={800}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
              
              <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{previewTemplate.name}</h3>
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
