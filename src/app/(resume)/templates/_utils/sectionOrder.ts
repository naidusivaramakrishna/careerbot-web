export const getSectionOrder = (careerLevel?: string): string[] => {
  // Only return main sections (initialSections), not extra sections.
  // Extra sections (Awards, Languages, Achievements, etc.) should be in the "Add New Section" list.
  return [
    'Personal Info',
    'Professional Summary',
    'Education',
    'Skills',
    'Work Experience',
    'Projects',
    'Certifications',
    'Internships',
  ];
};
