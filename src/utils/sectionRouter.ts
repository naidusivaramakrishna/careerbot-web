/**
 * Section Router Utility
 * Maps backend section names to their corresponding frontend routes
 */

export interface SectionRoute {
  name: string;
  route: string;
}

// Section name mapping: Backend section name -> Frontend route
export const SECTION_ROUTES: { [key: string]: string } = {
  'See and Repeat': '/communication/see-and-repeat',
  'Listen and Repeat': '/communication/listen-and-repeat',
  'Jumbled Sentences': '/communication/jumbled-sentences',
  'Sentence Completion': '/communication/sentence-completion',
  'Listen and Correct': '/communication/listen-and-correct',
  'Story Listen Facts': '/communication/story-listening', // Backend uses this name for story listening section
  // 'Situation Explaining': '/communication/situation-explaining',
  'Describe Situation': '/communication/situation-explaining', // Backend also uses this name
};

/**
 * Get route path for a given section name
 * @param sectionName - The section name from the backend
 * @returns The frontend route path
 */
export const getSectionRoute = (sectionName: string): string | null => {
  const route = SECTION_ROUTES[sectionName];

  if (!route) {
    // // console.warn(`⚠️ Unknown section name: "${sectionName}". Available sections:`, Object.keys(SECTION_ROUTES));
    return null;
  }

  return route;
};

/**
 * Check if a section name is valid
 * @param sectionName - The section name to validate
 * @returns true if the section exists in the mapping
 */
export const isValidSection = (sectionName: string): boolean => {
  return sectionName in SECTION_ROUTES;
};

/**
 * Get all available sections
 * @returns Array of section names
 */
export const getAllSections = (): string[] => {
  return Object.keys(SECTION_ROUTES);
};
