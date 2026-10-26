import type { ComponentType } from "react";
import {
  Anchor, Award, BadgeCheck, BookOpen, Briefcase, CodeXml, FileSearch, FileSignature, FileText,
  FlaskConical, Folder, GraduationCap, Globe, Heart, Medal, Presentation, Settings, Trophy, User, Users,
} from "lucide-react";

/** What a section icon accepts (lucide icons and the older react-icons both fit). */
export type SectionIcon = ComponentType<{ size?: number | string; className?: string }>;

export interface Section {
  name: string;
  ai: boolean;
}

export const initialSections: Section[] = [
  { name: "Personal Info", ai: false },
  { name: "Professional Summary", ai: true },
  { name: "Service Record", ai: false },
  { name: "Education", ai: false },
  { name: "Skills", ai: false },
  { name: "Work Experience", ai: true },
  { name: "Vessels Operated", ai: false },
  { name: "Ports Experience", ai: false },
  { name: "Sea Service Record", ai: false },
  { name: "Maritime Certifications", ai: false },
  { name: "Research Grants", ai: false },
  { name: "Editorial Activities", ai: false },
  { name: "Conference Presentations", ai: false },
  { name: "Projects", ai: true },
  { name: "Certifications", ai: false },
  { name: "Licenses and Credentials", ai: false },
  { name: "Certificates and Clearances", ai: false },
  { name: "Bar Admissions and Licenses", ai: false },
  { name: "Internships", ai:true},
];

export const sectionIcons: Record<string, SectionIcon> = {
  "Personal Info": User,
  "Professional Summary": FileText,
  "Service Record": FileSignature,
  "Education": GraduationCap,
  "Work Experience": Briefcase,
  "Vessels Operated": Anchor,
  "Ports Experience": Anchor,
  "Sea Service Record": FileSignature,
  "Maritime Certifications": Award,
  "Research Grants": FlaskConical,
  "Editorial Activities": FileText,
  "Conference Presentations": Presentation,
  "Projects": Folder,
  "Skills": Settings,
  "Certifications": Award,
  "Licenses and Credentials": BadgeCheck,
  "Certificates and Clearances": BadgeCheck,
  "Bar Admissions and Licenses": BadgeCheck,
  "Achievements": Trophy,
  "Volunteering": Users,
  "Volunteer Experience": Users,
  "References": User,
  "Internships": FileText,
  "Awards": Trophy,
  "Awards & Scholarships": Trophy,
  "Languages": Globe,
  "Publications": BookOpen,
  "Patents": FileSearch,
  "Hobbies": Heart,
  "Interests": Heart,
  "Interests & Hobbies": Heart,
  "Additional Information": FileText,
  "Custom Section": CodeXml,
  "Declaration": FileSignature,
};
void Medal;

// ✅ Required fields for completion check
export const sectionRequiredFields: Record<string, string[]> = {
  "Personal Info": ["firstName", "lastName", "email", "phone"],
  "Professional Summary": ["summary"],
  "Education": ["degree", "institution", "year"],
  "Work Experience": ["company", "role", "duration"],
  "Projects": ["projectName", "description"],
  "Skills": ["skills"], // could be a list
  "Certifications": ["title", "issuedBy"],
  // Optional sections can be added here
};

// Country codes
export const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+1-647", country: "Canada", flag: "🇨🇦" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
];
