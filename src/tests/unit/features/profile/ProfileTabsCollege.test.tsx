/**
 * Profile tabs: a STUDENT gets "College" first and lands on it once; a
 * jobseeker or staff member gets exactly today's tabs. The College tab is
 * read-only and the faculty rule is first name + "+N".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { announceAccountChanged } from '@/lib/accountChange';
import React from 'react';

let activeTab = 'Personal Information';
const setActiveTab = vi.fn((t: string) => { activeTab = t; });
// ONE stable profileData object, as the real context provides: a new {} per
// render would make ProfileTabs' profileData -> tempProfile effect loop forever.
const PROFILE_DATA = vi.hoisted(() => ({}));
vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ profileData: PROFILE_DATA, activeTab, setActiveTab }),
}));

let recordState: { status: string; record?: unknown } = { status: 'none' };
vi.mock('@/hooks/useStudentRecord', () => ({ useStudentRecord: () => recordState }));

const stub = vi.hoisted(() => (name: string) => ({
  default: () => React.createElement('div', { 'data-testid': `section-${name}` }),
}));
vi.mock('@/app/(user)/profile/_components/education/EducationSection', () => stub('education'));
vi.mock('@/app/(user)/profile/_components/certifications/CertificationsSection', () => stub('certs'));
vi.mock('@/app/(user)/profile/_components/experience/WorkExperienceSection', () => stub('experience'));
vi.mock('@/app/(user)/profile/_components/PersonalInfoSection', () => stub('personal'));
vi.mock('@/app/(user)/profile/_components/SkillsSection', () => stub('skills'));
vi.mock('@/app/(user)/profile/_components/employmentInfo/EmploymentInfoSection', () => stub('employment'));
vi.mock('@/app/(user)/profile/_components/ResumeSection', () => stub('resume'));
vi.mock('@/app/(user)/profile/_components/projects/ProjectsSection', () => stub('projects'));

import ProfileTabs from '@/app/(user)/profile/_components/ProfileTabs';
import CollegeProfileSection, { facultyLabel } from '@/app/(user)/profile/_components/CollegeProfileSection';

const RECORD = {
  college: { id: 'vit', name: 'VIT Chennai', membershipId: 'm1' },
  student: { department_name: 'CSE', section_name: 'B', batch_year: 2027, admission_number: '22CSE118' },
  readiness: null,
  standing: null,
  people: { faculty: [{ name: 'Dr Meera Iyer', role: 'faculty' }], hods: [], placement_officers: [] },
};

const tabLabels = () => screen.getAllByRole('tab').map((t) => t.textContent?.trim());
const renderTabs = () =>
  render(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);

beforeEach(() => {
  activeTab = 'Personal Information';
  setActiveTab.mockClear();
  recordState = { status: 'none' };
});

describe('ProfileTabs', () => {
  it('jobseeker / staff: today\'s tabs, no College tab, default tab untouched', () => {
    renderTabs();
    expect(tabLabels()[0]).toContain('Personal');
    expect(tabLabels().some((t) => t === 'College')).toBe(false);
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it('student: College is FIRST and selected once', () => {
    recordState = { status: 'ready', record: RECORD };
    const { rerender } = renderTabs();
    expect(tabLabels()[0]).toContain('College');
    expect(setActiveTab).toHaveBeenCalledWith('College');
    setActiveTab.mockClear();
    rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    expect(setActiveTab).not.toHaveBeenCalled(); // their own choice sticks after that
  });

  it('College open and the record goes away (e.g. the college session is re-minted): falls back to Personal, never a blank page', () => {
    recordState = { status: 'ready', record: RECORD };
    const { rerender } = renderTabs();
    expect(activeTab).toBe('College');
    recordState = { status: 'loading' };
    rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    expect(setActiveTab).toHaveBeenLastCalledWith('Personal Information');
  });

  it('a tab chosen BEFORE the record arrives is kept (no yank to College)', () => {
    recordState = { status: 'loading' };
    const { rerender } = renderTabs();
    activeTab = 'Skills'; // the student clicked Skills while the record loaded
    recordState = { status: 'ready', record: RECORD };
    rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    expect(setActiveTab).not.toHaveBeenCalledWith('College');
  });

  it('College comes back after a fallback once the record returns', () => {
    recordState = { status: 'ready', record: RECORD };
    const { rerender } = renderTabs();
    const again = () => rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    recordState = { status: 'loading' };
    again();
    expect(activeTab).toBe('Personal Information');
    recordState = { status: 'ready', record: RECORD };
    again();
    expect(activeTab).toBe('College');
  });

  it('after an in-page account switch the next student lands on College again', () => {
    recordState = { status: 'ready', record: RECORD };
    const { rerender } = renderTabs();
    const again = () => rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    activeTab = 'Skills';
    recordState = { status: 'none' };
    act(() => announceAccountChanged());
    again();
    activeTab = 'Personal Information';
    setActiveTab.mockClear();
    recordState = { status: 'ready', record: RECORD };
    again();
    expect(setActiveTab).toHaveBeenCalledWith('College');
  });

  it('control: another tab open when the record goes away is left alone', () => {
    recordState = { status: 'ready', record: RECORD };
    const { rerender } = renderTabs();
    activeTab = 'Skills';
    setActiveTab.mockClear();
    recordState = { status: 'loading' };
    rerender(<ProfileTabs profile={{} as never} setProfile={vi.fn()} personalInfoRef={{ current: null }} />);
    expect(setActiveTab).not.toHaveBeenCalled();
  });
});

describe('CollegeProfileSection', () => {
  it('shows the roster values, verified, with no inputs', () => {
    const { container } = render(<CollegeProfileSection record={RECORD as never} />);
    expect(screen.getByText('CSE')).toBeInTheDocument();
    expect(screen.getByText('Verified by your college')).toBeInTheDocument();
    expect(screen.getByText('22CSE118')).toBeInTheDocument();
    expect(screen.getByText('Dr Meera Iyer')).toBeInTheDocument();
    expect(container.querySelector('input, textarea, select')).toBeNull();
  });

  it('a missing value is left out, not shown empty', () => {
    render(<CollegeProfileSection record={{ ...RECORD, student: { ...RECORD.student, section_name: null } } as never} />);
    expect(screen.queryByText('Section')).not.toBeInTheDocument();
  });

  it.each([
    [[], null],
    [['Dr Meera Iyer'], 'Dr Meera Iyer'],
    [['Dr Meera Iyer', 'Prof. K'], 'Dr Meera Iyer +1'],
    [['A', 'B', 'C'], 'A +2'],
  ])('facultyLabel(%j) -> %j', (names, expected) => {
    expect(facultyLabel(names)).toBe(expected);
  });

  it('a record that could not be loaded does NOT say the college has no details', () => {
    render(<CollegeProfileSection record={{ ...RECORD, student: null, people: null, failed: true } as never} />);
    expect(screen.queryByText(/has not added your details/i)).not.toBeInTheDocument();
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it('control: a loaded record with nothing in it says the college has not added details', () => {
    render(<CollegeProfileSection record={{ ...RECORD, student: null, people: null, failed: false } as never} />);
    expect(screen.getByText(/has not added your details/i)).toBeInTheDocument();
  });

  it('blank faculty names are ignored', () => {
    render(<CollegeProfileSection record={{ ...RECORD, people: { faculty: [{ name: '  ', role: 'faculty' }], hods: [], placement_officers: [] } } as never} />);
    expect(screen.queryByText('Faculty')).not.toBeInTheDocument();
  });
});

