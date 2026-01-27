export interface AnalysisItem {
  id: number;
  issue: string;
  description: string;
  fix: string;
  severity: "High" | "Medium" | "Positive";
  points: number;
}

export const breakdownData = [
  { label: "Keywords", scoreValue: 78 },
  { label: "Formatting", scoreValue: 72 },
  { label: "Skills Match", scoreValue: 68 },
  { label: "Readability", scoreValue: 91 },
  { label: "Grammar", scoreValue: 95 },
];

export const initialAnalysisData: AnalysisItem[] = [
  {
    id: 1,
    issue: "Missing ATS-friendly formatting",
    description: "Your resume uses complex tables that ATS systems cannot parse properly.",
    fix: "Convert tables to simple bullet points and sections.",
    severity: "High",
    points: 8,
  },
  {
    id: 2,
    issue: "Limited keyword optimization",
    description: "Only 45% keyword match with target job descriptions in your industry.",
    fix: "Include more industry-specific keywords and technical skills.",
    severity: "Medium",
    points: 7,
  },
  {
    id: 3,
    issue: "Strong contact information",
    description: "All essential contact details are present and properly formatted.",
    fix: "Consider adding a LinkedIn profile for better networking opportunities.",
    severity: "Positive",
    points: 4,
  },
];
