/**
 * PR #96 — template-side domain filtering and section order.
 *
 * Failed on the PR head (cc916e25), pass after the fix:
 *   - government_standard skills were dropped (filter listed keys from the
 *     unused GOVERNMENT_SKILLS list, the editor writes GOVERNMENT_STANDARD_SKILLS keys)
 *   - soft_skills were dropped for every domain except SE/cybersecurity/research
 *   - an unmapped domain ('general') rendered no predefined skills at all
 *   - cybersecurity / legal / marine orders dropped 'Certifications', hiding
 *     a resume's existing certifications
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { filterSkillsByDomain } from '@/app/(resume)/templates/skillsFilterByDomain';
import { getSectionOrderByDomainAndCareer } from '@/app/(resume)/templates/_utils/domainSectionOrder';
import { DOMAIN_SKILLS } from '@/config/domainSkills';

const skills = () => ({
  programming_languages: ['Python'],
  frameworks: ['React'],
  soft_skills: ['Leadership'],
  project_management: ['Scrum'],
  marketing_sales: ['SEO'],
  clinical_skills: ['Triage'],
  governance_administration: ['Policy Drafting'],
  custom_categories: [{ id: 'c1', name: 'Mine', skills: ['X'] }],
  skill_id_map: {},
});

describe('filterSkillsByDomain', () => {
  it('keeps the government_standard categories the editor writes', () => {
    const out = filterSkillsByDomain(skills(), 'government_standard') as Record<string, unknown>;
    expect(out.governance_administration).toEqual(['Policy Drafting']);
  });

  it('keeps soft_skills for every domain that lists it', () => {
    for (const [domain, cats] of Object.entries(DOMAIN_SKILLS)) {
      if (!cats.some((c) => c.key === 'soft_skills')) continue;
      const out = filterSkillsByDomain(skills(), domain) as Record<string, unknown>;
      expect(out.soft_skills, domain).toEqual(['Leadership']);
    }
  });

  it('keeps the general categories for the general domain', () => {
    const out = filterSkillsByDomain(skills(), 'general') as Record<string, unknown>;
    expect(out.programming_languages).toEqual(['Python']);
    expect(out.frameworks).toEqual(['React']);
  });

  it('still hides categories that do not belong to the domain', () => {
    const out = filterSkillsByDomain(skills(), 'healthcare') as Record<string, unknown>;
    expect(out.clinical_skills).toEqual(['Triage']);
    expect(out.programming_languages).toBeUndefined();
    expect(out.governance_administration).toBeUndefined();
    expect(out.custom_categories).toEqual([{ id: 'c1', name: 'Mine', skills: ['X'] }]);
  });

  it('still shows general categories for software_engineering', () => {
    const out = filterSkillsByDomain(skills(), 'software_engineering') as Record<string, unknown>;
    expect(out.programming_languages).toEqual(['Python']);
    expect(out.project_management).toEqual(['Scrum']);
    expect(out.clinical_skills).toBeUndefined();
  });

  it('does not log to the console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    filterSkillsByDomain(skills(), 'healthcare');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('getSectionOrderByDomainAndCareer — existing certifications stay visible', () => {
  it.each(['cybersecurity', 'legal', 'marine_merchant_navy', 'healthcare'])(
    '%s keeps Certifications',
    (domain) => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      for (const level of ['Fresher', 'Mid-Level', 'Senior-Level']) {
        expect(getSectionOrderByDomainAndCareer(domain, level), `${domain}/${level}`).toContain('Certifications');
      }
    },
  );
});
