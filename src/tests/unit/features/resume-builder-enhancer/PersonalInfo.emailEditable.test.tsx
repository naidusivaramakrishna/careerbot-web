/**
 * A parsed resume with no email shows an "email missing" suggestion. The builder
 * locks the Email field (account-managed), so the suggestion could never be
 * fixed. Enhanced resumes may enter an email only while they have none.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';

const ctx: { value: Record<string, unknown> } = { value: {} };
const search: { source: string | null } = { source: null };
vi.mock('@/app/(resume)/builder/creation/_context/ResumeContext', () => ({ useResume: () => ctx.value }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => search.source }) }));
vi.mock('@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel', () => ({ default: () => null }));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn().mockResolvedValue({ email: 'account@example.com' }) }));
vi.mock('@/lib/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

import PersonalInfo from '@/app/(resume)/builder/creation/_components/editor/sections/PersonalInfo';

const mount = (source: string | null, email: string) => {
  search.source = source;
  ctx.value = { resumeData: { personalInfo: { fullname: 'A', email } }, setResumeData: vi.fn(), resumeSource: source };
  render(<PersonalInfo formData={{ fullname: 'A', email }} errors={{}} onChange={vi.fn()} onBlur={vi.fn()} />);
  return document.querySelector('input[name="email"]') as HTMLInputElement;
};

describe('Personal Info email field', () => {
  it('stays locked when the form is still empty on first render but the loaded resume has an email', () => {
    search.source = 'enhanced';
    ctx.value = { resumeData: { personalInfo: { fullname: 'A', email: 'a@b.com' } }, setResumeData: vi.fn(), resumeSource: 'enhanced' };
    render(<PersonalInfo formData={{ fullname: 'A' }} errors={{}} onChange={vi.fn()} onBlur={vi.fn()} />);
    expect((document.querySelector('input[name="email"]') as HTMLInputElement).readOnly).toBe(true);
  });
  it('is editable when a half-typed email ("ab") was left behind', () => {
    expect(mount('enhanced', 'ab').readOnly).toBe(false);
  });
  it('is editable again for an email this browser entered earlier', () => {
    window.localStorage.setItem('enhanced-email-entered:current', '1');
    expect(mount('enhanced', 'a@b.com').readOnly).toBe(false);
    window.localStorage.clear();
  });
  it('is editable for an enhanced resume that has no email', () => {
    expect(mount('enhanced', '').readOnly).toBe(false);
  });
  it('stays locked for an enhanced resume that already has one', () => {
    expect(mount('enhanced', 'a@b.com').readOnly).toBe(true);
  });
  it('stays locked in the builder even when empty', () => {
    expect(mount(null, '').readOnly).toBe(true);
  });
  it('records "entered here" once, not on every keystroke', () => {
    const input = mount('enhanced', '');
    vi.mocked(window.localStorage.setItem).mockClear();
    for (const value of ['a', 'a@', 'a@b.co']) fireEvent.change(input, { target: { value } });
    const writes = vi.mocked(window.localStorage.setItem).mock.calls.filter(([key]) => key === 'enhanced-email-entered:current');
    expect(writes).toHaveLength(1);
    window.localStorage.clear();
  });
});
