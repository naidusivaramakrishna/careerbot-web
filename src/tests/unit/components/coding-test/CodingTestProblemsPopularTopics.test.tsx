import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { fireEvent, render, screen, within, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ProblemWithStatus } from '@/app/coding-test/_lib/types';

// These render whole pages; give them room on a busy CI host.
configure({ asyncUtilTimeout: 10000 });
vi.setConfig({ testTimeout: 30000 });

// The problems list page loads its data from the annotated-problems call; the
// Popular Topics cards must reflect that data, not a hard-coded list.

let mockProblems: ProblemWithStatus[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/coding-test/_lib/api', () => ({
  fetchProblems: vi.fn(async () => ({ problems: mockProblems, total: mockProblems.length })),
  fetchTopics: vi.fn(async () => []),
}));

vi.mock('@/app/coding-test/_lib/gradingApi', () => ({
  fetchProblemsAnnotated: vi.fn(async () => mockProblems),
}));

import CodingProblemsListPage from '@/app/coding-test/problems/page';

function p(slug: string, tag: string): ProblemWithStatus {
  return { slug, title: `Problem ${slug}`, difficulty: 'easy', tag, user_status: null };
}

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false, media: query, onchange: null,
        addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
      }),
    });
  }
});

beforeEach(() => {
  mockProblems = [];
  localStorage.clear();
});

async function popularTopicsSection(): Promise<HTMLElement> {
  const heading = await screen.findByText('Popular Topics', { selector: 'h2' });
  return heading.closest('div.px-5') as HTMLElement;
}

// Text + closest('button') instead of *ByRole: role queries over this page's
// SVG icons take seconds each in jsdom.
function topicCard(section: HTMLElement, name: string): HTMLElement {
  return within(section).getByText(name, { selector: 'p' }).closest('button') as HTMLElement;
}

describe('coding-test problems page: Popular Topics', () => {
  it('shows the topics and counts present in the loaded problems, not a hard-coded list', async () => {
    mockProblems = [p('a1', 'Arrays'), p('a2', 'Arrays'), p('a3', 'Arrays'), p('m1', 'Math')];
    render(<CodingProblemsListPage />);
    await screen.findByText('Problem a1');
    const section = await popularTopicsSection();
    expect(topicCard(section, 'Arrays')).toHaveTextContent('3 Problems');
    expect(topicCard(section, 'Math')).toHaveTextContent('1 Problem');
    expect(topicCard(section, 'Math')).not.toHaveTextContent('1 Problems');
    // Topics absent from the data (and their made-up counts) are not offered.
    expect(within(section).queryByText('Dynamic Programming')).not.toBeInTheDocument();
    expect(within(section).queryByText('Infosys')).not.toBeInTheDocument();
    expect(within(section).queryByText(/27 Problems/)).not.toBeInTheDocument();
  });

  it('hides the section when no loaded problem carries a topic (empty state)', async () => {
    mockProblems = [p('x1', '')];
    render(<CodingProblemsListPage />);
    await screen.findByText('Problem x1');
    expect(screen.queryByText('Popular Topics', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('clicking a topic card filters the list to that topic (control)', async () => {
    mockProblems = [p('a1', 'Arrays'), p('m1', 'Math')];
    render(<CodingProblemsListPage />);
    await screen.findByText('Problem a1');
    const section = await popularTopicsSection();
    fireEvent.click(topicCard(section, 'Math'));
    expect(screen.queryByText('Problem a1')).not.toBeInTheDocument();
    expect(screen.getByText('Problem m1')).toBeInTheDocument();
  });
});
