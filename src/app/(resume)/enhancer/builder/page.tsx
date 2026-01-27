"use client";

import React, { useEffect, useState } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import ResumeTemplate from "../_components/ResumeTemplate";
import SectionEditorModal from "../_components/SectionEditorModal";
import ExportModal from "../_components/ExportModal";
import type { Improvement } from "@/api/enhancerApi";
import { updateEnhancedResume } from "@/api/enhancerApi";

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
] as const;

export default function BuilderPage() {
  const router = useRouter();

  const {
    resumeData,
    enabledSections,
    setEnabledSections,
    activeSection,
    setActiveSection,
    selectedTemplate,
    setSelectedTemplate,
  } = useResume();

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "sections" | "ai">(
    "ai"
  );
  const [enhancedId, setEnhancedId] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<{ total_score?: number; score_improvement?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load real AI improvements from session storage (generated during upload)
  const [improvements, setImprovements] = useState<Improvement[]>([]);

  useEffect(() => {
    if (!resumeData) router.push("/enhancer");
  }, [resumeData, router]);

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
  }, []);

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

  // Download handlers removed - now using backend endpoints via ExportModal

  // Map improvement category/section to SectionName for editor
  const mapSuggestionToSection = (suggestion: typeof improvements[0]): SectionName | null => {
    // Check if suggestion has a specific section field
    if (suggestion.section) {
      const sectionMap: Record<string, SectionName> = {
        'contact': 'PersonalInfo',
        'summary': 'Summary',
        'experience': 'Experience',
        'skills': 'Skills',
        'education': 'Education',
        'projects': 'Projects',
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
      };
      return sectionMap[suggestion.section.toLowerCase()] || null;
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

    return null;
  };

  const handleAcceptSuggestion = (suggestion: typeof improvements[0]) => {
    const section = mapSuggestionToSection(suggestion);

    // Check if this is a LinkedIn or GitHub suggestion
    const title = suggestion.title?.toLowerCase() || '';

    if (title.includes('linkedin') || title.includes('github')) {
      // Open PersonalInfo editor for LinkedIn/GitHub suggestions
      setActiveSection('PersonalInfo');
      return;
    }

    if (section) {
      // Enable the section if it's not already enabled
      if (!enabledSections.includes(section)) {
        setEnabledSections(prev => [...prev, section]);
      }

      // Open the section editor
      setActiveSection(section);

      // Switch to sections tab to show the change
      setActiveTab('sections');
    } else {
      // If we can't map to a specific section, just show a message
      console.log('Cannot determine which section to edit for:', suggestion.title);
      alert('Please manually edit the relevant section to apply this suggestion.');
    }
  };

  const handleIgnoreSuggestion = (suggestionId: string) => {
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
      // Map frontend workExperience to backend experience format
      const experienceData = (resumeData.workExperience || []).map((exp) => ({
        company: exp.company,
        role: exp.role,
        duration: exp.duration,
        years: exp.years || 0,
        location: exp.location,
        client: exp.client,
        key_contributions: exp.description ? exp.description.split('\n').filter((line: string) => line.trim()) : [],
      }));

      // Save all resume edits to backend before export
      // Update BOTH llm_data.experience AND top-level experience
      // Backend merges enhanced_sections into enhanced_data
      await updateEnhancedResume(enhancedId, {
        enhanced_sections: {
          llm_data: {
            experience: experienceData,
          },
          experience: experienceData, // Also update top-level for export
        }
      });

      console.log('✅ Resume saved to backend before export');
      setIsExportModalOpen(true);
    } catch (error) {
      console.error('Failed to save resume:', error);
      alert('Failed to save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!resumeData) return null;

  // Format improvements for display (convert to suggestion format)
  const suggestions = improvements.slice(0, 10).map((imp) => ({
    id: imp.id,
    original: imp.before || 'Current text',
    improved: imp.after || 'Improved text',
    reason: imp.description || imp.title,
    impact: imp.impact,
    impact_points: imp.impact_points,
    // Keep original for mapping
    _original: imp,
  }));

  /* ================= TEMPLATE PREVIEWS ================= */
  const ApolloPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="flex justify-between items-start mb-1.5">
        <div className="font-bold text-[10px]">YOUR NAME</div>
        <div className="text-right text-[5px] space-y-0.5">
          <div>+1 234 567 8900</div>
          <div>email@example.com</div>
          <div>City, State</div>
          <div className="text-blue-600">LinkedIn</div>
        </div>
      </div>
      <div className="border-t-2 border-gray-800 mb-1.5"></div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-1">SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded"></div>
          <div className="h-0.5 bg-gray-300 rounded w-11/12"></div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-1">SKILLS</div>
        <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full mr-0.5" />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-1">EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/3" />
            <div className="h-0.5 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="h-0.5 bg-gray-300 rounded w-1/4 mb-0.5" />
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-1">EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
    </div>
  );

  const AtlasPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="text-center mb-1.5">
        <div className="font-bold text-[10px] mb-0.5">YOUR NAME</div>
        <div className="text-[5px] flex items-center justify-center flex-wrap gap-x-0.5">
          <span>email@example.com</span>
          <span>|</span>
          <span>+1 234 567 8900</span>
          <span>|</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 border-b border-gray-500 pb-0.5">
          SUMMARY
        </div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded"></div>
          <div className="h-0.5 bg-gray-300 rounded w-11/12"></div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5 border-b border-gray-500 pb-0.5">
          EXPERIENCE
        </div>
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
        <div className="font-bold text-[7px] mb-0.5 border-b border-gray-500 pb-0.5">
          EDUCATION
        </div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-0.5 border-b border-gray-500 pb-0.5">
          SKILLS
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full mr-0.5" />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TerraPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="mb-1.5">
        <div className="font-bold text-[10px] mb-0.5">YOUR NAME</div>
        <div className="text-[5px] flex flex-wrap gap-x-0.5">
          <span>email@example.com</span>
          <span>|</span>
          <span>+1 234 567 8900</span>
          <span>|</span>
          <span className="text-blue-600">linkedin.com/in/you</span>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px]">SUMMARY</div>
          <div className="flex-1 border-t border-gray-400 ml-1" />
        </div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px]">SKILLS</div>
          <div className="flex-1 border-t border-gray-400 ml-1" />
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full mr-0.5" />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px]">EXPERIENCE</div>
          <div className="flex-1 border-t border-gray-400 ml-1" />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1 bg-gray-400 rounded w-1/4" />
            <div className="h-0.5 bg-gray-300 rounded w-1/5" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
      <div className="mb-1">
        <div className="flex items-center mb-0.5">
          <div className="font-bold text-[7px]">EDUCATION</div>
          <div className="flex-1 border-t border-gray-400 ml-1" />
        </div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
    </div>
  );

  const TempePreview = () => (
    <div className="aspect-[8.5/11] bg-white p-4 text-[6px] leading-tight">
      <div className="mb-1.5">
        <div className="font-bold text-[10px] mb-0.5">YOUR NAME</div>
        <div className="text-[5px] grid grid-cols-2 gap-x-2">
          <div className="space-y-0.5">
            <div>email@example.com</div>
            <div>City, State</div>
          </div>
          <div className="space-y-0.5">
            <div>+1 234 567 8900</div>
            <div className="text-blue-600">LinkedIn</div>
          </div>
        </div>
      </div>
      <div className="border-t-2 border-gray-800 mb-1.5" />
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5">SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-0.5 bg-gray-300 rounded" />
          <div className="h-0.5 bg-gray-300 rounded w-11/12" />
        </div>
      </div>
      <div className="mb-1.5">
        <div className="font-bold text-[7px] mb-0.5">EXPERIENCE</div>
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
        <div className="font-bold text-[7px] mb-0.5">EDUCATION</div>
        <div className="flex justify-between">
          <div className="h-1 bg-gray-400 rounded w-20" />
          <div className="h-0.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="mb-1">
        <div className="font-bold text-[7px] mb-0.5">SKILLS</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-0.5 h-0.5 bg-gray-600 rounded-full mr-0.5" />
              <div className="h-0.5 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold pt-3">CareerBot</h1>
        </div>
      </header>

      <main className="pt-3 pb-6 px-6">
        <div className="bg-gray-100 rounded-3xl p-6 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6">
          {/* LEFT: RESUME PREVIEW */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Live Preview
                </h3>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md">
                  {SIDE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ??
                    "Modern"}{" "}
                  Template
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Active sections: {enabledSections.length}/{ALL_SECTIONS.length}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 flex justify-center flex-1 overflow-auto">
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-[780px]"
                style={{ minHeight: "1020px" }}
              >
                <ResumeTemplate
                  data={resumeData}
                  enabledSections={enabledSections}
                  editable
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
                      ? "bg-gray-200 text-gray-900 shadow-md"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab("sections")}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === "sections"
                      ? "bg-gray-200 text-gray-900 shadow-md"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sections
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`relative flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === "ai"
                      ? "bg-gray-200 text-gray-900 shadow-md"
                      : "bg-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  AI
                  {improvements.length > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                      {improvements.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* CONTENT CARD */}
            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              <div className="p-6 max-h-[calc(120vh-220px)] overflow-y-auto">
                {activeTab === "templates" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Choose Template
                    </h3>
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
                                ? "ring-2 ring-blue-500 shadow-lg scale-[1.02]"
                                : "hover:scale-[1.01] hover:shadow-md ring-1 ring-gray-200 hover:ring-blue-300"
                            }`}
                          >
                            <div className="bg-white border border-gray-100">
                              {template.id === "apollo" && <ApolloPreview />}
                              {template.id === "atlas" && <AtlasPreview />}
                              {template.id === "terra" && <TerraPreview />}
                              {template.id === "tempe" && <TempePreview />}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-blue-600 rounded-full p-1 shadow-lg">
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
                                ? "border-emerald-200 bg-emerald-50/80 backdrop-blur-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span className="text-base font-semibold text-gray-900 capitalize">
                                  {sectionName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleToggleSection(section)}
                                className={`relative w-14 h-8 rounded-full transition-all shadow-sm ${
                                  enabled ? "bg-emerald-500" : "bg-gray-300"
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
                          className="border-2 border-blue-200 bg-emerald-50/80 backdrop-blur-sm rounded-xl p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex gap-2 flex-1">
                              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-blue-700 font-medium leading-snug">
                                {s.reason}
                              </p>
                            </div>
                            {s.impact_points && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                s.impact === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : s.impact === 'medium'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                +{s.impact_points} pts
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 line-through mb-1.5 px-1 italic">
                            {s.original}
                          </p>

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
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button
                      onClick={handleContinueToExport}
                      disabled={isSaving}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-base hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
            setIsEditorModalOpen(false);
            setActiveSection(null);
          }}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          enhancedId={enhancedId || undefined}
          improvements={improvements}
          atsScore={atsScore || undefined}
        />
      </main>
    </div>
  );
}
