// "use client";
// import React, { useState } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";

// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// // Import section components
// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";
// import { initialSections } from "../../_utils/sectionsConfig";
// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }
// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };
// const ResumeSide: React.FC = () => {
//   const [sections, setSections] = useState(initialSections);
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);
//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   // Sidebar toggle
//   const [isOpen, setIsOpen] = useState(true);
//   // Tabs
//   const [activeTab, setActiveTab] = useState("Editor");
//   // ✅ Handle section reordering
//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };
//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };
//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };
//  const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };
//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };
//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? "w-[50%] px-3" : "w-12 p-0"}
//       `}
//     >
//       {/* Tabs only if sidebar open */}
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//       )}
//       {/* Scrollable content below Tabs */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd} // ✅ Added this prop properly
//             />
//           )}

//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}
//       {/* Floating Sidebar Open button */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-2 bg-white text-orange-500 rounded shadow hover:bg-white-500"
//         >
//           <SidebarOpen size={20} />
//         </button>
//       )}
//     </div>
//   );
// };
// export default ResumeSide;








// "use client";
// import React, { useState } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";

// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// import ScoreTab from "../score/ScoreTab";
// import JobMatchTab from "../job/JobMatchTab";

// // Import section components
// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };

// const ResumeSide: React.FC = () => {
//   const [sections, setSections] = useState(initialSections);
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);

//   // Sidebar toggle
//   const [isOpen, setIsOpen] = useState(true);

//   // Tabs
//   const [activeTab, setActiveTab] = useState("Editor");

//   // ✅ Handle section reordering
//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? "w-[30%] px-3" : "w-12 p-0"}
//       `}
//     >
//       {/* Tabs only if sidebar open */}
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//       )}

//       {/* Scrollable content below Tabs */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//             />
//           )}

//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//           {activeTab === "Score" && <ScoreTab />}
//           {activeTab === "Job Match" && <JobMatchTab />}
//         </div>
//       )}

//       {/* Floating Sidebar Open button */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-2 bg-white text-orange-500 rounded shadow hover:bg-white-500"
//         >
//           <SidebarOpen size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide; before auto adjust resumeside


// "use client";
// import React, { useState } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";

// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// // import ScoreTab from "../score/ScoreTab";
// // import JobMatchTab from "../job/JobMatchTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean; // optional for safety
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ isTemplateSidebarOpen = true }) => {
//   const [sections, setSections] = useState(initialSections);
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // ✅ Adjust width dynamically
//   const dynamicWidth = isTemplateSidebarOpen ? "w-[28%]" : "w-[35%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//           {/* {activeTab === "Score" && <ScoreTab />}
//           {activeTab === "Job Match" && <JobMatchTab />} */}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-2 bg-white text-blue-500 rounded shadow hover:bg-white-500"
//         >
//           <SidebarOpen size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide;


// "use client";
// import React, { useState } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";

// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ isTemplateSidebarOpen = true }) => {
//   const [sections, setSections] = useState(initialSections);
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // ✅ Adjust width dynamically
//   const dynamicWidth = isTemplateSidebarOpen ? "w-[28%]" : "w-[35%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen} // ✅ passes prop
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide; before tick mark


// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ isTemplateSidebarOpen = true }) => {
//   const [sections, setSections] = useState(initialSections);
//   const { resumeData } = useResume();
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   // ✅ Completion tracking for each section
//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // ✅ Mandatory fields check logic per section
//   // useEffect(() => {
//   //   const newStatus: Record<string, boolean> = {};
//   //   console.log("Form Data:", formData);
//   //   console.log("Completion Status:", newStatus);

//   //   sections.forEach((section) => {
//   //     switch (section.name) {
//   //       case "Personal Info":
//   //         newStatus[section.name] =
//   //           !!formData.name &&
//   //           !!formData.email &&
//   //           !!formData.phone
//   //         break;
//   //       case "Professional Summary":
//   //         newStatus[section.name] = !!formData.professionalSummary;
//   //         break;
//   //       case "Education":
//   //         newStatus[section.name] =
//   //           !!formData.school && !!formData.degree && !!formData.startDate;
//   //         break;
//   //       case "Skills":
//   //         newStatus[section.name] = !!formData.skills;
//   //         break;
//   //       default:
//   //         newStatus[section.name] = false;
//   //     }
//   //   });

//   //   setCompletionStatus(newStatus);
//   // }, [formData, sections]);

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//   const newStatus: Record<string, boolean> = {
//     "Personal Info":
//       !!resumeData.personalInfo.name &&
//       !!resumeData.personalInfo.email &&
//       !!resumeData.personalInfo.phone,
//     "Professional Summary": !!resumeData.professionalSummary.trim(),
//     Education: resumeData.education.some(
//       (edu) =>
//         isFilled(edu.school) && isFilled(edu.degree) 
//     ),
//     Skills: resumeData.skills.length > 0,
//     "Work Experience": resumeData.workExperience.some(
//       (exp) =>
//         isFilled(exp.company) &&
//         isFilled(exp.role)
//     ),
//     Projects: resumeData.projects.some(
//       (proj) => isFilled(proj.title) && isFilled(proj.technologies)
//     ),
//     Certifications: resumeData.certifications.some(
//       (cert) => isFilled(cert.name)),
//     Achievements: resumeData.achievements.some(
//       (ach) => isFilled(ach.title)),
//     Awards: resumeData.awards.some(
//       (awd) => isFilled(awd.title)),
//     Volunteering: resumeData.volunteering.some(
//       (vol) => isFilled(vol.organization) && isFilled(vol.role)
//     ),
//     References: resumeData.references.some(
//       (ref) => isFilled(ref.name) && isFilled(ref.contact)
//     ),
//     Internships: resumeData.internships.some(
//       (intern) => isFilled(intern.company) && isFilled(intern.role)
//     ),
//   };
//   setCompletionStatus(newStatus);
// }, [resumeData]);


//   // ✅ Adjust width dynamically
//   const dynamicWidth = isTemplateSidebarOpen ? "w-[28%]" : "w-[28%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus} // ✅ Pass here
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide; before section open temp auto


// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onSectionOpen?: () => void;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
// }) => {
//   const [sections, setSections] = useState(initialSections);
//   const { resumeData } = useResume();
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "References", ai: false },
//     { name: "Internships", ai: true },
//     { name: "Awards", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // Trigger callback when a section is opened
//   // const handleSectionToggle = (sectionName: string | null) => {
//   //   if (sectionName && !selectedTemplate && onSectionOpen) {
//   //     onSectionOpen();
//   //   }
//   // };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.name &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: resumeData.skills.length > 0,
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//     };
//     setCompletionStatus(newStatus);
//   }, [resumeData]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[28%]" : "w-[28%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide;

// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
//   const { resumeData } = useResume();
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Internships", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // Handle sidebar toggle from EditorTab
//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;
//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.name &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//     };
//     setCompletionStatus(newStatus);
//   }, [resumeData]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide;




// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
//   const { resumeData } = useResume();
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Internships", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   // Handle sidebar toggle from EditorTab
//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;
//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.name &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//     };
//     setCompletionStatus(newStatus);
//   }, [resumeData]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide;

// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
//   const { resumeData, isLoadingResume } = useResume(); // ✅ Added isLoadingResume
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Internships", ai: true },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});

//   // ✅ NEW: Populate formData from resumeData when it loads
//   useEffect(() => {
//     if (!isLoadingResume && resumeData) {
//       console.log("🔄 Populating form from loaded resume data");
      
//       const newFormData: Record<string, string> = {};
      
//       // Personal Info
//       newFormData["name"] = resumeData.personalInfo?.name || "";
//       newFormData["email"] = resumeData.personalInfo?.email || "";
//       newFormData["phone"] = resumeData.personalInfo?.phone || "";
//       newFormData["location"] = resumeData.personalInfo?.location || "";
//       newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinurl || "";
//       newFormData["portifoliourl"] = resumeData.personalInfo?.portifoliourl || "";
      
//       // Professional Summary
//       newFormData["professionalSummary"] = resumeData.professionalSummary || "";
      
//       // Skills
//       if (Array.isArray(resumeData.skills)) {
//         newFormData["skills"] = resumeData.skills.join(", ");
//       }
      
//       // Education
//       resumeData.education?.forEach((edu, index) => {
//         newFormData[`education_${index}_school`] = edu.school || "";
//         newFormData[`education_${index}_degree`] = edu.degree || "";
//         newFormData[`education_${index}_startDate`] = edu.startDate || "";
//         newFormData[`education_${index}_endDate`] = edu.endDate || "";
//       });
      
//       // Work Experience
//       resumeData.workExperience?.forEach((work, index) => {
//         newFormData[`workExperience_${index}_company`] = work.company || "";
//         newFormData[`workExperience_${index}_role`] = work.role || "";
//         newFormData[`workExperience_${index}_location`] = work.location || "";
//         newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
//         newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
//         newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//         newFormData[`workExperience_${index}_description`] = work.description || "";
//       });
      
//       // Projects
//       resumeData.projects?.forEach((project, index) => {
//         newFormData[`project_${index}_title`] = project.title || "";
//         newFormData[`project_${index}_description`] = project.description || "";
//         newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) 
//           ? project.technologies.join(", ") 
//           : "";
//         newFormData[`project_${index}_startDate`] = project.startDate || "";
//         newFormData[`project_${index}_endDate`] = project.endDate || "";
//         newFormData[`project_${index}_link`] = project.link || "";
//       });
      
//       // Certifications
//       resumeData.certifications?.forEach((cert, index) => {
//         newFormData[`certification_${index}_name`] = cert.name || "";
//         newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
//         newFormData[`certification_${index}_year`] = cert.year || "";
//       });
      
//       // Achievements
//       resumeData.achievements?.forEach((ach, index) => {
//         newFormData[`achievement_${index}_title`] = ach.title || "";
//         newFormData[`achievement_${index}_date`] = ach.date || "";
//         newFormData[`achievement_${index}_description`] = ach.description || "";
//       });
      
//       // Internships
//       resumeData.internships?.forEach((intern, index) => {
//         newFormData[`internship_${index}_company`] = intern.company || "";
//         newFormData[`internship_${index}_role`] = intern.role || "";
//         newFormData[`internship_${index}_location`] = intern.location || "";
//         newFormData[`internship_${index}_startDate`] = intern.startDate || "";
//         newFormData[`internship_${index}_endDate`] = intern.endDate || "";
//         newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
//         newFormData[`internship_${index}_description`] = intern.description || "";
//       });
      
//       // Volunteering
//       resumeData.volunteering?.forEach((vol, index) => {
//         newFormData[`volunteering_${index}_organization`] = vol.organization || "";
//         newFormData[`volunteering_${index}_role`] = vol.role || "";
//         newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
//         newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
//       });
      
//       // Awards
//       resumeData.awards?.forEach((award, index) => {
//         newFormData[`award_${index}_title`] = award.title || "";
//         newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
//         newFormData[`award_${index}_year`] = award.year || "";
//       });
      
//       // Hobbies
//       resumeData.hobbies?.forEach((hobby, index) => {
//         newFormData[`hobbie_${index}_name`] = hobby.name || "";
//         newFormData[`hobbie_${index}_description`] = hobby.description || "";
//         newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
//         newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
//       });
      
//       // Interests
//       resumeData.interests?.forEach((interest, index) => {
//         newFormData[`interest_${index}_name`] = interest.name || "";
//         newFormData[`interest_${index}_description`] = interest.description || "";
//         newFormData[`interest_${index}_category`] = interest.category || "";
//       });
      
//       // Languages
//       resumeData.languages?.forEach((lang, index) => {
//         newFormData[`language_${index}_language`] = lang.language || "";
//         newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
//       });
      
//       // Publications
//       resumeData.publications?.forEach((pub, index) => {
//         newFormData[`publication_${index}_title`] = pub.title || "";
//         newFormData[`publication_${index}_authors`] = pub.authors || "";
//         newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
//         newFormData[`publication_${index}_date`] = pub.date || "";
//         newFormData[`publication_${index}_url`] = pub.url || "";
//       });
      
//       // References
//       resumeData.references?.forEach((ref, index) => {
//         newFormData[`reference_${index}_name`] = ref.name || "";
//         newFormData[`reference_${index}_relation`] = ref.relation || "";
//         newFormData[`reference_${index}_contact`] = ref.contact || "";
//       });
      
//       setFormData(newFormData);
//       console.log("✅ Form populated with loaded data");
//     }
//   }, [isLoadingResume, resumeData]);

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleBlur = (key: string, value: string) => {
//     if (!value) {
//       setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
//     } else {
//       setErrors((prev) => {
//         const updated = { ...prev };
//         delete updated[key];
//         return updated;
//       });
//     }
//   };

//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;
//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.name &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//     };
//     setCompletionStatus(newStatus);
//   }, [resumeData]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide;  main imp


"use client";
import React, { useState, useEffect } from "react";
import { SidebarOpen } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { useResume } from "../../_context/ResumeContext";
import Tabs from "./Tabs";
import EditorTab from "../editor/EditorTab";
import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
import AIReviewTab from "../aiReview/AIReviewTab";

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
import Publications from "../editor/sections/Publications";
import Interests from "../editor/sections/Interests";
import Hobbies from "../editor/sections/Hobbies";
import Languages from "../editor/sections/Languages";

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
  Publications,
  Interests,
  Hobbies,
  Languages,
};

interface ResumeSideProps {
  isTemplateSidebarOpen?: boolean;
  onToggleTemplateSidebar?: (isOpen: boolean) => void;
}

const ResumeSide: React.FC<ResumeSideProps> = ({ 
  isTemplateSidebarOpen = true,
  onToggleTemplateSidebar,
}) => {
  const [sections, setSections] = useState(initialSections);
  
  // ✅ Get completionStatus and setCompletionStatus from context
  const { 
    resumeData, 
    isLoadingResume,
    completionStatus,
    setCompletionStatus 
  } = useResume();
  
  const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
    { name: "Achievements", ai: true },
    { name: "Publications", ai: false },
    { name: "Volunteering", ai: false },
    { name: "Awards", ai: false },
    { name: "Hobbies", ai: true },
    { name: "Interests", ai: true },
    { name: "Languages", ai: false },
    { name: "References", ai: false },
  ]);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Editor");
  
  const clearErrors = (fields?: string[]) => {
  if (!fields || fields.length === 0) {
    // Clear all errors
    setErrors({});
  } else {
    // Clear specific field errors
    setErrors(prev => {
      const newErrors = { ...prev };
      fields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  }
};

  // ✅ Populate formData from resumeData when it loads
  useEffect(() => {
    if (!isLoadingResume && resumeData) {
      console.log("🔄 Populating form from loaded resume data");
      
      const newFormData: Record<string, string> = {};
      
      // Personal Info
      newFormData["name"] = resumeData.personalInfo?.fullName || "";
      newFormData["email"] = resumeData.personalInfo?.email || "";
      newFormData["phone"] = resumeData.personalInfo?.phone || "";
      newFormData["location"] = resumeData.personalInfo?.location || "";
      newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinUrl || "";
      newFormData["portifoliourl"] = resumeData.personalInfo?.portifolioUrl || "";
      
      // Professional Summary
      newFormData["professionalSummary"] = resumeData.professionalSummary || "";
      
      // Skills
      if (Array.isArray(resumeData.skills)) {
        newFormData["skills"] = resumeData.skills.join(", ");
      }
      
      // Education
      resumeData.education?.forEach((edu, index) => {
        newFormData[`education_${index}_school`] = edu.school || "";
        newFormData[`education_${index}_degree`] = edu.degree || "";
        newFormData[`education_${index}_startDate`] = edu.startDate || "";
        newFormData[`education_${index}_endDate`] = edu.endDate || "";
      });
      
      // Work Experience
      resumeData.workExperience?.forEach((work, index) => {
        newFormData[`workExperience_${index}_company`] = work.company || "";
        newFormData[`workExperience_${index}_role`] = work.role || "";
        newFormData[`workExperience_${index}_location`] = work.location || "";
        newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
        newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
        newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
        newFormData[`workExperience_${index}_description`] = work.description || "";
      });
      
      // Projects
      resumeData.projects?.forEach((project, index) => {
        newFormData[`project_${index}_title`] = project.title || "";
        newFormData[`project_${index}_description`] = project.description || "";
        newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) 
          ? project.technologies.join(", ") 
          : "";
        newFormData[`project_${index}_startDate`] = project.startDate || "";
        newFormData[`project_${index}_endDate`] = project.endDate || "";
        newFormData[`project_${index}_link`] = project.link || "";
      });
      
      // Certifications
      resumeData.certifications?.forEach((cert, index) => {
        newFormData[`certification_${index}_name`] = cert.name || "";
        newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
        newFormData[`certification_${index}_year`] = cert.year || "";
      });
      
      // Achievements
      resumeData.achievements?.forEach((ach, index) => {
        newFormData[`achievement_${index}_title`] = ach.title || "";
        newFormData[`achievement_${index}_date`] = ach.date || "";
        newFormData[`achievement_${index}_description`] = ach.description || "";
      });
      
      // Internships
      resumeData.internships?.forEach((intern, index) => {
        newFormData[`internship_${index}_company`] = intern.company || "";
        newFormData[`internship_${index}_role`] = intern.role || "";
        newFormData[`internship_${index}_location`] = intern.location || "";
        newFormData[`internship_${index}_startDate`] = intern.startDate || "";
        newFormData[`internship_${index}_endDate`] = intern.endDate || "";
        newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
        newFormData[`internship_${index}_description`] = intern.description || "";
      });
      
      // Volunteering
      resumeData.volunteering?.forEach((vol, index) => {
        newFormData[`volunteering_${index}_organization`] = vol.organization || "";
        newFormData[`volunteering_${index}_role`] = vol.role || "";
        newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
        newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
      });
      
      // Awards
      resumeData.awards?.forEach((award, index) => {
        newFormData[`award_${index}_title`] = award.title || "";
        newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
        newFormData[`award_${index}_year`] = award.year || "";
      });
      
      // Hobbies
      resumeData.hobbies?.forEach((hobby, index) => {
        newFormData[`hobbie_${index}_name`] = hobby.name || "";
        newFormData[`hobbie_${index}_description`] = hobby.description || "";
        newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
        newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
      });
      
      // Interests
      resumeData.interests?.forEach((interest, index) => {
        newFormData[`interest_${index}_name`] = interest.name || "";
        newFormData[`interest_${index}_description`] = interest.description || "";
        newFormData[`interest_${index}_category`] = interest.category || "";
      });
      
      // Languages
      resumeData.languages?.forEach((lang, index) => {
        newFormData[`language_${index}_language`] = lang.language || "";
        newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
      });
      
      // Publications
      resumeData.publications?.forEach((pub, index) => {
        newFormData[`publication_${index}_title`] = pub.title || "";
        newFormData[`publication_${index}_authors`] = pub.authors || "";
        newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
        newFormData[`publication_${index}_date`] = pub.date || "";
        newFormData[`publication_${index}_url`] = pub.url || "";
      });
      
      // References
      resumeData.references?.forEach((ref, index) => {
        newFormData[`reference_${index}_name`] = ref.name || "";
        newFormData[`reference_${index}_relation`] = ref.relation || "";
        newFormData[`reference_${index}_contact`] = ref.contact || "";
      });
      
      setFormData(newFormData);
      console.log("✅ Form populated with loaded data");
    }
  }, [isLoadingResume, resumeData]);

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

  // const handleChange = (key: string, value: string) => {
  //   setFormData((prev) => ({ ...prev, [key]: value }));
  // };
  const handleChange = (key: string, value: string) => {
  // Update form data
  setFormData(prev => ({
    ...prev,
    [key]: value
  }));
  
  // ✅ Clear error for this field when user starts typing
  if (errors[key]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }
};


  // const handleBlur = (key: string, value: string) => {
  //   if (!value) {
  //     setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
  //   } else {
  //     setErrors((prev) => {
  //       const updated = { ...prev };
  //       delete updated[key];
  //       return updated;
  //     });
  //   }
  // };
  const handleBlur = (key: string, value: string) => {
  // Check if this is a required field
  const lowerKey = key.toLowerCase();
  const optionalFields = [
    "linkedin",
    "portfolio",
    "currentlyworking",
    "link",
    "technologies",
    "description",
    "achievement",
    "category",
    "proficiencylevel",
  ];
  
  const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));
  
  // Only set error if field is required AND empty
  if (isRequired && (!value || value.trim() === "")) {
    setErrors(prev => ({
      ...prev,
      [key]: "This field is required"
    }));
  } else {
    // Clear error if field has value
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }
};


  const handleSidebarToggle = (isOpen: boolean) => {
    if (onToggleTemplateSidebar) {
      onToggleTemplateSidebar(isOpen);
    }
  };

  // ✅ Calculate completion status and update context
  useEffect(() => {
    const isFilled = (value?: string) => !!value && value.length > 0;
    const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;
    
    const newStatus: Record<string, boolean> = {
      "Personal Info":
        !!resumeData.personalInfo.fullName &&
        !!resumeData.personalInfo.email &&
        !!resumeData.personalInfo.phone &&
        !!resumeData.personalInfo.location,
      "Professional Summary": !!resumeData.professionalSummary.trim(),
      Education: resumeData.education.some(
        (edu) =>
          isFilled(edu.school) && isFilled(edu.degree) 
      ),
      Skills: isArrayFilled(resumeData.skills),
      "Work Experience": resumeData.workExperience.some(
        (exp) =>
          isFilled(exp.company) &&
          isFilled(exp.role)
      ),
      Projects: resumeData.projects.some(
        (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
      ),
      Certifications: resumeData.certifications.some(
        (cert) => isFilled(cert.name)),
      Achievements: resumeData.achievements.some(
        (ach) => isFilled(ach.title)),
      Awards: resumeData.awards.some(
        (awd) => isFilled(awd.title)),
      Volunteering: resumeData.volunteering.some(
        (vol) => isFilled(vol.organization) && isFilled(vol.role)
      ),
      References: resumeData.references.some(
        (ref) => isFilled(ref.name) && isFilled(ref.contact)
      ),
      Internships: resumeData.internships.some(
        (intern) => isFilled(intern.company) && isFilled(intern.role)
      ),
      Hobbies: resumeData.hobbies.some(
        (hobby) => isFilled(hobby.name)),
      Interests: resumeData.interests.some(
        (interest) => isFilled(interest.name)),
      Languages: resumeData.languages.some(
        (lang) => isFilled(lang.language)),
      Publications: resumeData.publications.some(
        (pub) => isFilled(pub.title)),
    };
    
    // ✅ Update context completion status (used for progress circle)
    setCompletionStatus(newStatus);
    
  }, [resumeData, setCompletionStatus]);

  const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
        ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
      `}
    >
      {isOpen && (
        <Tabs
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isTemplateSidebarOpen={isTemplateSidebarOpen}
        />
      )}

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
              handleDragEnd={handleDragEnd}
              completionStatus={completionStatus}
              onSidebarToggle={handleSidebarToggle}
              clearErrors={clearErrors}
            />
          )}
          {activeTab === "ResumeGPT" && <ResumeGPTTab />}
          {activeTab === "AI Review" && <AIReviewTab />}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
        >
          <SidebarOpen className="text-blue-500" size={20} />
        </button>
      )}
    </div>
  );
};

export default ResumeSide;
//  before custom sections add


// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen, Trash2 } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume, CustomSection, CustomField } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// import { toast } from "sonner";
// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// const CustomSectionEditor = ({ section }: { section: CustomSection }) => {
//   const { addCustomField, updateCustomFieldValue, deleteCustomField, removeCustomSection } = useResume();
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");
//   const [isEditingSectionName, setIsEditingSectionName] = useState(false);
//   const [sectionNameInput, setSectionNameInput] = useState(section.sectionName);

//   return (
//     <div className="p-3 border rounded-lg shadow-sm mb-4">
//       <div className="flex justify-between items-center mb-3">
//         {isEditingSectionName ? (
//           <input
//             type="text"
//             value={sectionNameInput}
//             onChange={(e) => setSectionNameInput(e.target.value)}
//             onBlur={() => setIsEditingSectionName(false)}
//             onKeyDown={(e) => e.key === "Enter" && setIsEditingSectionName(false)}
//             className="text-lg font-semibold border-b border-gray-400 focus:outline-none"
//             autoFocus
//           />
//         ) : (
//           <h3 className="text-lg font-semibold cursor-pointer" onClick={() => setIsEditingSectionName(true)}>
//             {section.sectionName}
//           </h3>
//         )}
//         <button onClick={() => removeCustomSection(section.id)} title="Delete Section" className="text-red-600 hover:text-red-800">
//           <Trash2 size={18} />
//         </button>
//       </div>

//       <div>
//         {section.fields.map((field) => (
//           <div key={field.id} className="mb-2">
//             <label className="block font-medium text-gray-700 mb-1">
//               {field.fieldName} ({field.fieldType})
//             </label>

//             {field.fieldType === "textarea" ? (
//               <textarea
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                 rows={3}
//               />
//             ) : field.fieldType === "date" ? (
//               <input
//                 type="date"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             ) : field.fieldType === "url" ? (
//               <input
//                 type="url"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             ) : field.fieldType === "list" ? (
//               <div className="space-y-2">
//                 {(field.value as string[]).map((item, idx) => (
//                   <div key={idx} className="flex gap-2">
//                     <input
//                       type="text"
//                       className="flex-1 border p-2 rounded"
//                       value={item}
//                       onChange={(e) => {
//                         const newList = [...(field.value as string[])];
//                         newList[idx] = e.target.value;
//                         updateCustomFieldValue(section.id, field.id, newList);
//                       }}
//                     />
//                     <button
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => {
//                         const newList = (field.value as string[]).filter((_, i) => i !== idx);
//                         updateCustomFieldValue(section.id, field.id, newList);
//                       }}
//                       title="Delete item"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))}
//                 <button
//                   className="text-blue-600 hover:underline"
//                   onClick={() =>
//                     updateCustomFieldValue(section.id, field.id, [...(field.value as string[]), ""])
//                   }
//                 >
//                   + Add item
//                 </button>
//               </div>
//             ) : (
//               <input
//                 type="text"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             )}

//             <button
//               onClick={() => deleteCustomField(section.id, field.id)}
//               className="mt-1 text-red-600 hover:text-red-800"
//               title="Delete field"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//         ))}
//       </div>

//       <AddNewFieldForm sectionId={section.id} addCustomField={addCustomField} />
//     </div>
//   );
// };

// const AddNewFieldForm = ({
//   sectionId,
//   addCustomField,
// }: {
//   sectionId: string;
//   addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
// }) => {
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

//   const handleAdd = () => {
//     if (!newFieldName.trim()) {
//       toast.error("Field name cannot be empty");
//       return;
//     }
//     addCustomField(sectionId, newFieldName, newFieldType);
//     setNewFieldName("");
//     setNewFieldType("text");
//   };

//   return (
//     <div className="mt-4 border-t pt-3">
//       <input
//         type="text"
//         placeholder="New field name"
//         className="border p-2 rounded mr-2 w-2/3"
//         value={newFieldName}
//         onChange={(e) => setNewFieldName(e.target.value)}
//       />
//       <select
//         value={newFieldType}
//         onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
//         className="border p-2 rounded mr-2"
//       >
//         <option value="text">Text</option>
//         <option value="textarea">Long Text</option>
//         <option value="date">Date</option>
//         <option value="url">URL</option>
//         <option value="list">List</option>
//       </select>
//       <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//         Add Field
//       </button>
//     </div>
//   );
// };

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
  
//   const { 
//     resumeData, 
//     isLoadingResume,
//     completionStatus,
//     setCompletionStatus,
//     addCustomSection,
//     removeCustomSection
//   } = useResume();
  
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Publications", ai: false },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");
  
//   const clearErrors = (fields?: string[]) => {
//     if (!fields || fields.length === 0) {
//       setErrors({});
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         fields.forEach(field => {
//           delete newErrors[field];
//         });
//         return newErrors;
//       });
//     }
//   };

//   useEffect(() => {
//     if (!isLoadingResume && resumeData) {
//       const newFormData: Record<string, string> = {};
//       newFormData["name"] = resumeData.personalInfo?.fullName || "";
//       newFormData["email"] = resumeData.personalInfo?.email || "";
//       newFormData["phone"] = resumeData.personalInfo?.phone || "";
//       newFormData["location"] = resumeData.personalInfo?.location || "";
//       newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinUrl || "";
//       newFormData["portifoliourl"] = resumeData.personalInfo?.portifolioUrl || "";
//       newFormData["professionalSummary"] = resumeData.professionalSummary || "";
//       if (Array.isArray(resumeData.skills)) {
//         newFormData["skills"] = resumeData.skills.join(", ");
//       }
//       resumeData.education?.forEach((edu, index) => {
//         newFormData[`education_${index}_school`] = edu.school || "";
//         newFormData[`education_${index}_degree`] = edu.degree || "";
//         newFormData[`education_${index}_startDate`] = edu.startDate || "";
//         newFormData[`education_${index}_endDate`] = edu.endDate || "";
//       });
//       resumeData.workExperience?.forEach((work, index) => {
//         newFormData[`workExperience_${index}_company`] = work.company || "";
//         newFormData[`workExperience_${index}_role`] = work.role || "";
//         newFormData[`workExperience_${index}_location`] = work.location || "";
//         newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
//         newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
//         newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//         newFormData[`workExperience_${index}_description`] = work.description || "";
//       });
//       resumeData.projects?.forEach((project, index) => {
//         newFormData[`project_${index}_title`] = project.title || "";
//         newFormData[`project_${index}_description`] = project.description || "";
//         newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
//         newFormData[`project_${index}_startDate`] = project.startDate || "";
//         newFormData[`project_${index}_endDate`] = project.endDate || "";
//         newFormData[`project_${index}_link`] = project.link || "";
//       });
//       resumeData.certifications?.forEach((cert, index) => {
//         newFormData[`certification_${index}_name`] = cert.name || "";
//         newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
//         newFormData[`certification_${index}_year`] = cert.year || "";
//       });
//       resumeData.achievements?.forEach((ach, index) => {
//         newFormData[`achievement_${index}_title`] = ach.title || "";
//         newFormData[`achievement_${index}_date`] = ach.date || "";
//         newFormData[`achievement_${index}_description`] = ach.description || "";
//       });
//       resumeData.internships?.forEach((intern, index) => {
//         newFormData[`internship_${index}_company`] = intern.company || "";
//         newFormData[`internship_${index}_role`] = intern.role || "";
//         newFormData[`internship_${index}_location`] = intern.location || "";
//         newFormData[`internship_${index}_startDate`] = intern.startDate || "";
//         newFormData[`internship_${index}_endDate`] = intern.endDate || "";
//         newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
//         newFormData[`internship_${index}_description`] = intern.description || "";
//       });
//       resumeData.volunteering?.forEach((vol, index) => {
//         newFormData[`volunteering_${index}_organization`] = vol.organization || "";
//         newFormData[`volunteering_${index}_role`] = vol.role || "";
//         newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
//         newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
//       });
//       resumeData.awards?.forEach((award, index) => {
//         newFormData[`award_${index}_title`] = award.title || "";
//         newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
//         newFormData[`award_${index}_year`] = award.year || "";
//       });
//       resumeData.hobbies?.forEach((hobby, index) => {
//         newFormData[`hobbie_${index}_name`] = hobby.name || "";
//         newFormData[`hobbie_${index}_description`] = hobby.description || "";
//         newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
//         newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
//       });
//       resumeData.interests?.forEach((interest, index) => {
//         newFormData[`interest_${index}_name`] = interest.name || "";
//         newFormData[`interest_${index}_description`] = interest.description || "";
//         newFormData[`interest_${index}_category`] = interest.category || "";
//       });
//       resumeData.languages?.forEach((lang, index) => {
//         newFormData[`language_${index}_language`] = lang.language || "";
//         newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
//       });
//       resumeData.publications?.forEach((pub, index) => {
//         newFormData[`publication_${index}_title`] = pub.title || "";
//         newFormData[`publication_${index}_authors`] = pub.authors || "";
//         newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
//         newFormData[`publication_${index}_date`] = pub.date || "";
//         newFormData[`publication_${index}_url`] = pub.url || "";
//       });
//       resumeData.references?.forEach((ref, index) => {
//         newFormData[`reference_${index}_name`] = ref.name || "";
//         newFormData[`reference_${index}_relation`] = ref.relation || "";
//         newFormData[`reference_${index}_contact`] = ref.contact || "";
//       });

//       // Populate customSections fields to formData using keys: customSection_{sectionId}_field_{fieldId}
//       resumeData.customSections?.forEach((section) => {
//         section.fields.forEach((field) => {
//           const key = `customSection_${section.id}_field_${field.id}`;
//           if (Array.isArray(field.value)) {
//             newFormData[key] = field.value.join(", ");
//           } else {
//             newFormData[key] = field.value || "";
//           }
//         });
//       });

//       setFormData(newFormData);
//     }
//   }, [isLoadingResume, resumeData]);

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [key]: value
//     }));

//     if (errors[key]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleBlur = (key: string, value: string) => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];

//     const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));

//     if (isRequired && (!value || value.trim() === "")) {
//       setErrors(prev => ({
//         ...prev,
//         [key]: "This field is required"
//       }));
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;

//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.fullName &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone &&
//         !!resumeData.personalInfo.location,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//       Hobbies: resumeData.hobbies.some(
//         (hobby) => isFilled(hobby.name)),
//       Interests: resumeData.interests.some(
//         (interest) => isFilled(interest.name)),
//       Languages: resumeData.languages.some(
//         (lang) => isFilled(lang.language)),
//       Publications: resumeData.publications.some(
//         (pub) => isFilled(pub.title)),
//     };

//     // Also mark custom sections completion:
//     (resumeData.customSections || []).forEach((cs) => {
//       newStatus[cs.id] = cs.fields.some((f) => {
//         if (Array.isArray(f.value)) {
//           return f.value.length > 0 && f.value.some(v => v.trim() !== "");
//         }
//         return f.value && f.value.trim() !== "";
//       });
//     });

//     setCompletionStatus(newStatus);

//   }, [resumeData, setCompletionStatus]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">

//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//               clearErrors={clearErrors}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}

//           {/* Custom Sections Editors displayed in sidebar */}
//           {resumeData.customSections?.map((section) => (
//             <CustomSectionEditor key={section.id} section={section} />
//           ))}

//           {/* Add Custom Section Input & Button */}
//           <div className="my-4">
//             <input
//               className="w-full px-3 py-2 border rounded mb-2"
//               placeholder="New custom section name"
//               value={formData["customSectionNewName"] || ""}
//               onChange={(e) => setFormData((prev) => ({ ...prev, customSectionNewName: e.target.value }))}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && formData["customSectionNewName"]?.trim()) {
//                   addCustomSection(formData["customSectionNewName"].trim());
//                   setFormData((prev) => ({ ...prev, customSectionNewName: "" }));
//                 }
//               }}
//             />
//             <button
//               onClick={() => {
//                 if (formData["customSectionNewName"]?.trim()) {
//                   addCustomSection(formData["customSectionNewName"].trim());
//                   setFormData((prev) => ({ ...prev, customSectionNewName: "" }));
//                 } else {
//                   toast.error("Section name cannot be empty");
//                 }
//               }}
//               className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
//             >
//               + Add Custom Section
//             </button>
//           </div>

//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide; before popup

// "use client";

// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume, CustomSection, CustomField } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// import { Trash2 } from "lucide-react";
// import { toast } from "sonner";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// interface CustomSectionModalProps {
//   section: CustomSection;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const CustomSectionModal: React.FC<CustomSectionModalProps> = ({ section, isOpen, onClose }) => {
//   const { addCustomField, updateCustomFieldValue, deleteCustomField, removeCustomSection } = useResume();
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

//   if (!isOpen) return null;

//   const handleAddField = () => {
//     if (!newFieldName.trim()) {
//       toast.error("Field name cannot be empty");
//       return;
//     }
//     addCustomField(section.id, newFieldName, newFieldType);
//     setNewFieldName("");
//     setNewFieldType("text");
//     toast.success("Field added successfully");
//   };

//   const handleDeleteSection = () => {
//     if (confirm(`Are you sure you want to delete "${section.sectionName}"?`)) {
//       removeCustomSection(section.id);
//       onClose();
//       toast.success("Section deleted");
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
//       <div className="bg-white max-w-3xl w-full max-h-[85vh] rounded-lg shadow-lg p-6 overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">{section.sectionName}</h2>
//           <div className="flex gap-2">
//             <button
//               className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded"
//               onClick={handleDeleteSection}
//               aria-label="Delete section"
//             >
//               Delete Section
//             </button>
//             <button
//               className="text-gray-500 hover:text-gray-700"
//               onClick={onClose}
//               aria-label="Close modal"
//             >
//               <Trash2 size={20} />
//             </button>
//           </div>
//         </div>

//         <div className="space-y-4">
//           {section.fields.length === 0 && (
//             <p className="text-gray-500 text-center py-4">No fields added yet. Add fields below.</p>
//           )}
//           {section.fields.map((field) => (
//             <div key={field.id} className="border-b pb-3">
//               <div className="flex justify-between items-center mb-1">
//                 <label className="block text-gray-700 font-medium">
//                   {field.fieldName} ({field.fieldType})
//                 </label>
//                 <button
//                   className="text-red-600 hover:text-red-800"
//                   onClick={() => {
//                     deleteCustomField(section.id, field.id);
//                     toast.success("Field deleted");
//                   }}
//                   aria-label="Delete field"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//               {field.fieldType === "textarea" ? (
//                 <textarea
//                   className="w-full border p-2 rounded"
//                   rows={3}
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder={`Enter ${field.fieldName}`}
//                 />
//               ) : field.fieldType === "date" ? (
//                 <input
//                   type="date"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                 />
//               ) : field.fieldType === "url" ? (
//                 <input
//                   type="url"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder="https://example.com"
//                 />
//               ) : field.fieldType === "list" ? (
//                 <div className="space-y-2">
//                   {(field.value as string[]).map((item, idx) => (
//                     <div key={idx} className="flex gap-2">
//                       <input
//                         type="text"
//                         className="flex-1 border p-2 rounded"
//                         value={item}
//                         onChange={(e) => {
//                           const newList = [...(field.value as string[])];
//                           newList[idx] = e.target.value;
//                           updateCustomFieldValue(section.id, field.id, newList);
//                         }}
//                         placeholder={`Item ${idx + 1}`}
//                       />
//                       <button
//                         className="text-red-600 hover:text-red-800 px-2"
//                         onClick={() => {
//                           const newList = (field.value as string[]).filter((_, i) => i !== idx);
//                           updateCustomFieldValue(section.id, field.id, newList);
//                         }}
//                         aria-label="Delete list item"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   ))}
//                   <button
//                     className="text-blue-600 hover:underline text-sm"
//                     onClick={() =>
//                       updateCustomFieldValue(section.id, field.id, [...(field.value as string[]), ""])
//                     }
//                   >
//                     + Add item
//                   </button>
//                 </div>
//               ) : (
//                 <input
//                   type="text"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder={`Enter ${field.fieldName}`}
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="mt-6 pt-4 border-t">
//           <h3 className="font-semibold mb-3">Add New Field</h3>
//           <div className="flex items-center gap-3">
//             <input
//               type="text"
//               className="border p-2 rounded flex-1"
//               placeholder="Field name (e.g., Description, Date)"
//               value={newFieldName}
//               onChange={(e) => setNewFieldName(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleAddField()}
//             />
//             <select
//               className="border p-2 rounded"
//               value={newFieldType}
//               onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
//             >
//               <option value="text">Text</option>
//               <option value="textarea">Long Text</option>
//               <option value="date">Date</option>
//               <option value="url">URL</option>
//               <option value="list">List</option>
//             </select>
//             <button
//               onClick={handleAddField}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             >
//               Add Field
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
  
//   const { 
//     resumeData, 
//     isLoadingResume,
//     completionStatus,
//     setCompletionStatus,
//     addCustomSection,
//   } = useResume();
  
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Publications", ai: false },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");
  
//   const [modalOpen, setModalOpen] = useState(false);
//   const [activeCustomSection, setActiveCustomSection] = useState<CustomSection | null>(null);
//   const [newSectionName, setNewSectionName] = useState("");
  
//   const clearErrors = (fields?: string[]) => {
//     if (!fields || fields.length === 0) {
//       setErrors({});
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         fields.forEach(field => {
//           delete newErrors[field];
//         });
//         return newErrors;
//       });
//     }
//   };

//   useEffect(() => {
//     if (!isLoadingResume && resumeData) {
//       const newFormData: Record<string, string> = {};
//       newFormData["name"] = resumeData.personalInfo?.fullName || "";
//       newFormData["email"] = resumeData.personalInfo?.email || "";
//       newFormData["phone"] = resumeData.personalInfo?.phone || "";
//       newFormData["location"] = resumeData.personalInfo?.location || "";
//       newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinUrl || "";
//       newFormData["portifoliourl"] = resumeData.personalInfo?.portifolioUrl || "";
//       newFormData["professionalSummary"] = resumeData.professionalSummary || "";
//       if (Array.isArray(resumeData.skills)) {
//         newFormData["skills"] = resumeData.skills.join(", ");
//       }
//       resumeData.education?.forEach((edu, index) => {
//         newFormData[`education_${index}_school`] = edu.school || "";
//         newFormData[`education_${index}_degree`] = edu.degree || "";
//         newFormData[`education_${index}_startDate`] = edu.startDate || "";
//         newFormData[`education_${index}_endDate`] = edu.endDate || "";
//       });
//       resumeData.workExperience?.forEach((work, index) => {
//         newFormData[`workExperience_${index}_company`] = work.company || "";
//         newFormData[`workExperience_${index}_role`] = work.role || "";
//         newFormData[`workExperience_${index}_location`] = work.location || "";
//         newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
//         newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
//         newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//         newFormData[`workExperience_${index}_description`] = work.description || "";
//       });
//       resumeData.projects?.forEach((project, index) => {
//         newFormData[`project_${index}_title`] = project.title || "";
//         newFormData[`project_${index}_description`] = project.description || "";
//         newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
//         newFormData[`project_${index}_startDate`] = project.startDate || "";
//         newFormData[`project_${index}_endDate`] = project.endDate || "";
//         newFormData[`project_${index}_link`] = project.link || "";
//       });
//       resumeData.certifications?.forEach((cert, index) => {
//         newFormData[`certification_${index}_name`] = cert.name || "";
//         newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
//         newFormData[`certification_${index}_year`] = cert.year || "";
//       });
//       resumeData.achievements?.forEach((ach, index) => {
//         newFormData[`achievement_${index}_title`] = ach.title || "";
//         newFormData[`achievement_${index}_date`] = ach.date || "";
//         newFormData[`achievement_${index}_description`] = ach.description || "";
//       });
//       resumeData.internships?.forEach((intern, index) => {
//         newFormData[`internship_${index}_company`] = intern.company || "";
//         newFormData[`internship_${index}_role`] = intern.role || "";
//         newFormData[`internship_${index}_location`] = intern.location || "";
//         newFormData[`internship_${index}_startDate`] = intern.startDate || "";
//         newFormData[`internship_${index}_endDate`] = intern.endDate || "";
//         newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
//         newFormData[`internship_${index}_description`] = intern.description || "";
//       });
//       resumeData.volunteering?.forEach((vol, index) => {
//         newFormData[`volunteering_${index}_organization`] = vol.organization || "";
//         newFormData[`volunteering_${index}_role`] = vol.role || "";
//         newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
//         newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
//       });
//       resumeData.awards?.forEach((award, index) => {
//         newFormData[`award_${index}_title`] = award.title || "";
//         newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
//         newFormData[`award_${index}_year`] = award.year || "";
//       });
//       resumeData.hobbies?.forEach((hobby, index) => {
//         newFormData[`hobbie_${index}_name`] = hobby.name || "";
//         newFormData[`hobbie_${index}_description`] = hobby.description || "";
//         newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
//         newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
//       });
//       resumeData.interests?.forEach((interest, index) => {
//         newFormData[`interest_${index}_name`] = interest.name || "";
//         newFormData[`interest_${index}_description`] = interest.description || "";
//         newFormData[`interest_${index}_category`] = interest.category || "";
//       });
//       resumeData.languages?.forEach((lang, index) => {
//         newFormData[`language_${index}_language`] = lang.language || "";
//         newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
//       });
//       resumeData.publications?.forEach((pub, index) => {
//         newFormData[`publication_${index}_title`] = pub.title || "";
//         newFormData[`publication_${index}_authors`] = pub.authors || "";
//         newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
//         newFormData[`publication_${index}_date`] = pub.date || "";
//         newFormData[`publication_${index}_url`] = pub.url || "";
//       });
//       resumeData.references?.forEach((ref, index) => {
//         newFormData[`reference_${index}_name`] = ref.name || "";
//         newFormData[`reference_${index}_relation`] = ref.relation || "";
//         newFormData[`reference_${index}_contact`] = ref.contact || "";
//       });

//       resumeData.customSections?.forEach((section) => {
//         section.fields.forEach((field) => {
//           const key = `customSection_${section.id}_field_${field.id}`;
//           if (Array.isArray(field.value)) {
//             newFormData[key] = field.value.join(", ");
//           } else {
//             newFormData[key] = field.value || "";
//           }
//         });
//       });

//       setFormData(newFormData);
//     }
//   }, [isLoadingResume, resumeData]);

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [key]: value
//     }));

//     if (errors[key]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleBlur = (key: string, value: string) => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];

//     const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));

//     if (isRequired && (!value || value.trim() === "")) {
//       setErrors(prev => ({
//         ...prev,
//         [key]: "This field is required"
//       }));
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;

//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.fullName &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//       Hobbies: resumeData.hobbies.some(
//         (hobby) => isFilled(hobby.name)),
//       Interests: resumeData.interests.some(
//         (interest) => isFilled(interest.name)),
//       Languages: resumeData.languages.some(
//         (lang) => isFilled(lang.language)),
//       Publications: resumeData.publications.some(
//         (pub) => isFilled(pub.title)),
//     };

//     (resumeData.customSections || []).forEach((cs) => {
//       newStatus[cs.id] = cs.fields.some((f) => {
//         if (Array.isArray(f.value)) {
//           return f.value.length > 0 && f.value.some(v => v.trim() !== "");
//         }
//         return f.value && f.value.trim() !== "";
//       });
//     });

//     setCompletionStatus(newStatus);

//   }, [resumeData, setCompletionStatus]);

//   const openCustomSectionModal = (section: CustomSection) => {
//     setActiveCustomSection(section);
//     setModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//     setActiveCustomSection(null);
//   };

//   const handleAddCustomSection = () => {
//     if (!newSectionName.trim()) {
//       toast.error("Section name cannot be empty.");
//       return;
//     }
//     addCustomSection(newSectionName.trim());
//     setNewSectionName("");
//   };

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">

//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//               clearErrors={clearErrors}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}

//           <div className="mt-4 pt-4 border-t">
//             <h3 className="font-semibold mb-3 text-gray-700">Custom Sections</h3>
//             <div className="mb-3">
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded mb-2"
//                 placeholder="New custom section name"
//                 value={newSectionName}
//                 onChange={(e) => setNewSectionName(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleAddCustomSection()}
//               />
//               <button
//                 onClick={handleAddCustomSection}
//                 className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
//               >
//                 + Add Custom Section
//               </button>
//             </div>

//             {resumeData.customSections.map((section) => (
//               <div
//                 key={section.id}
//                 className="cursor-pointer px-3 py-2 mb-2 border rounded hover:bg-gray-100 flex justify-between items-center transition-colors"
//                 onClick={() => openCustomSectionModal(section)}
//               >
//                 <span className="font-medium">{section.sectionName}</span>
//                 <span className="text-sm text-gray-500">{section.fields.length} fields</span>
//               </div>
//             ))}
//           </div>

//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}

//       {activeCustomSection && (
//         <CustomSectionModal section={activeCustomSection} isOpen={modalOpen} onClose={closeModal} />
//       )}
//     </div>
//   );
// };

// export default ResumeSide;



