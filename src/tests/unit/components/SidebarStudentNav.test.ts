/**
 * A student's Sidebar (spec: student section, "Proposed"): their college
 * first, then "YOUR COLLEGE SEES THESE", then "YOUR OWN" -- the same items as
 * today, regrouped, none removed.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }));
vi.mock('@/api/resumeApi', () => ({ getAllResumesUnified: vi.fn(), getAllResumes: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ getEnhancementHistory: vi.fn() }));
vi.mock('@/contexts/DashboardContext', () => ({ useDashboard: () => ({ data: null }) }));
vi.mock('@/hooks/useCollegeMembership', () => ({
  useHasCollegeMembership: () => false,
  useStudentCollege: () => null,
}));

import { activeNavId, studentNavGroups } from '@/components/layout/Sidebar';

const ids = (groups: ReturnType<typeof studentNavGroups>) =>
  groups.map((g) => [g.label, g.items.map((i) => i.id)]);

describe('studentNavGroups', () => {
  const groups = studentNavGroups('VIT Chennai');

  it('college first and named after the college, then the watched tools, then YOUR OWN', () => {
    expect(groups.map((g) => g.label)).toEqual(['VIT Chennai', 'YOUR COLLEGE SEES THESE', 'YOUR OWN']);
  });

  it('the college group is My progress, Tasks, My people', () => {
    expect(groups[0].items.map((i) => [i.label, i.path])).toEqual([
      ['My progress', '/institution'],
      ['Tasks', '/institution/me/tasks'],
      ['My people', '/institution/me/people'],
    ]);
  });

  it('"Your college sees these" holds exactly the PREPARE tools', () => {
    expect(ids(groups)[1]).toEqual([
      'YOUR COLLEGE SEES THESE',
      ['mock_interview', 'comm_assess', 'mock_test', 'coding_test'],
    ]);
  });

  it('YOUR OWN keeps every other item, in today\'s order (none removed)', () => {
    expect(groups[2].items.map((i) => i.id)).toEqual([
      'dashboard', 'profile', 'resume', 'ats', 'templates',
      'jd_match', 'jobs', 'tracker', 'cover_letter', 'interview_notes',
    ]);
  });

  it('does not leak the staff "My College" link into the student nav', () => {
    expect(groups.flatMap((g) => g.items).some((i) => i.id === 'institution')).toBe(false);
  });
});

describe('activeNavId', () => {
  const groups = studentNavGroups('VIT Chennai');

  it.each([
    ['/institution', 'college_progress'],
    ['/institution/me/tasks', 'college_tasks'],
    ['/institution/me/people', 'college_people'],
    ['/mock-test', 'mock_test'],
    ['/dashboard', 'dashboard'],
    ['/cover-letter/abc', 'cover_letter'],
  ])('%s -> %s', (path, id) => {
    expect(activeNavId(groups, path)).toBe(id);
  });
});
