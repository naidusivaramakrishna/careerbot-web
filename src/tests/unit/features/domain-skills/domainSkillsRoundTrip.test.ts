/**
 * PR #96 ai-review (58ef79ee) P1 — domain skill categories must survive a
 * reload. Adding a skill sends the category label; careerbot-api stores it
 * under custom_skills[slugify_category(label)] (app/shared/skills_taxonomy.py).
 * mapBackendSkillsToCategorized must map that slug back to the editor key of
 * the active domain instead of turning it into a custom category.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/resumeApi', () => ({ getResumeById: vi.fn(), getDefaultTemplate: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ getEnhancedResume: vi.fn(), applyFix: vi.fn() }));

import { mapBackendSkillsToCategorized } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import {
  DOMAIN_SKILLS,
  skillCategoryApiName,
  slugifySkillCategory,
  domainSkillKeyForSlug,
} from '@/config/domainSkills';
import { filterSkillsByDomain } from '@/app/(resume)/templates/skillsFilterByDomain';

const FIXED = ['programming_languages', 'frameworks', 'soft_skills', 'project_management', 'marketing_sales'];

describe('mapBackendSkillsToCategorized — domain categories round-trip', () => {
  const backend = {
    programmingLanguages: [],
    softSkills: [{ id: 's0', name: 'Empathy' }],
    customSkills: {
      clinical_skills_diagnostics: [{ id: 's1', name: 'Triage' }],
      devops_tools: [{ id: 's2', name: 'Docker' }],
    },
  };

  it('maps the label slug back to the healthcare editor key, with skill ids', () => {
    const out = mapBackendSkillsToCategorized(backend, 'healthcare') as Record<string, unknown>;
    expect(out.clinical_skills).toEqual(['Triage']);
    expect((out.skill_id_map as Record<string, string>)['clinical_skills:Triage']).toBe('s1');
    const customNames = ((out.custom_categories || []) as Array<{ name: string }>).map((c) => c.name);
    expect(customNames).toEqual(['Devops tools']);
  });

  it('leaves it a custom category when the resume is not in that domain (nothing hidden)', () => {
    const out = mapBackendSkillsToCategorized(backend, 'legal') as Record<string, unknown>;
    expect(out.clinical_skills).toBeUndefined();
    const ids = ((out.custom_categories || []) as Array<{ id: string }>).map((c) => c.id);
    expect(ids).toContain('custom_backend_clinical_skills_diagnostics');
  });

  it('every non-fixed domain category round-trips add → reload → same key', () => {
    for (const [domain, cats] of Object.entries(DOMAIN_SKILLS)) {
      for (const c of cats) {
        if (FIXED.includes(c.key)) continue;
        const slug = slugifySkillCategory(skillCategoryApiName(c.key));
        expect(domainSkillKeyForSlug(slug, domain), `${domain}.${c.key}`).toBe(c.key);
      }
    }
  });
});

describe('slugifySkillCategory mirrors careerbot-api slugify_category', () => {
  // Expected values produced by running develop2 app/shared/skills_taxonomy.py.
  it.each([
    ['Clinical Skills & Diagnostics', 'clinical_skills_diagnostics'],
    ['Cloud & DevOps', 'cloud_dev_ops'],
    ['Compliance, GRC & Risk Management', 'compliance_grc_risk_management'],
    ['HR Operations & Administration', 'hr_operations_administration'],
    ['Cross-Functional Leadership', 'cross_functional_leadership'],
    ['Digital & VLSI Design', 'digital_vlsi_design'],
  ])('%s → %s', (label, slug) => {
    expect(slugifySkillCategory(label)).toBe(slug);
  });
});

describe('core_engineering Project Management', () => {
  it('uses the fixed project_management key the backend stores it under, and the preview keeps it', () => {
    const keys = DOMAIN_SKILLS.core_engineering.map((c) => c.key);
    expect(keys).toContain('project_management');
    expect(skillCategoryApiName('project_management')).toBe('projectManagement');
    const out = filterSkillsByDomain(
      { programming_languages: [], frameworks: [], soft_skills: [], project_management: ['Scrum'], marketing_sales: [] },
      'core_engineering',
    ) as Record<string, unknown>;
    expect(out.project_management).toEqual(['Scrum']);
  });
});
