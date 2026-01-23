// import { IconType } from "react-icons";
// import { FaUserCircle, FaFileAlt, FaUserGraduate, FaBriefcase, FaFolderOpen, FaStar, FaAward, FaMedal, FaUsers, FaBuilding, FaTrophy, FaHandHoldingHeart } from "react-icons/fa";

// export interface Section {
//   name: string;
//   // desc: string;
//   ai: boolean;
// }

// export const initialSections: Section[] = [
//   { name: "Personal Info", ai: false },
//   { name: "Professional Summary",  ai: true },
//   { name: "Education",  ai: false },
//   { name: "Work Experience",  ai: true },
//   { name: "Projects",  ai: true },
//   { name: "Skills",  ai: true },
//   { name: "Certifications",  ai: false },
// ];

// export const sectionIcons: Record<string, IconType> = {
//   "Personal Info": FaUserCircle,
//   "Professional Summary": FaFileAlt,
//   "Education": FaUserGraduate,
//   "Work Experience": FaBriefcase,
//   "Projects": FaFolderOpen,
//   "Skills": FaStar,
//   "Certifications": FaAward,
//   "Achievements": FaMedal,
//   "Volunteering": FaHandHoldingHeart,
//   "References": FaUsers,
//   "Internships": FaBuilding,
//   "Awards": FaTrophy,
// };

// // Country codes
// export const countryCodes = [
//   { code: "+91", country: "India", flag: "🇮🇳" },
//   { code: "+1", country: "USA", flag: "🇺🇸" },
//   { code: "+44", country: "UK", flag: "🇬🇧" },
// ];





import { IconType } from "react-icons";
import {
  FaUserCircle, FaFileAlt, FaUserGraduate, FaBriefcase,
  FaFolderOpen, FaStar, FaAward, FaMedal, FaUsers,
  FaBuilding, FaTrophy, FaHandHoldingHeart
} from "react-icons/fa";
import { MdLanguage } from 'react-icons/md';
import { LuFileBadge } from 'react-icons/lu';
import { RiAlignRight } from 'react-icons/ri';

export interface Section {
  name: string;
  ai: boolean;
}

export const initialSections: Section[] = [
  { name: "Personal Info", ai: false },
  { name: "Professional Summary", ai: true },
  { name: "Education", ai: false },
  { name: "Skills", ai: false },
  { name: "Work Experience", ai: true },
  { name: "Projects", ai: true },
  { name: "Certifications", ai: false },
  { name: "Internships", ai:true},
];

export const sectionIcons: Record<string, IconType> = {
  "Personal Info": FaUserCircle,
  "Professional Summary": FaFileAlt,
  "Education": FaUserGraduate,
  "Work Experience": FaBriefcase,
  "Projects": FaFolderOpen,
  "Skills": FaStar,
  "Certifications": FaAward,
  "Achievements": FaMedal,
  "Volunteering": FaHandHoldingHeart,
  "References": FaUsers,
  "Internships": FaBuilding,
  "Awards": FaTrophy,
  "Languages": MdLanguage,
  "Publications": LuFileBadge,
  "Hobbies": RiAlignRight,
  "Interests": RiAlignRight,

};

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
];
