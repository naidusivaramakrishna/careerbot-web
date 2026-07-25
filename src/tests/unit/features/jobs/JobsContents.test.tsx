import { describe, it, expect } from 'vitest';
import { matchesJobFilters } from '@/app/(jobs)/jobslogin/_components/utils/jobFilterUtils';
import { getSafeExternalUrl } from '@/utils/validators';

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
