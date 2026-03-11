"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Sparkles } from "lucide-react";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplate?: string;
}

const templates = [
  {
    id: "apollo",
    name: "Modern",
    component: "TemplateOne",
    description: "Teal accent headers, left-aligned with pipe-separated contact",
    badge: null,
  },
  {
    id: "atlas",
    name: "Classic",
    component: "TemplateTwo",
    description: "Traditional serif style with verbose professional labels",
    badge: "Popular",
  },
  {
    id: "terra",
    name: "Minimal",
    component: "TemplateThree",
    description: "Centered elegant layout with bullet-separated contact",
    badge: null,
  },
  {
    id: "tempe",
    name: "Creative",
    component: "TemplateFour",
    description: "Centered clean design with clear section divisions",
    badge: "Modern",
  },
  {
    id: "classic_professional",
    name: "Executive",
    component: "TemplateFive",
    description: "Left-aligned executive style with labeled skill groups",
    badge: null,
  },
];

export default function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplate = "apollo",
}: TemplateSelectionModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>(currentTemplate);

  useEffect(() => {
    setSelectedTemplate(currentTemplate);
  }, [currentTemplate]);

  if (!isOpen) return null;

  const handleSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApply = () => {
    onSelectTemplate(selectedTemplate);
    onClose();
  };

  // Apollo (Modern) - compact_professional: teal, LEFT name, contact below pipe-separated
  const ApolloPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-6 text-[8px] leading-tight text-left">
      <div className="mb-2">
        <div className="font-bold text-[14px] mb-1" style={{ color: "#0D9488" }}>YOUR NAME</div>
        <div className="text-[7px] flex flex-wrap gap-x-1 mb-2" style={{ color: "#374151" }}>
          <span>your.email@example.com</span><span>|</span>
          <span>+1 234 567 8900</span><span>|</span>
          <span>City, State</span><span>|</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
        <div className="border-t-2 border-gray-700" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-11/12" />
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1.5 bg-gray-400 rounded w-1/3" />
            <div className="h-1 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-1/4 mb-0.5" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>SKILLS</div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-1 h-1 rounded-full mr-1" style={{ background: "#0D9488" }} />
              <div className="h-1 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-1.5">
        <div className="font-bold text-[9px] mb-1 pb-0.5" style={{ color: "#0D9488", borderBottom: "1.5px solid #0D9488" }}>EDUCATION</div>
        <div className="flex justify-between">
          <div>
            <div className="h-1.5 bg-gray-400 rounded w-24 mb-0.5" />
            <div className="h-1 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-14" />
        </div>
      </div>
    </div>
  );

  // Atlas (Classic) - professional_classic: LEFT name, border-b headings, verbose labels
  const AtlasPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-6 text-[8px] leading-tight text-left">
      <div className="mb-2">
        <div className="font-bold text-[14px] mb-1 uppercase tracking-wide">YOUR NAME</div>
        <div className="text-[7px] flex flex-wrap gap-x-1 mb-2" style={{ color: "#374151" }}>
          <span>your.email@example.com</span><span>|</span>
          <span>+1 234 567 8900</span><span>|</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
        <div className="border-t-2 border-gray-900" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[8px] mb-1 border-b border-gray-800 pb-0.5 uppercase">PROFESSIONAL SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-11/12" />
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[8px] mb-1 border-b border-gray-800 pb-0.5 uppercase">PROFESSIONAL EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div>
              <div className="h-1.5 bg-gray-400 rounded w-20 mb-0.5" />
              <div className="h-1 bg-gray-300 rounded w-16" />
            </div>
            <div className="h-1 bg-gray-300 rounded w-12" />
          </div>
          <div className="space-y-0.5 mt-1">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[8px] mb-1 border-b border-gray-800 pb-0.5 uppercase">EDUCATION</div>
        <div className="flex justify-between">
          <div>
            <div className="h-1.5 bg-gray-400 rounded w-24 mb-0.5" />
            <div className="h-1 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-14" />
        </div>
      </div>

      <div className="mb-1.5">
        <div className="font-bold text-[8px] mb-1 border-b border-gray-800 pb-0.5 uppercase">TECHNICAL SKILLS</div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-10/12" />
        </div>
      </div>
    </div>
  );

  // Terra (Minimal) - minimalist_classic: CENTERED name, bullet separator, line-decorated headings
  const TerraPreview = () => (
    <div className="aspect-[8.5/11] bg-white p-6 text-[8px] leading-tight">
      <div className="text-center mb-2">
        <div className="font-bold text-[14px] mb-1 uppercase">YOUR NAME</div>
        <div className="text-[7px] flex items-center justify-center flex-wrap gap-x-1 mb-2" style={{ color: "#374151" }}>
          <span>your.email@example.com</span><span>•</span>
          <span>+1 234 567 8900</span><span>•</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
        <div className="border-t border-gray-400" />
      </div>

      <div className="mb-2">
        <div className="flex items-center mb-1">
          <div className="font-bold text-[9px] uppercase mr-2">SUMMARY</div>
          <div className="flex-1 border-t border-gray-400" />
        </div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-11/12" />
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center mb-1">
          <div className="font-bold text-[9px] uppercase mr-2">WORK EXPERIENCE</div>
          <div className="flex-1 border-t border-gray-400" />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1.5 bg-gray-400 rounded w-1/4" />
            <div className="h-1 bg-gray-300 rounded w-1/5" />
          </div>
          <div className="h-1.5 bg-gray-400 rounded w-1/3 mb-0.5" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center mb-1">
          <div className="font-bold text-[9px] uppercase mr-2">EDUCATION</div>
          <div className="flex-1 border-t border-gray-400" />
        </div>
        <div className="flex justify-between">
          <div>
            <div className="h-1.5 bg-gray-400 rounded w-24 mb-0.5" />
            <div className="h-1 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-14" />
        </div>
      </div>

      <div className="mb-1.5">
        <div className="flex items-center mb-1">
          <div className="font-bold text-[9px] uppercase mr-2">SKILLS</div>
          <div className="flex-1 border-t border-gray-400" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-[6px]">
              <div className="h-1 bg-gray-400 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Tempe (Creative) - clean_simple: CENTERED name, pipe separator
  const TempePreview = () => (
    <div className="aspect-[8.5/11] bg-white p-6 text-[8px] leading-tight">
      <div className="text-center mb-2">
        <div className="font-bold text-[14px] mb-1 uppercase">YOUR NAME</div>
        <div className="text-[7px] flex items-center justify-center flex-wrap gap-x-1 mb-2" style={{ color: "#374151" }}>
          <span>your.email@example.com</span><span>|</span>
          <span>+1 234 567 8900</span><span>|</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
        <div className="border-t-2 border-gray-800" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 uppercase">SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-11/12" />
        </div>
        <div className="border-t border-gray-400 mt-1.5" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 uppercase">WORK EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1.5 bg-gray-400 rounded w-1/3" />
            <div className="h-1 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="h-1.5 bg-gray-400 rounded w-1/4 mb-0.5" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
        <div className="border-t border-gray-400 mt-1.5" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 uppercase">EDUCATION</div>
        <div className="flex justify-between">
          <div>
            <div className="h-1.5 bg-gray-400 rounded w-24 mb-0.5" />
            <div className="h-1 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-14" />
        </div>
        <div className="border-t border-gray-400 mt-1.5" />
      </div>

      <div className="mb-1.5">
        <div className="font-bold text-[9px] mb-1 uppercase">SKILLS</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-1 h-1 bg-gray-600 rounded-full mr-1" />
              <div className="h-1 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Classic Professional (Executive) - classic_professional: LEFT name, pipe contact, labeled skill groups
  const ExecutivePreview = () => (
    <div className="aspect-[8.5/11] bg-white p-6 text-[8px] leading-tight text-left">
      <div className="mb-2">
        <div className="font-bold text-[14px] mb-1 uppercase tracking-wide">YOUR NAME</div>
        <div className="text-[7px] flex flex-wrap gap-x-1 mb-2" style={{ color: "#374151" }}>
          <span>your.email@example.com</span><span>|</span>
          <span>+1 234 567 8900</span><span>|</span>
          <span className="text-blue-600">LinkedIn</span>
        </div>
        <div className="border-t-2 border-gray-900" />
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5 uppercase border-b border-gray-600">SUMMARY</div>
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-300 rounded" />
          <div className="h-1 bg-gray-300 rounded w-11/12" />
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5 uppercase border-b border-gray-600">EXPERIENCE</div>
        <div>
          <div className="flex justify-between mb-0.5">
            <div className="h-1.5 bg-gray-400 rounded w-1/3" />
            <div className="h-1 bg-gray-300 rounded w-1/6" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-1/4 mb-0.5" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="font-bold text-[9px] mb-1 pb-0.5 uppercase border-b border-gray-600">EDUCATION</div>
        <div className="flex justify-between">
          <div>
            <div className="h-1.5 bg-gray-400 rounded w-24 mb-0.5" />
            <div className="h-1 bg-gray-300 rounded w-20" />
          </div>
          <div className="h-1 bg-gray-300 rounded w-14" />
        </div>
      </div>

      <div className="mb-1.5">
        <div className="font-bold text-[9px] mb-1 pb-0.5 uppercase border-b border-gray-600">SKILLS</div>
        <div className="space-y-0.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1 bg-gray-500 rounded w-10" />
              <span style={{ fontSize: "6px" }}>:</span>
              <div className="h-1 bg-gray-300 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TemplatePreview = ({
    template,
  }: {
    template: (typeof templates)[number];
  }) => {
    const isSelected = selectedTemplate === template.id;

    return (
      <button
        onClick={() => handleSelect(template.id)}
        className={`relative group transition-all duration-300 ${
          isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
        }`}
      >
        <div
          className={`bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
            isSelected
              ? "ring-4 ring-blue-500 shadow-2xl"
              : "ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-200 hover:shadow-xl"
          }`}
        >
          {/* Badge */}
          {template.badge && (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                {template.badge}
              </span>
            </div>
          )}

          {/* Preview */}
          <div className="relative bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {template.id === "apollo" && <ApolloPreview />}
              {template.id === "atlas" && <AtlasPreview />}
              {template.id === "terra" && <TerraPreview />}
              {template.id === "tempe" && <TempePreview />}
              {template.id === "classic_professional" && <ExecutivePreview />}
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-6 right-6 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white z-10">
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Template Info */}
          <div className="bg-white px-5 py-4 text-center border-t border-gray-100">
            <h4 className="font-bold text-gray-900 text-lg mb-1.5">
              {template.name}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[92vh] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-10 py-8 border-b border-gray-200">
            <button
              onClick={onClose}
              className="absolute right-8 top-8 p-2.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <div className="pr-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Choose Your Template
              </h2>
              <p className="text-gray-600 text-lg">
                Select a professional template optimized for ATS systems and
                recruiter readability
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <div className="grid grid-cols-3 gap-8 mb-8">
              {templates.slice(0, 3).map((template) => (
                <TemplatePreview key={template.id} template={template} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
              {templates.slice(3).map((template) => (
                <TemplatePreview key={template.id} template={template} />
              ))}
            </div>

            {/* Coming Soon Section */}
            <div className="pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      More Templates Coming Soon
                    </h3>
                    <p className="text-base text-gray-600">
                      We're crafting additional professional templates to give you
                      even more options to stand out
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-10 py-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-semibold text-gray-900">
                  {templates.find((t) => t.id === selectedTemplate)?.name}
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-all border-2 border-gray-300 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
