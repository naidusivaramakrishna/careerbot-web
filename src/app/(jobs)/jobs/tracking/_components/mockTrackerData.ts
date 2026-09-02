/**
 * Mock Job Tracker Data
 * TODO: Replace with API call from useJobTracker hook when backend is ready
 */

export interface JobApplicationRecord {
  id: string;
  title: string;
  company: string;
  status: 'Applied' | 'Saved' | 'Interview' | 'Offer' | 'Rejected';
  appliedDate: string;
  notes: string;
  location?: string;
  jobUrl?: string;
}

export const mockTrackerData: JobApplicationRecord[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'Tech Innovations Inc',
    status: 'Interview',
    appliedDate: '2024-02-15',
    notes: 'First round interview scheduled for Feb 22. Focus on React patterns and state management.',
    location: 'San Francisco, CA',
    jobUrl: 'https://example.com/jobs/1',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'Digital Solutions Ltd',
    status: 'Applied',
    appliedDate: '2024-02-18',
    notes: 'Application submitted. Waiting for recruiter response.',
    location: 'Remote',
    jobUrl: 'https://example.com/jobs/2',
  },
  {
    id: '3',
    title: 'Frontend Engineer',
    company: 'Creative Studios',
    status: 'Saved',
    appliedDate: '2024-02-10',
    notes: 'Interesting role with focus on UI/UX. Salary competitive.',
    location: 'New York, NY',
    jobUrl: 'https://example.com/jobs/3',
  },
  {
    id: '4',
    title: 'Product Engineer',
    company: 'StartUp Ventures',
    status: 'Offer',
    appliedDate: '2024-01-20',
    notes: 'Offer received: $150k + equity. Pending decision.',
    location: 'Austin, TX',
    jobUrl: 'https://example.com/jobs/4',
  },
  {
    id: '5',
    title: 'Software Engineer',
    company: 'Legacy Systems Corp',
    status: 'Rejected',
    appliedDate: '2024-02-05',
    notes: 'Rejected - looking for more backend experience.',
    location: 'Chicago, IL',
    jobUrl: 'https://example.com/jobs/5',
  },
  {
    id: '6',
    title: 'JavaScript Developer',
    company: 'Web Design Co',
    status: 'Applied',
    appliedDate: '2024-02-17',
    notes: 'Applied yesterday. Strong match for the role.',
    location: 'Seattle, WA',
    jobUrl: 'https://example.com/jobs/6',
  },
  {
    id: '7',
    title: 'TypeScript Developer',
    company: 'NextGen Tech',
    status: 'Interview',
    appliedDate: '2024-02-12',
    notes: 'Second round scheduled for Feb 25. Prepare system design.',
    location: 'Remote',
    jobUrl: 'https://example.com/jobs/7',
  },
  {
    id: '8',
    title: 'UI Engineer',
    company: 'Design Focused Startup',
    status: 'Saved',
    appliedDate: '2024-02-16',
    notes: 'Excellent opportunity for portfolio work.',
    location: 'Los Angeles, CA',
    jobUrl: 'https://example.com/jobs/8',
  },
];
