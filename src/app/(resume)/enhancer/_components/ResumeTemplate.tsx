// _components/ResumeTemplate.tsx
"use client";

import React from "react";
import { Edit3 } from "lucide-react";
import { useResume, type ResumeData, type SectionName } from "./ResumeContext";

import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import TemplateThree from "./templates/TemplateThree";
import TemplateFour from "./templates/TemplateFour";

interface ResumeTemplateProps {
  data: ResumeData;
  enabledSections: SectionName[];
  editable?: boolean; // true in builder mode
}

const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  data,
  enabledSections,
  editable = false,
}) => {
  const { selectedTemplate, setActiveSection } = useResume();

  if (!data) return null;

  const openSectionEditor = (section: SectionName) => {
    setActiveSection(section);
  };

  // Reusable wrapper for any section that should be editable
  const EditableSectionWrapper: React.FC<{
    section: SectionName;
    children: React.ReactNode;
  }> = ({ section, children }) => {
    if (!enabledSections.includes(section)) return null;

    return (
      <div className="relative group/section mb-10 last:mb-0">
        {/* Edit Pencil Icon - appears only on hover in editable mode */}
        {editable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openSectionEditor(section);
            }}
            className="absolute -top-8 right-0 opacity-0 group-hover/section:opacity-100 
                       transition-opacity duration-200 z-10
                       bg-white border border-gray-300 rounded-full p-2 shadow-lg
                       hover:bg-blue-50 hover:border-blue-500"
            aria-label={`Edit ${section}`}
            title={`Edit ${section}`}
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </button>
        )}

        {/* Section Content */}
        <div className="relative">{children}</div>
      </div>
    );
  };

  // Pass down the wrapper to all templates via context or props
  // We'll create a shared props interface
  const commonProps = {
    data,
    enabledSections,
    EditableSection: EditableSectionWrapper,
  };

  switch (selectedTemplate) {
    case "apollo":
      return <TemplateOne {...commonProps} />;
    case "atlas":
      return <TemplateTwo {...commonProps} />;
    case "terra":
      return <TemplateThree {...commonProps} />;
    case "tempe":
      return <TemplateFour {...commonProps} />;
    default:
      return <TemplateOne {...commonProps} />;
  }
};

export default ResumeTemplate;