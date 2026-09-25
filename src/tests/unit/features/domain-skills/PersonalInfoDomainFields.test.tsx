/**
 * PR #96 ai-review (1a8259c1) codex P2: PersonalInfo looked up the applied
 * career-level template under the resume's *contact* email
 * (`careerLevelTemplates_<resumeData.personalInfo.email>`), while the template
 * is stored under the logged-in account's email. For a resume whose contact
 * email differs (e.g. an uploaded/enhanced resume), the preview rendered the
 * healthcare template but the editor never showed the new healthcare fields.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const ctx: { value: Record<string, unknown> } = { value: {} };
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({
  useResume: () => ctx.value,
}));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }));
vi.mock('@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel', () => ({ default: () => null }));
vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'account@example.com' }),
}));
vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import PersonalInfo from '@/app/(resume)/builder/creation/_components/editor/sections/PersonalInfo';

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('userEmail', 'account@example.com');
  window.localStorage.setItem('selectedTemplateId_account@example.com', 't1');
  window.localStorage.setItem(
    'careerLevelTemplates_account@example.com',
    JSON.stringify([{ id: 't1', name: 'healthcare - Mid-Level', domain_family: 'healthcare' }]),
  );
  ctx.value = {
    resumeData: { resume_id: 'r1', personalInfo: { fullname: 'A', email: 'contact@hospital.org' } },
    setResumeData: vi.fn(),
  };
});

describe('PersonalInfo domain fields', () => {
  it('shows the healthcare fields when the resume contact email differs from the account email', async () => {
    render(<PersonalInfo formData={{}} errors={{}} onChange={vi.fn()} onBlur={vi.fn()} />);
    expect(await screen.findByText(/Medical Council Reg\. No\./)).toBeTruthy();
  });

  it('shows them when both emails match (control)', async () => {
    ctx.value = {
      resumeData: { resume_id: 'r1', personalInfo: { fullname: 'A', email: 'account@example.com' } },
      setResumeData: vi.fn(),
    };
    render(<PersonalInfo formData={{}} errors={{}} onChange={vi.fn()} onBlur={vi.fn()} />);
    expect(await screen.findByText(/Medical Council Reg\. No\./)).toBeTruthy();
  });
});
