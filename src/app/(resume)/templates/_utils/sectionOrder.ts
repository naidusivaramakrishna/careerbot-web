export const getSectionOrder = (careerLevel?: string): string[] => {
  const level = careerLevel?.toLowerCase() || '';

  if (level.includes('fresher')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  if (level.includes('early')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  if (level.includes('mid')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Certifications',
      'Internships',
      'Education',
    ];
  }

  if (level.includes('senior')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Certifications',
      'Internships',
      'Education',
    ];
  }

  if (level.includes('manager')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Certifications',
      'Internships',
      'Education',
    ];
  }

  // Default order for unknown levels
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
