"use client";
import React, { useState } from "react";
import { SidebarOpen } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";

import Tabs from "./Tabs";
import EditorTab from "../editor/EditorTab";
import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
import AIReviewTab from "../aiReview/AIReviewTab";

// Import section components
import PersonalInfo from "../editor/sections/PersonalInfo";
import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
import Education from "../editor/sections/Education";
import WorkExperience from "../editor/sections/WorkExperience";
import Projects from "../editor/sections/Projects";
import Skills from "../editor/sections/Skills";
import Certifications from "../editor/sections/Certifications";
import Achievements from "../editor/sections/Achievements";
import Volunteering from "../editor/sections/Volunteering";
import References from "../editor/sections/References";
import Internships from "../editor/sections/Internships";
import Awards from "../editor/sections/Awards";
import { initialSections } from "../../_utils/sectionsConfig";
interface SectionProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (fieldKey: string, value: string) => void;
  onBlur: (fieldKey: string, value: string) => void;
}
const sectionComponents: Record<string, React.FC<SectionProps>> = {
  "Personal Info": PersonalInfo,
  "Professional Summary": ProfessionalSummary,
  Education,
  "Work Experience": WorkExperience,
  Projects,
  Skills,
  Certifications,
  Achievements,
  Volunteering,
  References,
  Internships,
  Awards,
};
const ResumeSide: React.FC = () => {
  const [sections, setSections] = useState(initialSections);
  const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
    { name: "Achievements", ai: true },
    { name: "Volunteering", ai: false },
    { name: "References", ai: false },
    { name: "Internships", ai: true },
    { name: "Awards", ai: false },
  ]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  // Sidebar toggle
  const [isOpen, setIsOpen] = useState(true);
  // Tabs
  const [activeTab, setActiveTab] = useState("Editor");
  // ✅ Handle section reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...sections];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSections(items);
  };
  const handleDeleteSection = (index: number) => {
    const removed = sections[index];
    setSections((prev) => prev.filter((_, i) => i !== index));
    setExtraSections((prev) => [...prev, removed]);
    if (activeSection === index) setActiveSection(null);
  };
  const handleAddSection = (section: { name: string; ai: boolean }) => {
    setSections((prev) => [...prev, section]);
    setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
  };
 const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const handleBlur = (key: string, value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };
  return (
    <div
      className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
        ${isOpen ? "w-[25%] px-3" : "w-12 p-0"}
      `}
    >
      {/* Tabs only if sidebar open */}
      {isOpen && (
        <Tabs
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      {/* Scrollable content below Tabs */}
      {isOpen && (
        <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
          {activeTab === "Editor" && (
            <EditorTab
              sections={sections}
              extraSections={extraSections}
              activeSection={activeSection}
              formData={formData}
              errors={errors}
              sectionComponents={sectionComponents}
              handleDeleteSection={handleDeleteSection}
              handleAddSection={handleAddSection}
              handleChange={handleChange}
              handleBlur={handleBlur}
              setActiveSection={setActiveSection}
              handleDragEnd={handleDragEnd} // ✅ Added this prop properly
            />
          )}

          {activeTab === "ResumeGPT" && <ResumeGPTTab />}
          {activeTab === "AI Review" && <AIReviewTab />}
        </div>
      )}
      {/* Floating Sidebar Open button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-2 p-2 bg-white text-orange-500 rounded shadow hover:bg-white-500"
        >
          <SidebarOpen size={20} />
        </button>
      )}
    </div>
  );
};
export default ResumeSide;










