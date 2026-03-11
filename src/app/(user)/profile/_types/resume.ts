export interface ResumeData {
  personalInfo: { name: string; email: string; phone: string; location: string };
  professionalSummary: string;
  education: { school: string; degree: string; year: string }[];
  workExperience: { company: string; role: string; duration: string; description: string }[];
  projects: { title: string; description: string; technologies: string }[];
  skills: string[];
  certifications: { name: string; issuedBy: string; year: string }[];
  achievements: string[];
  volunteering: { organization: string; role: string; duration: string }[];
  references: { name: string; relation: string; contact: string }[];
  internships: { company: string; role: string; duration: string; description: string }[];
  awards: { title: string; issuedBy: string; year: string }[];
}
