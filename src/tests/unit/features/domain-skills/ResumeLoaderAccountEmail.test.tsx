/**
 * PR #96 ai-review (1a8259c1) P2: the resume loader mapped domain skill slugs
 * with the domain of `careerLevelTemplates_<localStorage.userEmail>`, while
 * the preview reads `careerLevelTemplates_<getProfile().email>`. With a stale
 * userEmail from a previous account the loader used the wrong domain, so the
 * active domain's categories came back as custom categories (or vice versa).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/api/resumeApi', () => ({ getResumeById: vi.fn(), getDefaultTemplate: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ getEnhancedResume: vi.fn(), applyFix: vi.fn() }));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn() }));
vi.mock('@/lib/http', () => ({ httpClient: { post: vi.fn(), get: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { ResumeProvider, useResume } from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { getResumeById, getDefaultTemplate } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';

const latest: { skills: Record<string, unknown> | null; loading: boolean } = { skills: null, loading: true };
function Consumer() {
  const { resumeData, isLoadingResume } = useResume();
  latest.skills = (resumeData.categorizedSkills || null) as Record<string, unknown> | null;
  latest.loading = isLoadingResume;
  return null;
}

function applied(email: string, domain: string) {
  window.localStorage.setItem(`selectedTemplateId_${email}`, 't1');
  window.localStorage.setItem(
    `careerLevelTemplates_${email}`,
    JSON.stringify([{ id: 't1', name: `${domain} - Mid-Level`, domain_family: domain }]),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  latest.skills = null;
  latest.loading = true;
});

describe('resume loader resolves the domain for the logged-in account', () => {
  it('maps healthcare slugs for the profile account, not a stale localStorage userEmail', async () => {
    window.localStorage.setItem('userEmail', 'old@example.com');
    applied('old@example.com', 'legal');
    applied('user@example.com', 'healthcare');
    vi.mocked(getProfile).mockResolvedValue({ email: 'user@example.com' } as never);
    vi.mocked(getDefaultTemplate).mockResolvedValue(null as never);
    vi.mocked(getResumeById).mockResolvedValue({
      id: 'r1',
      personalInfo: { fullname: 'A', email: 'a@b.c' },
      skills: {
        programmingLanguages: [],
        customSkills: { clinical_skills_diagnostics: [{ id: 's1', name: 'Triage' }] },
      },
    } as never);

    render(
      <ResumeProvider resumeId="r1">
        <Consumer />
      </ResumeProvider>,
    );
    await waitFor(() => expect(latest.loading).toBe(false));
    await waitFor(() => expect(latest.skills?.clinical_skills).toEqual(['Triage']));
    const customIds = ((latest.skills?.custom_categories || []) as Array<{ id: string }>).map((c) => c.id);
    expect(customIds).not.toContain('custom_backend_clinical_skills_diagnostics');
  });
});
