"use client";
import type { ReactElement } from "react";
import { Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useResume } from "../../_context/ResumeContext";
import MessageBubble from "./MessageBubble";
import SectionButtons from "./SectionButtons";
import logger from "@/lib/logger";
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
import LanguagesForm from "./forms/LanguagesForm";
import HobbiesForm from "./forms/HobbiesForm";
import InterestsForm from "./forms/InterestsForm";
import PublicationsForm from "./forms/PublicationsForm";

// Types
type EducationEntry = { school: string; degree: string; startDate: string; endDate: string };
type WorkEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
type ProjectEntry = { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string };
type CertificationEntry = { name: string; 
    issuedBy: string; 
    year: string; 
    expiryDate?: string;
    credentialId?: string; }
type VolunteeringEntry = { organization: string; role: string; startDate: string; endDate: string };
type ReferenceEntry = { name: string; relation: string; contact: string };
type InternshipEntry = { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string };
type AwardEntry = { title: string; issuedBy: string; year: string };
type AchievementEntry = { title: string; date: string; description: string };
type PublicationsEntry = { title: string; authors: string; publicationName: string; date: string; url: string; };
type HobbiesEntry = { name: string; description: string; proficiencyLevel?: string; achievement?: string; };
type InterestEntry = { name: string; description: string; category?: string; };
type LanguageEntry = { language: string; proficiency: string; };
type SectionName = | "Professional Summary" | "Education" | "Work Experience" | "Projects" | "Certifications" | "Volunteering" | "References" | "Internships" | "Awards" | "Skills" | "Achievements" | "Languages" | "Hobbies" | "Interests" | "Publications";
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
  const [currentStep, setCurrentStep] = useState<keyof typeof resumeData.personalInfo>("fullname");
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

  // const RASA_API_URL = "http://localhost:5005/webhooks/rest/webhook";
  const RASA_API_URL = "/api/rasa";

  const stepOrder: (keyof typeof resumeData.personalInfo)[] = [
    "fullname",
    "email",
    "phone",
    "location",
    "linkedinUrl",
    "portifolioUrl",
  ];

  // Personal info prompts mapping
  const personalPrompts: Record<keyof typeof resumeData.personalInfo, string> = {
    fullname: "Hi! Let's build your resume. What's your full name?",
    email: "Great! Now, what's your email?",
    phone: "Nice! What's your phone number?",
    location: "Thanks! Where are you located?",
    linkedinUrl: "Finally, What's your LinkedIn URL?",
    portifolioUrl: "What's your Portfolio link?",
  };

  // ✅ Initialize conversation with existing data from resumeData
  useEffect(() => {
    if (isInitialized) return; // Only run once

    const initialMessages: Message[] = [];
    const filledSections: SectionName[] = [];

    // Check each personal info step in order and show filled data as conversation
    let lastFilledIndex = -1;

    stepOrder.forEach((step, index) => {
      const value = resumeData.personalInfo[step];
      if (value && value.trim()) {

        // For the first message, include greeting
        if (index === 0 && step === "fullname") {
          initialMessages.push({
            sender: "bot",
            text: "Hi! Let's build your resume. What's your full name?"
          });
        } else {
          // For subsequent messages, use the standard prompt
          const promptWithoutGreeting = step === "fullname"
            ? "What's your full name?"
            : personalPrompts[step];
          initialMessages.push({
            sender: "bot",
            text: promptWithoutGreeting
          });
        }

        // Add user's answer
        initialMessages.push({
          sender: "user",
          text: value
        });

        lastFilledIndex = index;
      }
    });

    // Check if sections have data and add them to disabled/filled sections
    if (resumeData.professionalSummary?.summary?.trim()) {
      filledSections.push("Professional Summary");
      initialMessages.push({ sender: "bot", text: "Please enter details for Professional Summary." });
      initialMessages.push({ sender: "user", text: resumeData.professionalSummary.summary });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Professional Summary? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.education && resumeData.education.length > 0) {
      filledSections.push("Education");
      resumeData.education.forEach((edu) => {
        const eduText = `${edu.degree} at ${edu.school} (${edu.startDate} - ${edu.endDate})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Education." });
        initialMessages.push({ sender: "user", text: eduText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Education? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      filledSections.push("Work Experience");
      resumeData.workExperience.forEach((work) => {
        const workText = `${work.role} at ${work.company} (${work.startDate} - ${work.currentlyWorking ? 'Present' : work.endDate})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Work Experience." });
        initialMessages.push({ sender: "user", text: workText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Work Experience? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.projects && resumeData.projects.length > 0) {
      filledSections.push("Projects");
      resumeData.projects.forEach((project) => {
        const projectText = `${project.title}: ${project.description}`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Projects." });
        initialMessages.push({ sender: "user", text: projectText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Projects? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.skills && resumeData.skills.length > 0) {
      filledSections.push("Skills");
      const skillsText = resumeData.skills.join(", ");
      initialMessages.push({ sender: "bot", text: "Please enter details for Skills." });
      initialMessages.push({ sender: "user", text: skillsText });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Skills? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
      filledSections.push("Certifications");
      resumeData.certifications.forEach((cert) => {
        const certText = `${cert.name} by ${cert.issuedBy} (${cert.year})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Certifications." });
        initialMessages.push({ sender: "user", text: certText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Certifications? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.achievements && resumeData.achievements.length > 0) {
      filledSections.push("Achievements");
      resumeData.achievements.forEach((ach) => {
        const achText = `${ach.title} (${ach.date})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Achievements." });
        initialMessages.push({ sender: "user", text: achText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Achievements? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.volunteering && resumeData.volunteering.length > 0) {
      filledSections.push("Volunteering");
      resumeData.volunteering.forEach((vol) => {
        const volText = `${vol.role} at ${vol.organization} (${vol.startDate} - ${vol.endDate})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Volunteering." });
        initialMessages.push({ sender: "user", text: volText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Volunteering? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.internships && resumeData.internships.length > 0) {
      filledSections.push("Internships");
      resumeData.internships.forEach((intern) => {
        const internText = `${intern.role} at ${intern.company} (${intern.startDate} - ${intern.currentlyWorking ? 'Present' : intern.endDate})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Internships." });
        initialMessages.push({ sender: "user", text: internText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Internships? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.awards && resumeData.awards.length > 0) {
      filledSections.push("Awards");
      resumeData.awards.forEach((award) => {
        const awardText = `${award.title} by ${award.issuedBy} (${award.year})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Awards." });
        initialMessages.push({ sender: "user", text: awardText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Awards? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.references && resumeData.references.length > 0) {
      filledSections.push("References");
      resumeData.references.forEach((ref) => {
        const refText = `${ref.name} (${ref.relation}): ${ref.contact}`;
        initialMessages.push({ sender: "bot", text: "Please enter details for References." });
        initialMessages.push({ sender: "user", text: refText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to References? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.languages && resumeData.languages.length > 0) {
      filledSections.push("Languages");
      resumeData.languages.forEach((lang) => {
        const langText = `${lang.language}: ${lang.proficiency}`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Languages." });
        initialMessages.push({ sender: "user", text: langText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Languages? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.hobbies && resumeData.hobbies.length > 0) {
      filledSections.push("Hobbies");
      resumeData.hobbies.forEach((hobby) => {
        const hobbyText = `${hobby.name}: ${hobby.description}`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Hobbies." });
        initialMessages.push({ sender: "user", text: hobbyText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Hobbies? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.interests && resumeData.interests.length > 0) {
      filledSections.push("Interests");
      resumeData.interests.forEach((interest) => {
        const interestText = `${interest.name}: ${interest.description}`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Interests." });
        initialMessages.push({ sender: "user", text: interestText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Interests? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    if (resumeData.publications && resumeData.publications.length > 0) {
      filledSections.push("Publications");
      resumeData.publications.forEach((pub) => {
        const pubText = `${pub.title} in ${pub.publicationName} (${pub.date})`;
        initialMessages.push({ sender: "bot", text: "Please enter details for Publications." });
        initialMessages.push({ sender: "user", text: pubText });
      });
      initialMessages.push({ sender: "bot", text: "Would you like to add another entry to Publications? (Yes/No)" });
      initialMessages.push({ sender: "user", text: "No" });
    }

    // Determine next step based on filled data
    const nextStep = stepOrder[lastFilledIndex + 1];

    if (lastFilledIndex === -1 && filledSections.length === 0) {
      // No data filled at all, keep default greeting
      setMessages([{ sender: "bot", text: personalPrompts.fullname }]);
      setCurrentStep("fullname");
    } else if (nextStep) {
      // Some personal info filled, continue from next step
      initialMessages.push({
        sender: "bot",
        text: personalPrompts[nextStep]
      });
      setMessages(initialMessages);
      setCurrentStep(nextStep);
    } else {
      // All personal info filled, show section buttons
      initialMessages.push({
        sender: "bot",
        text: "Details added! Now select the section you want to add to your resume."
      });
      setMessages(initialMessages);
      setShowSectionButtons(true);
      setDisabledSections(filledSections);
    }

    setIsInitialized(true);
  }, [resumeData, isInitialized]);

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
      logger.error("Rasa connection error:", error);
      setIsRasaConnected(false);
      // Don't call handleLocalFallback here to avoid duplicate messages
    }
  };

  // Local fallback logic when Rasa is unavailable
  const handleLocalFallback = (text: string) => {
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

  // Initialize conversation with Rasa (disabled when we have existing data)
  const initializeRasaConversation = useCallback(async () => {
    // Don't initialize Rasa if we already have data initialized
    if (isInitialized) return;

    // Check if resumeData has any existing data
    const hasPersonalInfo = Object.values(resumeData.personalInfo).some(v => v && v.trim());
    const hasSectionData =
      (resumeData.education && resumeData.education.length > 0) ||
      (resumeData.workExperience && resumeData.workExperience.length > 0) ||
      (resumeData.projects && resumeData.projects.length > 0) ||
      (resumeData.skills && resumeData.skills.length > 0);

    // If we have existing data, don't try to initialize Rasa
    // The data initialization useEffect will handle it
    if (hasPersonalInfo || hasSectionData) {
      return;
    }

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
      logger.error("Failed to connect to Rasa:", error);
      setIsRasaConnected(false);
      // Keep the default greeting message that was set in useState
    }
  }, [sessionId, isInitialized, resumeData]);

  // Initialize conversation with Rasa on mount (only if no existing data)
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
        case "Languages":
          updated.languages = [...prev.languages, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Hobbies":
          updated.hobbies = [...prev.hobbies, ...(Array.isArray(data) ? data : [data])];
          break;
        case "Interests":
          updated.interests = [...prev.interests, ...(Array.isArray(data) ? data : [data])];
          break;  
        case "Publications":
          updated.publications = [...prev.publications, ...(Array.isArray(data) ? data : [data])];
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
    Languages: (
      <LanguagesForm onSave={(data: LanguageEntry[]) => handleFormSave("Languages", data)} />
    ),
    Hobbies: (
      <HobbiesForm onSave={(data: HobbiesEntry[]) => handleFormSave("Hobbies", data)} />
    ),
    Interests: (
      <InterestsForm onSave={(data: InterestEntry[]) => handleFormSave("Interests", data)} />
    ),
    Publications: (
      <PublicationsForm onSave={(data: PublicationsEntry[]) => handleFormSave("Publications", data)} />
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
    "Languages",
    "Hobbies",
    "Interests",
    "Publications",
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




