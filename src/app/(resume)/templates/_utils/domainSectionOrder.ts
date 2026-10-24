/**
 * Mapping from backend section keys to frontend display names.
 * Used to identify known template sections vs. custom user-added sections.
 */
export const SECTION_KEY_TO_DISPLAY_NAME: Record<string, string> = {
  // Personal Info
  'personalInfo': 'Personal Info',
  'personal_details': 'Personal Info',

  // Summary/Objective
  'professional_summary': 'Professional Summary',
  'objective': 'Professional Summary',
  'executive_summary': 'Professional Summary',

  // Skills
  'skills': 'Skills',
  'core_competencies': 'Skills',
  'skills_and_tools': 'Skills',
  'technical_skills': 'Skills',

  // Work Experience
  'experience': 'Work Experience',
  'workExperience': 'Work Experience',
  'professional_experience': 'Work Experience',
  'service_history': 'Work Experience',
  'teaching_experience': 'Work Experience',

  // Education
  'education': 'Education',

  // Certifications & Licenses
  'certifications': 'Certifications',
  'licenses_credentials': 'Licenses and Credentials',
  'bar_admissions_and_licenses': 'Bar Admissions and Licenses',
  'certificates_and_clearances': 'Certificates and Clearances',
  'maritime_certifications': 'Maritime Certifications',

  // Projects
  'projects': 'Projects',

  // Publications & Research
  'publications': 'Publications',
  'publications_and_conferences': 'Publications',
  'publications_speaking': 'Publications',
  'research_grants': 'Research Grants',
  'editorial_activities': 'Editorial Activities',
  'conference_presentations': 'Conference Presentations',

  // Additional Sections
  'internships': 'Internships',
  'achievements': 'Achievements',
  'key_achievements': 'Achievements',
  'awards': 'Awards',
  'volunteering': 'Volunteering',
  'languages': 'Languages',
  'references': 'References',
  'hobbies': 'Hobbies',
  'interests': 'Interests',
  'patents': 'Patents',

  // Domain-Specific Sections
  'service_record': 'Service Record',
  'practice_areas': 'Practice Areas',
  'key_matters': 'Key Matters',
  'vessels_operated': 'Vessels Operated',
  'ports_experience': 'Ports Experience',
  'sea_service_record': 'Sea Service Record',
  'key_metrics': 'Key Metrics',

  // Always Last
  'declaration': 'Declaration',
};

/**
 * Extract section order from backend template's sections config
 */
export const getSectionOrderFromTemplate = (
  templateSections?: Record<string, Record<string, unknown> | undefined>
): string[] => {
  if (!templateSections || typeof templateSections !== 'object') {
    return [];
  }

  // Build array of {section, order} then sort by order
  const sections = Object.entries(templateSections)
    .filter(([, config]) => {
      if (!config || typeof config !== 'object') return false;
      const enabled = (config as Record<string, unknown>).enabled;
      const order = (config as Record<string, unknown>).order;
      return enabled !== false && order !== undefined;
    })
    .map(([key, config]) => {
      const configObj = config as Record<string, unknown>;
      // Use the mapping first (preferred), fall back to label, then to key
      const displayName = SECTION_KEY_TO_DISPLAY_NAME[key] || (configObj.label as string) || key;
      return {
        key,
        displayName,
        order: (configObj.order as number) ?? 999,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(s => s.displayName);

  return sections;
};

/**
 * Add career-level specific sections to the extracted section order
 * For example, Freshers should have Internships section
 */
export const addCareerLevelSections = (
  sections: string[],
  careerLevel?: string
): string[] => {
  const result = [...sections];
  const careerLowercase = (careerLevel || '').toLowerCase();

  // Freshers should have Internships section
  if (careerLowercase.includes('fresher')) {
    // Add Internships before Education if not already present
    if (!result.includes('Internships')) {
      const educationIdx = result.indexOf('Education');
      if (educationIdx >= 0) {
        result.splice(educationIdx, 0, 'Internships');
      } else {
        result.push('Internships');
      }
    }
  }

  return result;
};

/**
 * Domain-family and career-level specific section ordering
 * Different domain families show different sections as main sections
 * For Mid-Level and above (Senior-Level, Lead, Architect, Manager, Director, VP), Education moves to the end
 */

export const getSectionOrderByDomainAndCareer = (
  domainFamily?: string,
  careerLevel?: string
): string[] => {
  // Get base domain-specific order
  const baseOrder = getDomainSectionOrder(domainFamily);

  // For Mid-Level and above: move Education to end
  const level = careerLevel?.toLowerCase() || '';
  const isAdvancedLevel = level.includes('mid') || level.includes('senior') || level.includes('lead') || level.includes('architect') || level.includes('manager') || level.includes('director') || level.includes('vice');

  // For Research Scholar at Senior-Level and above, Publications moves before Work Experience
  const domain = domainFamily?.toLowerCase() || '';
  const isResearchSenior = domain.includes('research') && isAdvancedLevel;

  if (isAdvancedLevel && baseOrder.includes('Education')) {
    // Declaration must always stay last — pull it out, reorder, put it back
    const hasDeclaration = baseOrder.includes('Declaration');
    const withoutFixed = baseOrder.filter(s => s !== 'Education' && s !== 'Declaration');

    let reordered = [...withoutFixed];

    // Research Scholar senior: Publications before Work Experience
    if (isResearchSenior && reordered.includes('Publications') && reordered.includes('Work Experience')) {
      const withoutPub = reordered.filter(s => s !== 'Publications');
      const weIdx = withoutPub.indexOf('Work Experience');
      withoutPub.splice(weIdx, 0, 'Publications');
      reordered = withoutPub;
    }

    const finalOrder = [...reordered, 'Education', ...(hasDeclaration ? ['Declaration'] : [])];
    return finalOrder;
  }

  return baseOrder;
};

export const getDomainSectionOrder = (domainFamily?: string): string[] => {
  const domain = domainFamily?.toLowerCase() || '';

  // Healthcare: Certifications & Licenses moved up before Skills
  if (domain.includes('healthcare')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Licenses and Credentials',
      'Certifications',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Internships',
    ];
  }

  // Finance: Includes Publications, Projects
  if (domain.includes('finance')) {
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

  // Education: Includes Publications
  if (domain.includes('education')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Publications',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Cybersecurity: Work Experience before Skills
  if (domain.includes('cybersecurity')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Certificates and Clearances',
      // Keep the existing Certifications section: resumes created before this
      // domain section existed store their certificates in `certifications`.
      'Certifications',
      'Skills',
      'Work Experience',
      'Projects',
      'Publications',
      'Education',
      'Internships',
    ];
  }

  // Government: Declaration is mandatory and always last
  if (domain.includes('government')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Service Record',
      'Work Experience',
      'Skills',
      'Projects',
      'Education',
      'Certifications',
      'Internships',
      'Declaration',
    ];
  }
  // Legal: Standard order with all sections
  if (domain.includes('legal')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Bar Admissions and Licenses',
      'Certificates and Clearances',
      'Certifications',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Publications',
      'Education',
      'Internships'
    ];
  }

  // Electronics & VLSI: Work Experience before Skills
  if (domain.includes('electronics')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Certifications',
      'Internships'
    ];
  }

  // Logistics & Warehouse Operations: Standard order
  if (domain.includes('logistics')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Internships'
    ];
  }

  // Marine & Merchant Navy: Standard order
  if (domain.includes('marine')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Maritime Certifications',
      'Certifications',
      'Skills',
      'Work Experience',
      'Vessels Operated',
      'Ports Experience',
      'Sea Service Record',
      'Projects',
      'Education',
      'Internships',
    ];
  }

  // Research Scholar: Includes Publications, Research Grants, Editorial Activities, Conference Presentations
  if (domain.includes('research')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Publications',
      'Research Grants',
      'Editorial Activities',
      'Conference Presentations',
      'Education',
      'Internships',
    ];
  }

  // Sales & Business Development: Standard order
  if (domain.includes('sales')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Certifications',
      'Education',
      'Internships',
    ];
  }

  // Core Engineering: Standard order with all sections
  if (domain.includes('core_engineering')) {
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

  // Software Engineering: Standard order with all sections
  if (domain.includes('software')) {
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

  // Human Resources: Standard order
  if (domain.includes('human_resources')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Operations Management: Standard order
  if (domain.includes('operations')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Customer Support Service: Standard order
  if (domain.includes('customer_support')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Product Engineering Leadership: Standard order with Projects
  if (domain.includes('product_engineering')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Marketing Creative: Standard order
  if (domain.includes('marketing')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Achievements',
      'Education',
      'Certifications',
      'Internships',
    ];
  }

  // Default: All 8 sections
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
