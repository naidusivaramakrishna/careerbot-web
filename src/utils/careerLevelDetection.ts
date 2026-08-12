/**
 * Shared career-level detection utility
 * Used across 6+ components to maintain consistent detection rules
 */

export function detectCareerLevel(name: string): string | null {
  if (!name) return null;

  const nameLower = name.toLowerCase();

  // Most-specific/technical keywords checked first so 'Lead Architect' → Architect
  if (/\barchitect\b/.test(nameLower)) {
    return 'Architect';
  }

  if (/\bmanager\b/.test(nameLower)) {
    return 'Manager';
  }

  if (/\blead\b/.test(nameLower)) {
    return 'Lead';
  }

  if (/\bsenior\b/.test(nameLower)) {
    return 'Senior-Level';
  }

  // Check for vice president patterns using word boundaries
  if (/\bvice\b/.test(nameLower) || /\bvp\b/.test(nameLower)) {
    return 'Vice President';
  }

  if (/\bdirector\b/.test(nameLower)) {
    return 'Director';
  }

  if (/\bfresher\b|\bjunior\b/.test(nameLower)) {
    return 'Fresher';
  }

  return null;
}
