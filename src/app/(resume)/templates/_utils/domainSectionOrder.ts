/**
 * Domain-family and career-level specific section ordering
 * Different domain families show different sections as main sections
 * For Mid-Level, Senior-Level, and Manager, Education moves to the end
 */

export const getSectionOrderByDomainAndCareer = (
  domainFamily?: string,
  careerLevel?: string
): string[] => {
  // Get base domain-specific order
  const baseOrder = getDomainSectionOrder(domainFamily);

  // For Mid-Level, Senior-Level, and Manager: move Education to end
  const level = careerLevel?.toLowerCase() || '';
  const isAdvancedLevel = level.includes('mid') || level.includes('senior') || level.includes('manager');

  console.warn("🎯 getSectionOrderByDomainAndCareer - domainFamily:", domainFamily, "careerLevel:", careerLevel);
  console.warn("🎯 getSectionOrderByDomainAndCareer - baseOrder:", baseOrder);
  console.warn("🎯 getSectionOrderByDomainAndCareer - isAdvancedLevel:", isAdvancedLevel);

  if (isAdvancedLevel && baseOrder.includes('Education')) {
    const withoutEducation = baseOrder.filter(s => s !== 'Education');
    const finalOrder = [...withoutEducation, 'Education'];
    console.warn("🎯 getSectionOrderByDomainAndCareer - moved Education to end:", finalOrder);
    return finalOrder;
  }

  console.warn("🎯 getSectionOrderByDomainAndCareer - returning baseOrder:", baseOrder);
  return baseOrder;
};

export const getDomainSectionOrder = (domainFamily?: string): string[] => {
  const domain = domainFamily?.toLowerCase() || '';

  console.warn("🎯 getDomainSectionOrder - domainFamily input:", domainFamily);
  console.warn("🎯 getDomainSectionOrder - domain (lowercased):", domain);
  console.warn("🎯 getDomainSectionOrder - domain.includes('education'):", domain.includes('education'));

  // Healthcare: Certifications moved up before Skills
  if (domain.includes('healthcare')) {
    return [
      'Personal Info',
      'Professional Summary',
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
      'Certifications',
      'Skills',
      'Work Experience',
      'Projects',
      'Publications',
      'Education',
      'Internships',
    ];
  }

  // Government: Standard order with all sections
  if (domain.includes('government')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Work Experience',
      'Skills',
      'Projects',
      'Education',
      'Certifications',
      'Internships'
    ];
  }
  // Legal: Standard order with all sections
  if (domain.includes('legal')) {
    return [
      'Personal Info',
      'Professional Summary',
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
      'Certifications',
      'Skills',
      'Work Experience',
      'Projects',
      'Education',
      'Internships',
    ];
  }

  // Research Scholar: Includes Publications
  if (domain.includes('research')) {
    return [
      'Personal Info',
      'Professional Summary',
      'Skills',
      'Work Experience',
      'Projects',
      'Publications',
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

  // Modern Minimal: All 8 sections
  if (domain.includes('modern') || domain.includes('minimal')) {
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
