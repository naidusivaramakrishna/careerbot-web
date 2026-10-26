/**
 * /institution/me/tasks and /institution/me/people: student screens.
 *
 * The REAL resource hooks are used; only the API calls are stubbed. So "no
 * request for staff" is asserted on the request itself, not on what the page
 * passed to a mocked hook. A non-student sees nothing of the screen and is
 * sent to their college overview (no refusal page is added for staff).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

let role: string | null = 'student';
vi.mock('@/contexts/InstitutionContext', () => ({ useInstitution: () => ({ role }) }));

const listMyTasks = vi.fn();
const getMyPeople = vi.fn();
vi.mock('@/api/institutionApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/institutionApi')>()),
  listMyTasks: () => listMyTasks(),
  getMyPeople: () => getMyPeople(),
}));
vi.mock('@/app/institution/_components/MyTasksCard', () => ({
  MyTasksCard: ({ tasks }: { tasks: unknown[] }) => <div data-testid="tasks-card">{tasks.length} tasks</div>,
}));
vi.mock('@/app/institution/_components/MyPeopleCard', () => ({
  MyPeopleCard: () => <div data-testid="people-card" />,
}));

import MyTasksPage from '@/app/institution/me/tasks/page';
import MyPeoplePage from '@/app/institution/me/people/page';

beforeEach(() => {
  role = 'student';
  replace.mockReset();
  listMyTasks.mockReset().mockResolvedValue([]);
  getMyPeople.mockReset().mockResolvedValue({});
});

describe('student Tasks screen', () => {
  it('a student sees their tasks (empty list included)', async () => {
    render(<MyTasksPage />);
    await waitFor(() => expect(screen.getByTestId('tasks-card')).toHaveTextContent('0 tasks'));
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(listMyTasks).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it.each(['faculty', 'hod', 'cpo'])('%s: nothing rendered, no request, sent to /institution', async (r) => {
    role = r;
    const { container } = render(<MyTasksPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/institution'));
    expect(container).toBeEmptyDOMElement();
    expect(listMyTasks).not.toHaveBeenCalled();
  });

  it('role not known yet: nothing rendered, no request, no redirect', () => {
    role = null;
    const { container } = render(<MyTasksPage />);
    expect(container).toBeEmptyDOMElement();
    expect(listMyTasks).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('student My people screen', () => {
  it('a student sees their people', async () => {
    render(<MyPeoplePage />);
    await waitFor(() => expect(screen.getByTestId('people-card')).toBeInTheDocument());
    expect(screen.getByText('My people')).toBeInTheDocument();
    expect(getMyPeople).toHaveBeenCalledTimes(1);
  });

  it.each(['faculty', 'hod', 'cpo'])('%s: nothing rendered, no request, sent to /institution', async (r) => {
    role = r;
    const { container } = render(<MyPeoplePage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/institution'));
    expect(container).toBeEmptyDOMElement();
    expect(getMyPeople).not.toHaveBeenCalled();
  });
});
