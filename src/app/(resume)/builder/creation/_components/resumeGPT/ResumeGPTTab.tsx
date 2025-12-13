// "use client";
// import type { ReactElement } from "react";
// import { Send } from "lucide-react";
// import { useState, useEffect, useRef } from "react";
// import { useResume } from "../../_context/ResumeContext";
// import MessageBubble from "./MessageBubble";
// import SectionButtons from "./SectionButtons";
// // Import forms
// import ProfessionalSummaryForm from "./forms/ProfessionalSummaryForm";
// import EducationForm from "./forms/EducationForm";
// import WorkExperienceForm from "./forms/WorkExperienceForm";
// import ProjectForm from "./forms/ProjectForm";
// import CertificationForm from "./forms/CertificationForm";
// import VolunteeringForm from "./forms/VolunteeringForm";
// import ReferenceForm from "./forms/ReferenceForm";
// import InternshipForm from "./forms/InternshipForm";
// import AwardForm from "./forms/AwardForm";
// import SkillsForm from "./forms/SkillsForm";
// import AchievementForm from "./forms/AchievementForm";
// // Types
// type EducationEntry = { school: string; degree: string; startDate: string; endDate: string };
// type WorkEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
// type ProjectEntry = { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string };
// type CertificationEntry = { name: string; issuedBy: string; year: string };
// type VolunteeringEntry = { organization: string; role: string; startDate: string; endDate: string };
// type ReferenceEntry = { name: string; relation: string; contact: string };
// type InternshipEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
// type AwardEntry = { title: string; issuedBy: string; year: string };
// type AchievementEntry = { title: string; date: string; description: string };
// type SectionName = | "Professional Summary" | "Education" | "Work Experience" | "Projects" | "Certifications" | "Volunteering" | "References" | "Internships" | "Awards" | "Skills" | "Achievements";
// interface Message { sender: "bot" | "user"; text?: string; form?: ReactElement; }
// export default function ResumeGPT() {
//   const { resumeData, setResumeData } = useResume();
//   const [messages, setMessages] = useState<Message[]>([
//     { sender: "bot", text: "Hi! Let's build your resume. What's your full name?" },
//   ]);
//   const [disabledSections, setDisabledSections] = useState<string[]>([]);
//   const [userInput, setUserInput] = useState("");
//   const [currentStep, setCurrentStep] = useState<keyof typeof resumeData.personalInfo>("name");
//   const [showSectionButtons, setShowSectionButtons] = useState(true);
//   const [awaitingAddMore, setAwaitingAddMore] = useState<SectionName | null>(null);
//   // Auto-scroll
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
//   }, [messages]);
//   const personalPrompts: Record<keyof typeof resumeData.personalInfo, string> = {
//     name: "What's your full name?",
//     email: "Great! Now, what's your email?",
//     phone: "Nice! What's your phone number?",
//     location: "Thanks! Where are you located?",
//     linkedinurl: "Finally, What's your LinkedIn URL?",
//     portifoliourl: "What's your Portifolio link?",
//   };
//   const stepOrder: (keyof typeof resumeData.personalInfo)[] = ["name", "email", "phone", "location", "linkedinurl", "portifoliourl"];
//   // Handle user text input
//   const handleUserSubmit = () => {
//     if (!userInput.trim()) return;
//     const text = userInput.trim();
//     setMessages((prev) => [...prev, { sender: "user", text }]);
//     setUserInput("");
//     // Handle "Add more?" logic
//     if (awaitingAddMore) {
//       if (text.toLowerCase() === "yes") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Sure! Please enter another entry for ${awaitingAddMore}.` },
//           { sender: "bot", form: formComponents[awaitingAddMore] },
//         ]);
//       } else if (text.toLowerCase() === "no") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Details added for ${awaitingAddMore}. Now select the next section.` },
//         ]);
//         setDisabledSections((prev) => [...prev, awaitingAddMore]);
//         setShowSectionButtons(true);
//         setAwaitingAddMore(null);
//       } else {
//         setMessages((prev) => [ ...prev, { sender: "bot", text: `Please reply with "Yes" or "No".` }, ]);
//       }
//       return;
//     }
//     // Personal info flow
//     setResumeData((prev) => ({
//       ...prev,
//       personalInfo: { ...prev.personalInfo, [currentStep]: text, },
//     }));
//     const currentIndex = stepOrder.indexOf(currentStep);
//     const nextStep = stepOrder[currentIndex + 1];
//     if (nextStep) {
//       setMessages((prev) => [...prev, { sender: "bot", text: personalPrompts[nextStep] }]);
//       setCurrentStep(nextStep);
//     } else {
//       setMessages((prev) => [
//         ...prev,
//         { sender: "bot", text: "Details added! Now select the section you want to add to your resume." },
//       ]);
//     }
//   };
//   // Save form data
//   const handleFormSave = (section: SectionName, data: unknown) => {
//     setResumeData((prev) => {
//       const updated = { ...prev };
//       switch (section) {
//         case "Professional Summary":
//           updated.professionalSummary = data as string;
//           break;
//         case "Education":
//           updated.education = Array.isArray(data) ? data : [data];
//           break;
//         case "Work Experience":
//           updated.workExperience = Array.isArray(data) ? data : [data];
//           break;
//         case "Projects":
//           updated.projects = Array.isArray(data) ? data : [data];
//           break;
//         case "Certifications":
//           updated.certifications = Array.isArray(data) ? data : [data];
//           break;
//         case "Volunteering":
//           updated.volunteering = Array.isArray(data) ? data : [data];
//           break;
//         case "References":
//           updated.references = Array.isArray(data) ? data : [data];
//           break;
//         case "Internships":
//           updated.internships = Array.isArray(data) ? data : [data];
//           break;
//         case "Awards":
//           updated.awards = Array.isArray(data) ? data : [data];
//           break;
//         case "Skills":
//           updated.skills = Array.isArray(data) ? data : [data];
//           break;
//         case "Achievements":
//           updated.achievements = Array.isArray(data) ? data : [data];
//           break;
//       }
//       return updated;
//     });
//     // Show only the latest entry without quotes
//     let displayText = "";
//     if (typeof data === "string") {
//       displayText = data;
//     } else if (Array.isArray(data)) {
//       const last = data[data.length - 1];
//       displayText = Object.entries(last)
//         .map(([k, v]) => `${k}: ${v}`)
//         .join(", ");
//     }
//     setMessages((prev) => [
//       ...prev,
//       { sender: "user", text: displayText },
//       { sender: "bot", text: `Would you like to add another entry to ${section}? (Yes/No)` },
//     ]);
//     setAwaitingAddMore(section);
//   };
//   const formComponents: Record<SectionName, ReactElement> = {
//     "Professional Summary": <ProfessionalSummaryForm onSave={(data) => handleFormSave("Professional Summary", data)} />,
//     Education: <EducationForm onSave={(data: EducationEntry[]) => handleFormSave("Education", data)} />,
//     "Work Experience": <WorkExperienceForm onSave={(data: WorkEntry[]) => handleFormSave("Work Experience", data)} />,
//     Projects: <ProjectForm onSave={(data: ProjectEntry[]) => handleFormSave("Projects", data)} />,
//     Certifications: <CertificationForm onSave={(data: CertificationEntry[]) => handleFormSave("Certifications", data)} />,
//     Volunteering: <VolunteeringForm onSave={(data: VolunteeringEntry[]) => handleFormSave("Volunteering", data)} />,
//     References: <ReferenceForm onSave={(data: ReferenceEntry[]) => handleFormSave("References", data)} />,
//     Internships: <InternshipForm onSave={(data: InternshipEntry[]) => handleFormSave("Internships", data)} />,
//     Awards: <AwardForm onSave={(data: AwardEntry[]) => handleFormSave("Awards", data)} />,
//     Skills: <SkillsForm onSave={(data: string[]) => handleFormSave("Skills", data)} />,
//     Achievements: <AchievementForm onSave={(data: AchievementEntry[]) => handleFormSave("Achievements", data)} />,
//   };
//   const handleSectionSelect = (section: string) => {
//     setMessages((prev) => [
//       ...prev,
//       { sender: "bot", text: `Please enter details for ${section}.` },
//       { sender: "bot", form: formComponents[section as SectionName] },
//     ]);
//     setShowSectionButtons(false);
//   };
//   const personalInfoComplete = Object.values(resumeData.personalInfo).every((v) => v !== "");
//   const allSections: SectionName[] = [ "Professional Summary", "Education", "Work Experience", "Projects", "Certifications", "Volunteering", "References", "Internships", "Awards", "Skills", "Achievements", ];
//   const remainingSections = allSections.filter((s) => !disabledSections.includes(s));
//   return (
//     <div className="flex flex-col h-[90vh] bg-gray-50 p-4">
//       <div className="flex-1 overflow-y-scroll scrollbar-hide space-y-4 mb-4">
//         {messages.map((m, i) =>
//           m.sender === "user" ? (
//             <MessageBubble key={i} sender="user" text={m.text!} />
//           ) : (
//             <div key={i} className="flex flex-col space-y-2">
//               {m.text && <MessageBubble sender="bot" text={m.text} />}
//               {m.form && <div className="mt-2">{m.form}</div>}
//             </div>
//           )
//         )}
//         <div ref={messagesEndRef} />
//       </div>
//       {/* Input box */}
//       <div className="flex items-center bg-white gap-2 mb-3">
//         <input type="text" placeholder="Type your answer..."
//           className="flex-1 p-2 border border-gray-400 bg-gray-50 text-gray-600 rounded-full"
//           value={userInput}
//           onChange={(e) => setUserInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && handleUserSubmit()}
//         />
//         <button onClick={handleUserSubmit} className="px-4 py-2 bg-[#2557a7] text-white rounded-full">
//           <Send size={20} />
//         </button>
//       </div>
//       {personalInfoComplete && remainingSections.length > 0 && showSectionButtons && (
//         <SectionButtons onSelect={handleSectionSelect} disabledSections={disabledSections} />
//       )}
//       {personalInfoComplete && remainingSections.length === 0 && (
//         <div className="p-4 text-center text-gray-600 font-semibold">
//           All sections completed! Your resume is ready.
//         </div>
//       )}
//     </div>
//   );
// } before rasa



// "use client";
// import type { ReactElement } from "react";
// import { Send } from "lucide-react";
// import { useState, useEffect, useRef, useCallback } from "react";
// import { useResume } from "../../_context/ResumeContext";
// import MessageBubble from "./MessageBubble";
// import SectionButtons from "./SectionButtons";
// // Import forms
// import ProfessionalSummaryForm from "./forms/ProfessionalSummaryForm";
// import EducationForm from "./forms/EducationForm";
// import WorkExperienceForm from "./forms/WorkExperienceForm";
// import ProjectForm from "./forms/ProjectForm";
// import CertificationForm from "./forms/CertificationForm";
// import VolunteeringForm from "./forms/VolunteeringForm";
// import ReferenceForm from "./forms/ReferenceForm";
// import InternshipForm from "./forms/InternshipForm";
// import AwardForm from "./forms/AwardForm";
// import SkillsForm from "./forms/SkillsForm";
// import AchievementForm from "./forms/AchievementForm";

// // Types
// type EducationEntry = { school: string; degree: string; startDate: string; endDate: string };
// type WorkEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
// type ProjectEntry = { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string };
// type CertificationEntry = { name: string; issuedBy: string; year: string };
// type VolunteeringEntry = { organization: string; role: string; startDate: string; endDate: string };
// type ReferenceEntry = { name: string; relation: string; contact: string };
// type InternshipEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
// type AwardEntry = { title: string; issuedBy: string; year: string };
// type AchievementEntry = { title: string; date: string; description: string };
// type SectionName = | "Professional Summary" | "Education" | "Work Experience" | "Projects" | "Certifications" | "Volunteering" | "References" | "Internships" | "Awards" | "Skills" | "Achievements";
// interface Message { sender: "bot" | "user"; text?: string; form?: ReactElement; }

// // Rasa response type
// interface RasaResponse {
//   recipient_id: string;
//   text?: string;
// }

// export default function ResumeGPT() {
//   const { resumeData, setResumeData } = useResume();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [disabledSections, setDisabledSections] = useState<string[]>([]);
//   const [userInput, setUserInput] = useState("");
//   const [currentStep, setCurrentStep] = useState<keyof typeof resumeData.personalInfo>("name");
//   const [showSectionButtons, setShowSectionButtons] = useState(false);
//   const [awaitingAddMore, setAwaitingAddMore] = useState<SectionName | null>(null);
//   const [sessionId] = useState<string>(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
//   const [isRasaConnected, setIsRasaConnected] = useState(false);
  
//   // Auto-scroll
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
//   }, [messages]);

//   const RASA_API_URL = "http://localhost:8001/webhooks/rest/webhook";

//   const stepOrder: (keyof typeof resumeData.personalInfo)[] = [
//     "name",
//     "email",
//     "phone",
//     "location",
//     "linkedinurl",
//     "portifoliourl",
//   ];

//   // Function to send message to Rasa
//   const sendToRasa = async (message: string): Promise<void> => {
//     try {
//       const response = await fetch(RASA_API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sender: sessionId,
//           message: message,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const botResponses: RasaResponse[] = await response.json();
      
//       // Process bot responses
//       if (botResponses && botResponses.length > 0) {
//         setIsRasaConnected(true);
//         botResponses.forEach((botMsg) => {
//           if (botMsg.text) {
//             setMessages((prev) => [...prev, { sender: "bot", text: botMsg.text }]);
//           }
//         });
//       }
//     } catch (error) {
//       console.error("Rasa connection error:", error);
//       setIsRasaConnected(false);
//       // Fallback to local logic if Rasa is not available
//       handleLocalFallback(message);
//     }
//   };

//   // Local fallback logic when Rasa is unavailable
//   const handleLocalFallback = (text: string) => {
//     const personalPrompts: Record<keyof typeof resumeData.personalInfo, string> = {
//       name: "What's your full name?",
//       email: "Great! Now, what's your email?",
//       phone: "Nice! What's your phone number?",
//       location: "Thanks! Where are you located?",
//       linkedinurl: "Finally, What's your LinkedIn URL?",
//       portifoliourl: "What's your Portfolio link?",
//     };

//     // Handle "Add more?" logic
//     if (awaitingAddMore) {
//       if (text.toLowerCase() === "yes") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Sure! Please enter another entry for ${awaitingAddMore}.` },
//           { sender: "bot", form: formComponents[awaitingAddMore] },
//         ]);
//         setAwaitingAddMore(null);
//       } else if (text.toLowerCase() === "no") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Details added for ${awaitingAddMore}. Now select the next section.` },
//         ]);
//         setDisabledSections((prev) => [...prev, awaitingAddMore]);
//         setShowSectionButtons(true);
//         setAwaitingAddMore(null);
//       } else {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Please reply with "Yes" or "No".` },
//         ]);
//       }
//       return;
//     }

//     // Personal info flow
//     setResumeData((prev) => ({
//       ...prev,
//       personalInfo: { ...prev.personalInfo, [currentStep]: text },
//     }));

//     const currentIndex = stepOrder.indexOf(currentStep);
//     const nextStep = stepOrder[currentIndex + 1];

//     if (nextStep) {
//       setMessages((prev) => [...prev, { sender: "bot", text: personalPrompts[nextStep] }]);
//       setCurrentStep(nextStep);
//     } else {
//       setMessages((prev) => [
//         ...prev,
//         { sender: "bot", text: "Details added! Now select the section you want to add to your resume." },
//       ]);
//       setShowSectionButtons(true);
//     }
//   };

//   // Initialize conversation with Rasa
//   const initializeRasaConversation = useCallback(async () => {
//     try {
//       const response = await fetch(RASA_API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sender: sessionId,
//           message: "/greet",
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const botResponses: RasaResponse[] = await response.json();
      
//       if (botResponses && botResponses.length > 0) {
//         setIsRasaConnected(true);
//         botResponses.forEach((botMsg) => {
//           if (botMsg.text) {
//             setMessages((prev) => [...prev, { sender: "bot", text: botMsg.text }]);
//           }
//         });
//       }
//     } catch (error) {
//       console.error("Failed to connect to Rasa:", error);
//       setIsRasaConnected(false);
//       // Fallback to local greeting
//       setMessages([{ sender: "bot", text: "Hi! Let's build your resume. What's your full name?" }]);
//     }
//   }, [sessionId]);

//   // Initialize conversation with Rasa on mount
//   useEffect(() => {
//     initializeRasaConversation();
//   }, [initializeRasaConversation]);

//   // Handle user text input
//   const handleUserSubmit = async () => {
//     if (!userInput.trim()) return;
    
//     const text = userInput.trim();
//     setMessages((prev) => [...prev, { sender: "user", text }]);
//     setUserInput("");

//     // Check if we're in "Add more?" flow
//     if (awaitingAddMore) {
//       if (text.toLowerCase() === "yes") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Sure! Please enter another entry for ${awaitingAddMore}.` },
//           { sender: "bot", form: formComponents[awaitingAddMore] },
//         ]);
//         setAwaitingAddMore(null);
//         return;
//       } else if (text.toLowerCase() === "no") {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Details added for ${awaitingAddMore}. Now select the next section.` },
//         ]);
//         setDisabledSections((prev) => [...prev, awaitingAddMore]);
//         setShowSectionButtons(true);
//         setAwaitingAddMore(null);
//         return;
//       } else {
//         setMessages((prev) => [
//           ...prev,
//           { sender: "bot", text: `Please reply with "Yes" or "No".` },
//         ]);
//         return;
//       }
//     }

//     // Store personal info locally
//     setResumeData((prev) => ({
//       ...prev,
//       personalInfo: { ...prev.personalInfo, [currentStep]: text },
//     }));

//     // Send to Rasa if connected, otherwise use local fallback
//     if (isRasaConnected) {
//       await sendToRasa(text);
      
//       // Update current step for personal info
//       const currentIndex = stepOrder.indexOf(currentStep);
//       const nextStep = stepOrder[currentIndex + 1];
      
//       if (nextStep) {
//         setCurrentStep(nextStep);
//       } else {
//         setShowSectionButtons(true);
//       }
//     } else {
//       handleLocalFallback(text);
//     }
//   };

//   // Save form data
//   const handleFormSave = async (section: SectionName, data: unknown) => {
//     setResumeData((prev) => {
//       const updated = { ...prev };
//       switch (section) {
//         case "Professional Summary":
//           updated.professionalSummary = data as string;
//           break;
//         case "Education":
//           updated.education = [...prev.education, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Work Experience":
//           updated.workExperience = [...prev.workExperience, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Projects":
//           updated.projects = [...prev.projects, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Certifications":
//           updated.certifications = [...prev.certifications, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Volunteering":
//           updated.volunteering = [...prev.volunteering, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "References":
//           updated.references = [...prev.references, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Internships":
//           updated.internships = [...prev.internships, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Awards":
//           updated.awards = [...prev.awards, ...(Array.isArray(data) ? data : [data])];
//           break;
//         case "Skills":
//           updated.skills = Array.isArray(data) ? data : [data];
//           break;
//         case "Achievements":
//           updated.achievements = [...prev.achievements, ...(Array.isArray(data) ? data : [data])];
//           break;
//       }
//       return updated;
//     });

//     // Show only the latest entry without quotes
//     let displayText = "";
//     if (typeof data === "string") {
//       displayText = data;
//     } else if (Array.isArray(data)) {
//       const last = data[data.length - 1];
//       displayText = Object.entries(last)
//         .map(([k, v]) => `${k}: ${v}`)
//         .join(", ");
//     }

//     setMessages((prev) => [
//       ...prev,
//       { sender: "user", text: displayText },
//       { sender: "bot", text: `Would you like to add another entry to ${section}? (Yes/No)` },
//     ]);
    
//     setAwaitingAddMore(section);
//     setShowSectionButtons(false);

//     // Send form submission to Rasa if connected
//     if (isRasaConnected) {
//       await sendToRasa(`form_submitted: ${section}`);
//     }
//   };

//   const formComponents: Record<SectionName, ReactElement> = {
//     "Professional Summary": (
//       <ProfessionalSummaryForm onSave={(data) => handleFormSave("Professional Summary", data)} />
//     ),
//     Education: <EducationForm onSave={(data: EducationEntry[]) => handleFormSave("Education", data)} />,
//     "Work Experience": (
//       <WorkExperienceForm onSave={(data: WorkEntry[]) => handleFormSave("Work Experience", data)} />
//     ),
//     Projects: <ProjectForm onSave={(data: ProjectEntry[]) => handleFormSave("Projects", data)} />,
//     Certifications: (
//       <CertificationForm onSave={(data: CertificationEntry[]) => handleFormSave("Certifications", data)} />
//     ),
//     Volunteering: (
//       <VolunteeringForm onSave={(data: VolunteeringEntry[]) => handleFormSave("Volunteering", data)} />
//     ),
//     References: <ReferenceForm onSave={(data: ReferenceEntry[]) => handleFormSave("References", data)} />,
//     Internships: (
//       <InternshipForm onSave={(data: InternshipEntry[]) => handleFormSave("Internships", data)} />
//     ),
//     Awards: <AwardForm onSave={(data: AwardEntry[]) => handleFormSave("Awards", data)} />,
//     Skills: <SkillsForm onSave={(data: string[]) => handleFormSave("Skills", data)} />,
//     Achievements: (
//       <AchievementForm onSave={(data: AchievementEntry[]) => handleFormSave("Achievements", data)} />
//     ),
//   };

//   const handleSectionSelect = async (section: string) => {
//     setMessages((prev) => [
//       ...prev,
//       { sender: "user", text: section },
//       { sender: "bot", text: `Please enter details for ${section}.` },
//       { sender: "bot", form: formComponents[section as SectionName] },
//     ]);
//     setShowSectionButtons(false);

//     // Send section selection to Rasa if connected
//     if (isRasaConnected) {
//       await sendToRasa(section);
//     }
//   };

//   const personalInfoComplete = Object.values(resumeData.personalInfo).every((v) => v !== "");
//   const allSections: SectionName[] = [
//     "Professional Summary",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Volunteering",
//     "References",
//     "Internships",
//     "Awards",
//     "Skills",
//     "Achievements",
//   ];
//   const remainingSections = allSections.filter((s) => !disabledSections.includes(s));

//   return (
//     <div className="flex flex-col h-[90vh] bg-gray-50 p-4">
//       <div className="flex-1 overflow-y-scroll scrollbar-hide space-y-4 mb-4">
//         {messages.map((m, i) =>
//           m.sender === "user" ? (
//             <MessageBubble key={i} sender="user" text={m.text!} />
//           ) : (
//             <div key={i} className="flex flex-col space-y-2">
//               {m.text && <MessageBubble sender="bot" text={m.text} />}
//               {m.form && <div className="mt-2">{m.form}</div>}
//             </div>
//           )
//         )}
//         <div ref={messagesEndRef} />
//       </div>
      
//       {/* Input box */}
//       <div className="flex items-center bg-white gap-2 mb-3">
//         <input
//           type="text"
//           placeholder="Type your answer..."
//           className="flex-1 p-2 border border-gray-400 bg-gray-50 text-gray-600 rounded-full"
//           value={userInput}
//           onChange={(e) => setUserInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && handleUserSubmit()}
//         />
//         <button
//           onClick={handleUserSubmit}
//           className="px-4 py-2 bg-[#2557a7] text-white rounded-full"
//         >
//           <Send size={20} />
//         </button>
//       </div>
      
//       {personalInfoComplete && remainingSections.length > 0 && showSectionButtons && (
//         <SectionButtons onSelect={handleSectionSelect} disabledSections={disabledSections} />
//       )}
      
//       {personalInfoComplete && remainingSections.length === 0 && (
//         <div className="p-4 text-center text-gray-600 font-semibold">
//           All sections completed! Your resume is ready.
//         </div>
//       )}
//     </div>
//   );
// } before first message auto occur



"use client";
import type { ReactElement } from "react";
import { Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useResume } from "../../_context/ResumeContext";
import MessageBubble from "./MessageBubble";
import SectionButtons from "./SectionButtons";
// Import forms
import ProfessionalSummaryForm from "./forms/ProfessionalSummaryForm";
import EducationForm from "./forms/EducationForm";
import WorkExperienceForm from "./forms/WorkExperienceForm";
import ProjectForm from "./forms/ProjectForm";
import CertificationForm from "./forms/CertificationForm";
import VolunteeringForm from "./forms/VolunteeringForm";
import ReferenceForm from "./forms/ReferenceForm";
import InternshipForm from "./forms/InternshipForm";
import AwardForm from "./forms/AwardForm";
import SkillsForm from "./forms/SkillsForm";
import AchievementForm from "./forms/AchievementForm";

// Types
type EducationEntry = { school: string; degree: string; startDate: string; endDate: string };
type WorkEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
type ProjectEntry = { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string };
type CertificationEntry = { name: string; issuedBy: string; year: string };
type VolunteeringEntry = { organization: string; role: string; startDate: string; endDate: string };
type ReferenceEntry = { name: string; relation: string; contact: string };
type InternshipEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
type AwardEntry = { title: string; issuedBy: string; year: string };
type AchievementEntry = { title: string; date: string; description: string };
type SectionName = | "Professional Summary" | "Education" | "Work Experience" | "Projects" | "Certifications" | "Volunteering" | "References" | "Internships" | "Awards" | "Skills" | "Achievements";
interface Message { sender: "bot" | "user"; text?: string; form?: ReactElement; }

// Rasa response type
interface RasaResponse {
  recipient_id: string;
  text?: string;
}

export default function ResumeGPT() {
  const { resumeData, setResumeData } = useResume();
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hi! Let's build your resume. What's your full name?" }
  ]);
  const [disabledSections, setDisabledSections] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentStep, setCurrentStep] = useState<keyof typeof resumeData.personalInfo>("fullName");
  const [showSectionButtons, setShowSectionButtons] = useState(false);
  const [awaitingAddMore, setAwaitingAddMore] = useState<SectionName | null>(null);
  const [sessionId] = useState<string>(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isRasaConnected, setIsRasaConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // const RASA_API_URL = "http://localhost:8001/webhooks/rest/webhook";
  const RASA_API_URL = "/api/rasa";

  const stepOrder: (keyof typeof resumeData.personalInfo)[] = [
    "fullName",
    "email",
    "phone",
    "location",
    "linkedinUrl",
    "portifolioUrl",
  ];

  // Function to send message to Rasa
  const sendToRasa = async (message: string): Promise<void> => {
    try {
      const response = await fetch(RASA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sessionId,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const botResponses: RasaResponse[] = await response.json();
      
      // Process bot responses
      if (botResponses && botResponses.length > 0) {
        setIsRasaConnected(true);
        botResponses.forEach((botMsg) => {
          if (botMsg.text) {
            setMessages((prev) => [...prev, { sender: "bot", text: botMsg.text }]);
          }
        });
      }
    } catch (error) {
      console.error("Rasa connection error:", error);
      setIsRasaConnected(false);
      // Don't call handleLocalFallback here to avoid duplicate messages
    }
  };

  // Local fallback logic when Rasa is unavailable
  const handleLocalFallback = (text: string) => {
    const personalPrompts: Record<keyof typeof resumeData.personalInfo, string> = {
      fullName: "What's your full name?",
      email: "Great! Now, what's your email?",
      phone: "Nice! What's your phone number?",
      location: "Thanks! Where are you located?",
      linkedinUrl: "Finally, What's your LinkedIn URL?",
      portifolioUrl: "What's your Portfolio link?",
    };

    // Handle "Add more?" logic
    if (awaitingAddMore) {
      if (text.toLowerCase() === "yes") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Sure! Please enter another entry for ${awaitingAddMore}.` },
          { sender: "bot", form: formComponents[awaitingAddMore] },
        ]);
        setAwaitingAddMore(null);
      } else if (text.toLowerCase() === "no") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Details added for ${awaitingAddMore}. Now select the next section.` },
        ]);
        setDisabledSections((prev) => [...prev, awaitingAddMore]);
        setShowSectionButtons(true);
        setAwaitingAddMore(null);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Please reply with "Yes" or "No".` },
        ]);
      }
      return;
    }

    // Personal info flow
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [currentStep]: text },
    }));

    const currentIndex = stepOrder.indexOf(currentStep);
    const nextStep = stepOrder[currentIndex + 1];

    if (nextStep) {
      setMessages((prev) => [...prev, { sender: "bot", text: personalPrompts[nextStep] }]);
      setCurrentStep(nextStep);
    } else {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Details added! Now select the section you want to add to your resume." },
      ]);
      setShowSectionButtons(true);
    }
  };

  // Initialize conversation with Rasa
  const initializeRasaConversation = useCallback(async () => {
    if (isInitialized) return; // Prevent multiple initializations
    
    setIsInitialized(true);
    
    try {
      const response = await fetch(RASA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sessionId,
          message: "/greet",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const botResponses: RasaResponse[] = await response.json();
      
      if (botResponses && botResponses.length > 0) {
        setIsRasaConnected(true);
        // Clear default message and add Rasa's response
        setMessages(botResponses.map(msg => ({ sender: "bot" as const, text: msg.text })));
      }
    } catch (error) {
      console.error("Failed to connect to Rasa:", error);
      setIsRasaConnected(false);
      // Keep the default greeting message that was set in useState
    }
  }, [sessionId, isInitialized]);

  // Initialize conversation with Rasa on mount
  useEffect(() => {
    initializeRasaConversation();
  }, [initializeRasaConversation]);

  // Handle user text input
  const handleUserSubmit = async () => {
    if (!userInput.trim()) return;
    
    const text = userInput.trim();
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setUserInput("");

    // Check if we're in "Add more?" flow
    if (awaitingAddMore) {
      if (text.toLowerCase() === "yes") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Sure! Please enter another entry for ${awaitingAddMore}.` },
          { sender: "bot", form: formComponents[awaitingAddMore] },
        ]);
        setAwaitingAddMore(null);
        return;
      } else if (text.toLowerCase() === "no") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Details added for ${awaitingAddMore}. Now select the next section.` },
        ]);
        setDisabledSections((prev) => [...prev, awaitingAddMore]);
        setShowSectionButtons(true);
        setAwaitingAddMore(null);
        return;
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Please reply with "Yes" or "No".` },
        ]);
        return;
      }
    }

    // Store personal info locally
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [currentStep]: text },
    }));

    // Send to Rasa if connected, otherwise use local fallback
    if (isRasaConnected) {
      await sendToRasa(text);
      
      // Update current step for personal info
      const currentIndex = stepOrder.indexOf(currentStep);
      const nextStep = stepOrder[currentIndex + 1];
      
      if (nextStep) {
        setCurrentStep(nextStep);
      } else {
        setShowSectionButtons(true);
      }
    } else {
      handleLocalFallback(text);
    }
  };

  // Save form data
  const handleFormSave = async (section: SectionName, data: unknown) => {
    setResumeData((prev) => {
      const updated = { ...prev };
      switch (section) {
        case "Professional Summary":
          updated.professionalSummary = data as string;
          break;
        case "Education":
          updated.education = [...prev.education, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Work Experience":
          updated.workExperience = [...prev.workExperience, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Projects":
          updated.projects = [...prev.projects, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Certifications":
          updated.certifications = [...prev.certifications, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Volunteering":
          updated.volunteering = [...prev.volunteering, ...(Array.isArray(data) ? data : [data])];
          break;
        case "References":
          updated.references = [...prev.references, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Internships":
          updated.internships = [...prev.internships, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Awards":
          updated.awards = [...prev.awards, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Skills":
          updated.skills = Array.isArray(data) ? data : [data];
          break;
        case "Achievements":
          updated.achievements = [...prev.achievements, ...(Array.isArray(data) ? data : [data])];
          break;
      }
      return updated;
    });

    // Show only the latest entry without quotes
    let displayText = "";
    if (typeof data === "string") {
      displayText = data;
    } else if (Array.isArray(data)) {
      const last = data[data.length - 1];
      displayText = Object.entries(last)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: displayText },
      { sender: "bot", text: `Would you like to add another entry to ${section}? (Yes/No)` },
    ]);
    
    setAwaitingAddMore(section);
    setShowSectionButtons(false);

    // Send form submission to Rasa if connected
    if (isRasaConnected) {
      await sendToRasa(`form_submitted: ${section}`);
    }
  };

  const formComponents: Record<SectionName, ReactElement> = {
    "Professional Summary": (
      <ProfessionalSummaryForm onSave={(data) => handleFormSave("Professional Summary", data)} />
    ),
    Education: <EducationForm onSave={(data: EducationEntry[]) => handleFormSave("Education", data)} />,
    "Work Experience": (
      <WorkExperienceForm onSave={(data: WorkEntry[]) => handleFormSave("Work Experience", data)} />
    ),
    Projects: <ProjectForm onSave={(data: ProjectEntry[]) => handleFormSave("Projects", data)} />,
    Certifications: (
      <CertificationForm onSave={(data: CertificationEntry[]) => handleFormSave("Certifications", data)} />
    ),
    Volunteering: (
      <VolunteeringForm onSave={(data: VolunteeringEntry[]) => handleFormSave("Volunteering", data)} />
    ),
    References: <ReferenceForm onSave={(data: ReferenceEntry[]) => handleFormSave("References", data)} />,
    Internships: (
      <InternshipForm onSave={(data: InternshipEntry[]) => handleFormSave("Internships", data)} />
    ),
    Awards: <AwardForm onSave={(data: AwardEntry[]) => handleFormSave("Awards", data)} />,
    Skills: <SkillsForm onSave={(data: string[]) => handleFormSave("Skills", data)} />,
    Achievements: (
      <AchievementForm onSave={(data: AchievementEntry[]) => handleFormSave("Achievements", data)} />
    ),
  };

  const handleSectionSelect = async (section: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: section },
      { sender: "bot", text: `Please enter details for ${section}.` },
      { sender: "bot", form: formComponents[section as SectionName] },
    ]);
    setShowSectionButtons(false);

    // Send section selection to Rasa if connected
    if (isRasaConnected) {
      await sendToRasa(section);
    }
  };

  const personalInfoComplete = Object.values(resumeData.personalInfo).every((v) => v !== "");
  const allSections: SectionName[] = [
    "Professional Summary",
    "Education",
    "Work Experience",
    "Projects",
    "Certifications",
    "Volunteering",
    "References",
    "Internships",
    "Awards",
    "Skills",
    "Achievements",
  ];
  const remainingSections = allSections.filter((s) => !disabledSections.includes(s));

  return (
    <div className="flex flex-col h-[90vh] bg-gray-50 p-4">
      <div className="flex-1 overflow-y-scroll scrollbar-hide space-y-4 mb-4">
        {messages.map((m, i) =>
          m.sender === "user" ? (
            <MessageBubble key={i} sender="user" text={m.text!} />
          ) : (
            <div key={i} className="flex flex-col space-y-2">
              {m.text && <MessageBubble sender="bot" text={m.text} />}
              {m.form && <div className="mt-2">{m.form}</div>}
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input box */}
      <div className="flex items-center bg-white gap-2 mb-3">
        <input
          type="text"
          placeholder="Type your answer..."
          className="flex-1 p-2 border border-gray-400 bg-gray-50 text-gray-600 rounded-full"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUserSubmit()}
        />
        <button
          onClick={handleUserSubmit}
          className="px-4 py-2 bg-[#2557a7] text-white rounded-full"
        >
          <Send size={20} />
        </button>
      </div>
      
      {personalInfoComplete && remainingSections.length > 0 && showSectionButtons && (
        <SectionButtons onSelect={handleSectionSelect} disabledSections={disabledSections} />
      )}
      
      {personalInfoComplete && remainingSections.length === 0 && (
        <div className="p-4 text-center text-gray-600 font-semibold">
          All sections completed! Your resume is ready.
        </div>
        )}
    </div>
  );
}




