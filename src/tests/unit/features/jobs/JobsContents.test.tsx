import { describe, it, expect, vi } from 'vitest';
import { matchesJobFilters } from '@/app/(jobs)/jobslogin/_components/utils/jobFilterUtils';
import { getSafeExternalUrl } from '@/utils/validators';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/useCurrentUserId', () => ({
  useCurrentUserId: () => ({ userId: 'test-user' }),
}));

import { normalizeJob, jobMatchesSearchQuery } from '@/app/(jobs)/jobslogin/_components/JobsContents';

// ─── Tests ────────────────────────────────────────────────────────────────────
//
// A previous version of this file rendered a hand-rolled `JobsContentsWrapper`
// standing in for the real `JobsContents` component — it had its own "all"
// tab, its own searchJobs-backed fetch/pagination/retry, its own toast
// copy, etc. Once the real component dropped the "All Jobs" tab and the
// fetchJobs/searchJobs path entirely (see JobsContents.tsx), that wrapper
// no longer resembled shipped behavior at all: the tests stayed green while
// asserting dead code paths, which is worse than no coverage. Removed in
// favor of testing the real, exported logic directly below. Rendering the
// actual JobsContents component would need mocks for a long chain of
// transitive dependencies (JobCard, JobPreviewModal, JobsFilterSidebar,
// NancyChat, useCurrentUserId, useSearchParams, …) — worth doing, but as
// its own follow-up rather than folded into this fix.

describe('matchesJobFilters', () => {
  it('applies work model, type, experience, salary, location and education filters together', () => {
    const result = matchesJobFilters(
      {
        mode: 'Remote',
        type: 'Full-time',
        experience: '2 years',
        salary: '₹15-25 LPA',
        location: 'Delhi, India',
        education: 'B.Tech in Computer Science',
        source: 'linkedin',
      },
      ['remote', 'full-time', 'years:2', 'salary:₹20 LPA+', 'location:Delhi', 'education:b tech']
    );

    expect(result).toBe(true);
  });

  it('rejects jobs that do not meet the selected salary threshold', () => {
    const result = matchesJobFilters(
      {
        mode: 'On-site',
        type: 'Full-time',
        experience: '5 years',
        salary: '₹8-12 LPA',
        location: 'Bangalore, India',
        education: 'MCA',
        source: 'naukri',
      },
      ['salary:₹20 LPA+']
    );

    expect(result).toBe(false);
  });

  it('accepts a job posted within the selected "Date Posted" window', () => {
    const result = matchesJobFilters(
      { created_at: new Date().toISOString() },
      ['date:Last 7 days']
    );

    expect(result).toBe(true);
  });

  it('rejects a job posted outside the selected "Date Posted" window', () => {
    const result = matchesJobFilters(
      { created_at: new Date(Date.now() - 30 * 86_400_000).toISOString() },
      ['date:Last 7 days']
    );

    expect(result).toBe(false);
  });

  it('rejects a job with no posted date when a "Date Posted" filter is active', () => {
    const result = matchesJobFilters({}, ['date:Last 24 hours']);

    expect(result).toBe(false);
  });

  it('falls back to posted_date when created_at is absent', () => {
    const result = matchesJobFilters(
      { posted_date: new Date().toISOString() },
      ['date:Last 30 days']
    );

    expect(result).toBe(true);
  });

  it('ignores the "Date Posted" filter when includeDate is false (Applied tab)', () => {
    // created_at here stands in for an applied-date placeholder that's well
    // outside the window — with includeDate: false the job must still pass.
    const result = matchesJobFilters(
      { created_at: new Date(Date.now() - 30 * 86_400_000).toISOString() },
      ['date:Last 7 days'],
      { includeDate: false }
    );

    expect(result).toBe(true);
  });
});

describe('getSafeExternalUrl', () => {
  it('returns the URL unchanged when it already has a safe scheme', () => {
    expect(getSafeExternalUrl('https://example.com/job/123')).toBe('https://example.com/job/123');
  });

  it('normalizes scheme-less/bare-domain URLs by prepending https://', () => {
    expect(getSafeExternalUrl('www.company.com/jobs/123')).toBe('https://www.company.com/jobs/123');
  });

  it('is case-insensitive about an existing scheme (does not double-prefix)', () => {
    expect(getSafeExternalUrl('HTTP://example.com')).toBe('HTTP://example.com');
  });

  it('rejects javascript: URIs', () => {
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('rejects data: URIs', () => {
    expect(getSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
  });

  it('rejects empty, null, and undefined input', () => {
    expect(getSafeExternalUrl('')).toBeUndefined();
    expect(getSafeExternalUrl(null)).toBeUndefined();
    expect(getSafeExternalUrl(undefined)).toBeUndefined();
  });
});

describe('normalizeJob', () => {
  // Pins the field-key mapping so a future rename can't silently reintroduce
  // the requirements_list/requirements mismatch this was fixed for — every
  // other place "requirements" appears in the codebase (recruiter job-post/
  // edit-job forms, JobDescription type) uses the bare "requirements" key.
  it('reads the Requirements section from the "requirements" key', () => {
    const job = normalizeJob({ id: 'job-1', title: 'Engineer', requirements: ['Must relocate', ''] });
    expect(job.requirements).toEqual(['Must relocate']);
  });

  it('falls back to "requirements_list" if "requirements" is absent', () => {
    const job = normalizeJob({ id: 'job-1', title: 'Engineer', requirements_list: ['3+ years experience'] });
    expect(job.requirements).toEqual(['3+ years experience']);
  });

  it('prefers "requirements" over "requirements_list" when both are present', () => {
    const job = normalizeJob({
      id: 'job-1',
      title: 'Engineer',
      requirements: ['Correct one'],
      requirements_list: ['Wrong one'],
    });
    expect(job.requirements).toEqual(['Correct one']);
  });

  it('returns an empty array when neither key is present', () => {
    const job = normalizeJob({ id: 'job-1', title: 'Engineer' });
    expect(job.requirements).toEqual([]);
  });
});

describe('jobMatchesSearchQuery', () => {
  // Pins the fix for search only matching an exact whole-phrase substring —
  // that missed real matches whenever word order or extra words differed.
  it('matches when the words appear in a different order than the query', () => {
    const job = { title: 'Full Stack Developer (Python)', company: 'Acme' };
    expect(jobMatchesSearchQuery(job, 'python full stack developer')).toBe(true);
  });

  it('matches when a query word is in the company instead of the title', () => {
    const job = { title: 'Software Engineer', company: 'Acme Robotics' };
    expect(jobMatchesSearchQuery(job, 'engineer robotics')).toBe(true);
  });

  it('is case-insensitive', () => {
    const job = { title: 'Backend Developer', company: 'Acme' };
    expect(jobMatchesSearchQuery(job, 'BACKEND')).toBe(true);
  });

  it('rejects when any query word is missing from both title and company', () => {
    const job = { title: 'Backend Developer', company: 'Acme' };
    expect(jobMatchesSearchQuery(job, 'backend designer')).toBe(false);
  });

  it('matches everything for an empty or whitespace-only query', () => {
    const job = { title: 'Backend Developer', company: 'Acme' };
    expect(jobMatchesSearchQuery(job, '')).toBe(true);
    expect(jobMatchesSearchQuery(job, '   ')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The three behaviours this PR changed. None had a test, and all three were
// wrong in a way that silently REMOVED jobs the server had already returned.
// ---------------------------------------------------------------------------

describe('matchesJobFilters — experience', () => {
  const withExp = (experience: string) => ({ experience }) as never;

  it('keeps a job whose requirement cannot be parsed', () => {
    // normalizeJob prefers experience_level ("Senior") over the numeric
    // `experience` the server filtered on, so this row was returned by
    // /jobs/scored for experience_years=5 and then dropped on the client.
    expect(matchesJobFilters(withExp('Senior'), ['years:5 yrs'])).toBe(true);
  });

  it('did not make a 5-year candidate see fewer jobs than a fresher', () => {
    // The exact inversion the old `selectedYear === 0` produced.
    expect(matchesJobFilters(withExp('Senior'), ['years:Fresher'])).toBe(true);
    expect(matchesJobFilters(withExp('Senior'), ['years:5 yrs'])).toBe(true);
  });

  it('still excludes a job that asks for more years than the candidate has', () => {
    expect(matchesJobFilters(withExp('8-10 years'), ['years:5 yrs'])).toBe(false);
  });

  it('includes a job whose stated minimum the candidate meets exactly', () => {
    expect(matchesJobFilters(withExp('5-8 years'), ['years:5 yrs'])).toBe(true);
  });
});

describe('matchesJobFilters — Match Quality chips', () => {
  const scored = { matchScore: 82, skill_score: 74 } as never;
  const savedJob = { matchScore: 0 } as never;   // no match payload at all

  it('applies the chips on the Smart Match tab', () => {
    expect(matchesJobFilters(scored, ['matchscore:70+'], { includeMatchScores: true })).toBe(true);
    expect(matchesJobFilters(scored, ['matchscore:90+'], { includeMatchScores: true })).toBe(false);
  });

  it('ignores them everywhere else, so Saved and Applied do not empty out', () => {
    // A saved job carries no match data, so every chip used to exclude it and
    // the whole tab went blank behind a generic "no jobs" message.
    expect(matchesJobFilters(savedJob, ['matchscore:70+'])).toBe(true);
    expect(matchesJobFilters(savedJob, ['skillscore:50+'])).toBe(true);
    expect(matchesJobFilters(savedJob, ['expscore:50+'])).toBe(true);
    expect(matchesJobFilters(savedJob, ['eduscore:50+'])).toBe(true);
  });

  it('treats the threshold as inclusive', () => {
    expect(matchesJobFilters({ matchScore: 70 } as never, ['matchscore:70+'], { includeMatchScores: true })).toBe(true);
  });

  it('excludes a job with no score when the chip IS active', () => {
    expect(matchesJobFilters({} as never, ['matchscore:70+'], { includeMatchScores: true })).toBe(false);
  });
});
