/**
 * Utility to clean resume data by removing embedded AI suggestions
 * and separating them into a proper improvements array
 */

export interface CleanedResumeData {
  cleanContent: string;
  extractedSuggestions: string[];
}

/**
 * Removes embedded AI suggestions from resume content
 *
 * The backend sometimes embeds suggestions directly in the text like:
 * "Built APIs CRITICAL RULES: 1. Fix spelling errors..."
 *
 * This function cleans that up and returns only the actual resume content.
 */
export function cleanResumeContent(content: string): CleanedResumeData {
  // Type guard: ensure content is actually a string
  if (!content || typeof content !== 'string') {
    return {
      cleanContent: typeof content === 'string' ? content : '',
      extractedSuggestions: [],
    };
  }

  const extractedSuggestions: string[] = [];

  // Pattern to match embedded suggestions
  const patterns = [
    / CRITICAL RULES:[\s\S]*$/gi,     // Match " CRITICAL RULES:" with space before
    /CRITICAL RULES:[\s\S]*$/gmi,     // Match "CRITICAL RULES:" at any position
    /\n\nCRITICAL RULES:[\s\S]*$/gmi, // Match with double newline
    /\nCRITICAL RULES:[\s\S]*$/gmi,   // Match with single newline
    /\(SUGGESTION:.*?\)/gi,
    /\[AI ENHANCEMENT:.*?\]/gi,
    /\{.*?grammar.*?spelling.*?\}/gi,
  ];

  let cleanContent = content;

  // Extract and remove suggestions
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      extractedSuggestions.push(...matches);
      cleanContent = cleanContent.replace(pattern, '');
    }
  });

  // Clean up extra whitespace
  cleanContent = cleanContent
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
    .replace(/[ \t]+/g, ' ')      // Replace multiple spaces with single space
    .trim();

  // If the cleaned content is a JSON-stringified object containing a `summary` field,
  // unwrap it so downstream templates receive plain text instead of a JSON blob.
  try {
    const candidate = cleanContent.replace(/\.$/, '');
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (parsed as any).summary === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cleanContent = (parsed as any).summary.trim();
      }
    }
  } catch (e) {
    // Not JSON — ignore and continue
  }

  return {
    cleanContent,
    extractedSuggestions,
  };
}


/**
 * Clean all text fields in resume data object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanResumeData(resumeData: any): any {
  if (!resumeData || typeof resumeData !== 'object') {
    return resumeData;
  }

  // Handle arrays
  if (Array.isArray(resumeData)) {
    return resumeData.map(item => cleanResumeData(item));
  }

  // Handle objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: any = {};

  for (const [key, value] of Object.entries(resumeData)) {
    if (typeof value === 'string') {
      // Clean string values
      try {
        const { cleanContent } = cleanResumeContent(value);
        cleaned[key] = cleanContent;
      } catch (error) {
        console.error(`Error cleaning field "${key}":`, error);
        cleaned[key] = value; // Keep original value if cleaning fails
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively clean nested objects/arrays
      cleaned[key] = cleanResumeData(value);
    } else {
      // Keep other types as-is
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Extract all embedded suggestions from resume data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractAllSuggestions(resumeData: any): string[] {
  const suggestions: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extract(data: any) {
    if (!data) return;

    if (typeof data === 'string') {
      const { extractedSuggestions } = cleanResumeContent(data);
      suggestions.push(...extractedSuggestions);
    } else if (Array.isArray(data)) {
      data.forEach(item => extract(item));
    } else if (typeof data === 'object') {
      Object.values(data).forEach(value => extract(value));
    }
  }

  extract(resumeData);
  return suggestions;
}

/**
 * Process enhanced sections from API to separate content from suggestions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function processEnhancedSections(enhancedSections: any): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cleanedData: any;
  embeddedSuggestions: string[];
} {
  const embeddedSuggestions = extractAllSuggestions(enhancedSections);
  const cleanedData = cleanResumeData(enhancedSections);

  return {
    cleanedData,
    embeddedSuggestions,
  };
}
