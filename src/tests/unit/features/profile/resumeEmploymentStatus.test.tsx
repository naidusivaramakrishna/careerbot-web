/**
 * "Currently working" detection from a parsed resume, and the employment-status
 * write that PR #90 hangs off it.
 *
 * Only an explicit marker ("Present", "Current", "Ongoing", ...) means a job is
 * current. A missing or unparseable end date is just missing data -- treating
 * it as current overwrote a student's saved employment_status with 'employed'
 * because of one undated entry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mapResumeToProfile } from '@/app/(user)/profile/_utils/resumeMapper';
import type { ResumeExtractResponse } from '@/api/resumeParsingApi';

const mockExtractResume = vi.hoisted(() => vi.fn());
vi.mock('@/api/resumeParsingApi', () => ({
  extractResume: (...args: unknown[]) => mockExtractResume(...args),
}));

const userApi = vi.hoisted(() => ({
  updateProfile: vi.fn().mockResolvedValue({}),
  addEducationAutoFill: vi.fn().mockResolvedValue({}),
  addExperienceAutoFill: vi.fn().mockResolvedValue({}),
  addSkillAutoFill: vi.fn().mockResolvedValue({}),
  addCertificationAutoFill: vi.fn().mockResolvedValue({}),
  addProjectAutoFill: vi.fn().mockResolvedValue({}),
  uploadResume: vi.fn().mockResolvedValue({}),
  getEmploymentInfo: vi.fn(),
  updateEmploymentInfo: vi.fn().mockResolvedValue({}),
}));
vi.mock('@/api/userApi', () => userApi);

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

import { useResumeProfileFill } from '@/hooks/useResumeProfileFill';

const resumeWith = (experience: Record<string, unknown>[]): ResumeExtractResponse =>
  ({ resume_id: 'r1', parsed_data: { experience } } as unknown as ResumeExtractResponse);

const currentFlags = (experience: Record<string, unknown>[]) =>
  (mapResumeToProfile(resumeWith(experience)).workExperience ?? []).map((e) => e.currently_working);

describe('mapResumeToProfile — currently_working', () => {
  it('is false for a job with a start date and no end date', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Intern', start_date: 'Jan 2022' }])).toEqual([false]);
  });

  it('is false for a job with no dates at all', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Intern' }])).toEqual([false]);
  });

  it('is false for a duration range with no parseable end', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Intern', duration: 'Summer 2021' }])).toEqual([false]);
  });

  it('is false for a job with a past end date', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Dev', start_date: 'Jan 2020', end_date: 'Dec 2021' }])).toEqual([false]);
  });

  it('is true when end_date is "Present"', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Dev', start_date: 'Jan 2022', end_date: 'Present' }])).toEqual([true]);
  });

  it('is true when end_date is "Current", and does not save "Current" as a date', () => {
    const [exp] = mapResumeToProfile(resumeWith([
      { company: 'Acme', role: 'Dev', start_date: 'Jan 2022', end_date: 'Current' },
    ])).workExperience ?? [];
    expect(exp.currently_working).toBe(true);
    expect(exp.end_date).toBe('');
  });

  it('is true for a duration range ending in "Present"', () => {
    expect(currentFlags([{ company: 'Acme', role: 'Dev', duration: 'Aug 2019 - Present' }])).toEqual([true]);
  });
});

describe('useResumeProfileFill — employment status write', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    userApi.getEmploymentInfo.mockResolvedValue({ employment_status: 'student', work_mode: 'remote' });
  });

  const runFill = async (experience: Record<string, unknown>[]) => {
    mockExtractResume.mockResolvedValue(resumeWith(experience));
    const { result } = renderHook(() => useResumeProfileFill());
    await act(async () => {
      await result.current.fill(new File(['x'], 'cv.pdf', { type: 'application/pdf' }));
    });
  };

  it('does not overwrite a student with "employed" because of an undated job', async () => {
    await runFill([{ company: 'Acme', role: 'Intern', start_date: 'Jun 2023' }]);
    expect(userApi.addExperienceAutoFill).toHaveBeenCalledTimes(1);
    expect(userApi.updateEmploymentInfo).not.toHaveBeenCalled();
  });

  it('sets "employed" when the resume lists a job ending "Present"', async () => {
    await runFill([{ company: 'Acme', role: 'Dev', start_date: 'Jan 2022', end_date: 'Present' }]);
    expect(userApi.updateEmploymentInfo).toHaveBeenCalledWith({
      employment_status: 'employed',
      work_mode: 'remote',
    });
  });
});
