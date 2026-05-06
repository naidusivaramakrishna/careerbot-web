export const getSectionOrder = (careerLevel?: string): string[] => {
  const normalizedLevel = careerLevel?.toLowerCase().trim();

  switch (normalizedLevel) {
    case 'fresher':
      return [
        'Personal Info',
        'Professional Summary',
        'Skills',
        'Projects',
        'Education',
        'Certifications',
        'Internships',
        'Awards',
        'Languages',
        'Achievements',
        'Volunteering',
        'References',
        'Publications',
        'Hobbies',
        'Interests',
      ];

    case 'early career':
    case 'early_career':
      return [
        'Personal Info',
        'Professional Summary',
        'Skills',
        'Work Experience',
        'Education',
        'Certifications',
        'Projects',
        'Internships',
        'Awards',
        'Languages',
        'Achievements',
        'Volunteering',
        'References',
        'Publications',
        'Hobbies',
        'Interests',
      ];

    case 'mid-level':
    case 'mid_level':
    case 'mid level':
      return [
        'Personal Info',
        'Professional Summary',
        'Skills',
        'Work Experience',
        'Certifications',
        'Education',
        'Projects',
        'Awards',
        'Languages',
        'Achievements',
        'Internships',
        'Volunteering',
        'References',
        'Publications',
        'Hobbies',
        'Interests',
      ];

    case 'senior-level':
    case 'senior_level':
    case 'senior level':
      return [
        'Personal Info',
        'Professional Summary',
        'Skills',
        'Work Experience',
        'Certifications',
        'Education',
        'Awards',
        'Projects',
        'Languages',
        'Achievements',
        'Volunteering',
        'References',
        'Publications',
        'Hobbies',
        'Interests',
      ];

    default:
      return [
        'Personal Info',
        'Professional Summary',
        'Skills',
        'Work Experience',
        'Education',
        'Certifications',
        'Projects',
        'Internships',
        'Awards',
        'Languages',
        'Achievements',
        'Volunteering',
        'References',
        'Publications',
        'Hobbies',
        'Interests',
      ];
  }
};
