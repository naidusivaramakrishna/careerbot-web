import type { Improvement } from '@/api/enhancerApi';

interface EnhancementResult {
  enhanced_sections: any;
  ats_score: any;
  improvements: Improvement[];
  suggestions?: string[]; // New: Array of plain text suggestions from backend
  enhancement_report?: {
    details: {
      gaps?: {
        missing_keywords?: string[];
        missing_skills?: string[];
        experience_gaps?: string[];
        strength_keywords?: string[];
      };
    };
  };
}

/**
 * Parse plain text suggestions from backend into structured Improvement objects
 */
function parseBackendSuggestions(textSuggestions: string[]): Improvement[] {
  const improvements: Improvement[] = [];

  textSuggestions.forEach((suggestion, index) => {
    // Determine impact and category based on keywords in the suggestion
    let impact: 'high' | 'medium' | 'low' = 'medium';
    let impact_points = 8;
    let category = 'content';
    let section: string | null = null;

    // Extract section from suggestion text (e.g., "Experience #1:", "Contact email")
    const lowerSuggestion = suggestion.toLowerCase();

    // High priority suggestions
    if (lowerSuggestion.includes('mandatory') || lowerSuggestion.includes('missing') || lowerSuggestion.includes('duration missing')) {
      impact = 'high';
      impact_points = 12;
    }

    // Determine section - Check experience/education FIRST before contact
    if (lowerSuggestion.includes('experience #') || lowerSuggestion.includes('experience:')) {
      section = 'experience';
      category = 'content';
    } else if (lowerSuggestion.includes('education #') || lowerSuggestion.includes('education:')) {
      section = 'education';
      category = 'content';
    } else if (lowerSuggestion.includes('contact name') || lowerSuggestion.includes('contact') || lowerSuggestion.includes('email') || lowerSuggestion.includes('phone')) {
      section = 'contact';
      category = 'sections';
    } else if (lowerSuggestion.includes('achievement')) {
      section = 'achievements';
      category = 'sections';
    }

    // Optional suggestions have lower impact
    if (lowerSuggestion.includes('optional') || lowerSuggestion.includes('recommended')) {
      impact = 'medium';
      impact_points = 6;
    }

    // Split suggestion into title and description
    const parts = suggestion.split(' - ');
    const title = parts[0] || suggestion;
    const description = parts.length > 1 ? parts.slice(1).join(' - ') : suggestion;

    improvements.push({
      id: `backend_suggestion_${index}_${Date.now()}`,
      category,
      section,
      title,
      description,
      impact,
      impact_points,
      before: '',
      after: description,
      action_type: 'add_field',
      replacement_text: null,
    });
  });

  return improvements;
}

/**
 * Generate detailed, actionable AI suggestions from enhancement result
 *
 * This function analyzes the backend response and creates specific suggestions
 * based on what's actually missing or needs improvement
 */
export function generateDetailedSuggestions(
  enhanceResult: EnhancementResult
): Improvement[] {
  const suggestions: Improvement[] = [];
  const { enhanced_sections, ats_score } = enhanceResult;

  // 1. PRIORITY: Parse backend suggestions if available
  if (enhanceResult.suggestions && enhanceResult.suggestions.length > 0) {
    const backendSuggestions = parseBackendSuggestions(enhanceResult.suggestions);
    suggestions.push(...backendSuggestions);
  }

  // 2. Add missing keywords suggestions
  const missingKeywords = enhanceResult.enhancement_report?.details?.gaps?.missing_keywords || [];
  if (missingKeywords.length > 0) {
    suggestions.push({
      id: `keywords_${Date.now()}`,
      category: 'keywords',
      section: null,
      title: 'Add Missing Industry Keywords',
      description: `Your resume is missing ${missingKeywords.length} important keywords that recruiters and ATS systems look for.`,
      impact: 'high',
      impact_points: 15,
      before: `Missing: ${missingKeywords.slice(0, 5).join(', ')}${missingKeywords.length > 5 ? ', ...' : ''}`,
      after: `Consider adding these keywords naturally in your experience and skills: ${missingKeywords.slice(0, 10).join(', ')}`,
      action_type: 'add_content',
      replacement_text: null,
    });
  }

  // 3. Highlight strength keywords
  const strengthKeywords = enhanceResult.enhancement_report?.details?.gaps?.strength_keywords || [];
  if (strengthKeywords.length > 0) {
    suggestions.push({
      id: `strength_keywords_${Date.now()}`,
      category: 'keywords',
      section: null,
      title: 'Strong Keywords Detected',
      description: `Great! Your resume already includes ${strengthKeywords.length} valuable keywords.`,
      impact: 'low',
      impact_points: 5,
      before: '',
      after: `Keep using: ${strengthKeywords.join(', ')}`,
      action_type: 'info',
      replacement_text: null,
    });
  }

  // 1. Missing Contact Information
  const contact = enhanced_sections?.contact || {};
  const missingContact: string[] = [];

  if (!contact.email) missingContact.push('Email');
  if (!contact.phone) missingContact.push('Phone');
  if (!contact.location) missingContact.push('Location');

  if (missingContact.length > 0) {
    suggestions.push({
      id: `contact_${Date.now()}`,
      category: 'sections',
      section: 'contact',
      title: 'Add Missing Contact Information',
      description: `Your resume is missing: ${missingContact.join(', ')}. Adding complete contact information is crucial for recruiters to reach you.`,
      impact: 'high',
      impact_points: 15,
      before: `Contact: ${contact.name || 'Name only'}`,
      after: `Add email, phone, and location to your contact information`,
      action_type: 'add_field',
      replacement_text: null,
    });
  }

  // 2. Missing Social Links
  const socialLinks = enhanced_sections?.social_links || {};
  if (!socialLinks.linkedIn && !socialLinks.github) {
    suggestions.push({
      id: `social_${Date.now()}`,
      category: 'sections',
      section: 'social_links',
      title: 'Add Professional Social Links',
      description: 'Include your LinkedIn profile and GitHub (for technical roles) to showcase your professional network and work.',
      impact: 'medium',
      impact_points: 8,
      before: 'No social links provided',
      after: 'Add LinkedIn: linkedin.com/in/yourname\nAdd GitHub: github.com/yourname',
      action_type: 'add_field',
      replacement_text: null,
    });
  }

  // 3. Missing Certifications
  const certifications = enhanced_sections?.certifications || [];
  if (certifications.length === 0) {
    suggestions.push({
      id: `cert_${Date.now()}`,
      category: 'sections',
      section: 'certifications',
      title: 'Add Relevant Certifications',
      description: 'Including certifications demonstrates continuous learning and validates your skills.',
      impact: 'medium',
      impact_points: 10,
      before: 'No certifications listed',
      after: 'Add any professional certifications, online courses, or training programs you have completed',
      action_type: 'add_section',
      replacement_text: null,
    });
  }

  // 4. Missing Achievements
  const achievements = enhanced_sections?.achievements || [];
  if (achievements.length === 0) {
    suggestions.push({
      id: `achieve_${Date.now()}`,
      category: 'content',
      section: 'achievements',
      title: 'Add Achievements or Awards',
      description: 'Highlight awards, recognitions, or notable achievements to stand out from other candidates.',
      impact: 'medium',
      impact_points: 8,
      before: 'No achievements listed',
      after: 'Add awards like "Employee of the Month", hackathon wins, or performance recognitions',
      action_type: 'add_section',
      replacement_text: null,
    });
  }

  // 5. Weak Professional Summary
  const summary = enhanced_sections?.summary || '';
  if (summary.length < 100) {
    suggestions.push({
      id: `summary_${Date.now()}`,
      category: 'content',
      section: 'summary',
      title: 'Strengthen Professional Summary',
      description: 'Your summary is too brief. A strong summary should be 2-3 sentences highlighting your expertise, experience, and career goals.',
      impact: 'high',
      impact_points: 12,
      before: summary || 'Brief or missing summary',
      after: 'Write a comprehensive summary including: your role, years of experience, key skills, and what you bring to employers',
      action_type: 'replace',
      replacement_text: null,
    });
  }

  // 6. Format Issues (from ATS score)
  const formatIssues = ats_score?.breakdown?.format?.issues || [];
  if (formatIssues.length > 0) {
    formatIssues.forEach((issue: string, index: number) => {
      let title = 'Improve Resume Format';
      let description = issue;
      let after = '';
      let points = 5;

      if (issue.includes('bullet points')) {
        title = 'Use More Bullet Points';
        description = 'Bullet points make your resume easier to scan and ATS-friendly';
        after = 'Convert paragraphs to bullet points starting with action verbs (Built, Developed, Managed, etc.)';
        points = 8;
      } else if (issue.includes('too short')) {
        title = 'Expand Resume Content';
        description = 'Your resume is too brief. Aim for 400-800 words for optimal length.';
        after = 'Add more details to your experience, projects, and achievements with quantifiable results';
        points = 10;
      } else if (issue.includes('long lines')) {
        title = 'Fix Long Lines';
        description = 'Break long lines into shorter, scannable bullet points';
        after = 'Keep each line under 80 characters for better readability';
        points = 5;
      }

      suggestions.push({
        id: `format_${index}_${Date.now()}`,
        category: 'format',
        section: null,
        title,
        description,
        impact: points >= 8 ? 'high' : 'medium',
        impact_points: points,
        before: issue,
        after,
        action_type: 'format',
        replacement_text: null,
      });
    });
  }

  // 7. Missing Keywords from ATS score (secondary source, already handled above)
  // Skipped to avoid duplication with enhancement_report.gaps.missing_keywords

  // 8. Missing Required Sections
  const structureDetails = enhanced_sections?.structure_score?.details || {};
  const missingSections = structureDetails.sections_missing || [];

  if (missingSections.length > 0) {
    missingSections.forEach((section: string) => {
      const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
      suggestions.push({
        id: `section_${section}_${Date.now()}`,
        category: 'sections',
        section,
        title: `Add ${sectionName} Section`,
        description: `The ${sectionName} section is missing from your resume. This is important for a complete professional profile.`,
        impact: 'high',
        impact_points: 10,
        before: `${sectionName} section not found`,
        after: `Add a ${sectionName} section with relevant information`,
        action_type: 'add_section',
        replacement_text: null,
      });
    });
  }

  // 9. Projects with Embedded Suggestions (Clean them)
  const projects = enhanced_sections?.llm_data?.projects || [];
  projects.forEach((project: any, index: number) => {
    if (project.key_contributions) {
      project.key_contributions.forEach((contribution: string, cIndex: number) => {
        if (contribution.includes('CRITICAL RULES')) {
          // Extract the actual content before "CRITICAL RULES"
          const cleanText = contribution.split(/\n\nCRITICAL RULES:/)[0].trim();

          suggestions.push({
            id: `project_${index}_${cIndex}_${Date.now()}`,
            category: 'content',
            section: 'projects',
            title: `Improve: "${cleanText.substring(0, 30)}..."`,
            description: 'This project description needs grammar and formatting improvements',
            impact: 'medium',
            impact_points: 6,
            before: cleanText,
            after: cleanText, // In a real scenario, you'd apply the CRITICAL RULES here
            action_type: 'replace',
            replacement_text: cleanText,
          });
        }
      });
    }
  });

  // 10. Experience Quantification
  const experience = enhanced_sections?.llm_data?.experience || [];
  const hasQuantifiableMetrics = experience.some((exp: any) =>
    exp.key_contributions?.some((contrib: string) =>
      /\d+/.test(contrib) // Check if contains numbers
    )
  );

  if (!hasQuantifiableMetrics && experience.length > 0) {
    suggestions.push({
      id: `quantify_${Date.now()}`,
      category: 'content',
      section: 'experience',
      title: 'Add Quantifiable Achievements',
      description: 'Include numbers, percentages, and metrics to demonstrate your impact',
      impact: 'high',
      impact_points: 12,
      before: 'Developed features and improved performance',
      after: 'Developed 5+ features, improving system performance by 40% and reducing load time by 2 seconds',
      action_type: 'enhance',
      replacement_text: null,
    });
  }

  return suggestions;
}

/**
 * Merge backend improvements with generated detailed suggestions
 * Priority: Use backend improvements if available, supplement with generated ones
 */
export function mergeImprovements(
  backendImprovements: Improvement[],
  generatedSuggestions: Improvement[]
): Improvement[] {
  // If backend has improvements, use them as the primary source
  // Only add generated suggestions for categories not covered by backend

  if (backendImprovements && backendImprovements.length > 0) {
    // Backend improvements are already well-formatted, use them directly
    const backendCategories = new Set(backendImprovements.map(imp => imp.category));

    // Add generated suggestions only for missing categories
    const additionalSuggestions = generatedSuggestions.filter(
      gen => !backendCategories.has(gen.category)
    );

    const allSuggestions = [...backendImprovements, ...additionalSuggestions];

    // Sort by impact (high first) and points (descending)
    return allSuggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact as keyof typeof impactOrder] -
                         impactOrder[a.impact as keyof typeof impactOrder];

      if (impactDiff !== 0) return impactDiff;
      return b.impact_points - a.impact_points;
    });
  }

  // Fallback: If no backend improvements, use generated suggestions
  return generatedSuggestions.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const impactDiff = impactOrder[b.impact as keyof typeof impactOrder] -
                       impactOrder[a.impact as keyof typeof impactOrder];

    if (impactDiff !== 0) return impactDiff;
    return b.impact_points - a.impact_points;
  });
}
