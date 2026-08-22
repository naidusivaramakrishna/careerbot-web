import { describe, it, expect } from 'vitest';
import { categoryToSectionKey } from '@/app/(jobs)/jobmatch/_components/analysis/MatchPenalties';

// "formatting" bundles fields from different resume sections (contact info,
// but also e.g. a missing "experience" field) under one penalty category —
// this pins the fix where a formatting penalty naming a real section id as
// its target now routes to that section instead of always landing on the
// blanket "contact" alias.

describe('categoryToSectionKey', () => {
  it('routes a plain section-name category directly to that section', () => {
    expect(categoryToSectionKey('education')).toBe('education');
    expect(categoryToSectionKey('skills')).toBe('skills');
  });

  it('resolves known category aliases', () => {
    expect(categoryToSectionKey('technical_skills')).toBe('skills');
    expect(categoryToSectionKey('soft_skills')).toBe('softSkills');
    expect(categoryToSectionKey('job_title')).toBe('contact');
    expect(categoryToSectionKey('star_pattern')).toBe('experience');
  });

  it('prefers a formatting penalty\'s target section over the blanket "contact" alias', () => {
    expect(categoryToSectionKey('formatting', 'experience')).toBe('experience');
    expect(categoryToSectionKey('formatting', 'education')).toBe('education');
  });

  it('falls back to "contact" for a formatting penalty with no target, or a target that is not a known section', () => {
    expect(categoryToSectionKey('formatting')).toBe('contact');
    expect(categoryToSectionKey('formatting', 'email')).toBe('contact');
  });

  it('maps a formatting penalty targeting "technical_skills" to "skills", not the raw target', () => {
    // "technical_skills" isn't itself a KNOWN_SECTION_IDS entry (the real
    // section id is "skills"), so this must hit its own special case rather
    // than the generic KNOWN_SECTION_IDS.has(target) check above it.
    expect(categoryToSectionKey('formatting', 'technical_skills')).toBe('skills');
  });

  it('returns undefined for a category with no known section or alias', () => {
    expect(categoryToSectionKey('nonexistent_category')).toBeUndefined();
  });
});
