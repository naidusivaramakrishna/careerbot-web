/**
 * Unit tests for ProjectsSection — CRUD UI for project entries.
 *
 * Covers:
 *   - Renders empty state when no projects and API returns []
 *   - Renders project cards when tempProfile has data
 *   - Does not call getProjects when data already in tempProfile
 *   - Opens add modal when "Add Project" button is clicked
 *   - Calls addProjectItem and shows success toast on add save
 *   - Opens edit modal when edit button is clicked
 *   - Calls updateProjects and shows success toast on edit save
 *   - Opens confirm delete modal when delete button is clicked
 *   - Calls deleteProject on confirm
 *   - Cancels delete when cancel is clicked
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetProjects = vi.fn();
const mockUpdateProjects = vi.fn();
const mockDeleteProject = vi.fn();

vi.mock('@/api/userApi', () => ({
  getProjects: (...args: unknown[]) => mockGetProjects(...args),
  updateProjects: (...args: unknown[]) => mockUpdateProjects(...args),
  deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
}));

const mockAddProjectItem = vi.fn();
vi.mock('@/app/(user)/profile/_utils/autoFillHelper', () => ({
  addProjectItem: (...args: unknown[]) => mockAddProjectItem(...args),
}));

const mockSetProfileData = vi.fn();
vi.mock('@/app/(user)/profile/context/ProfileContext', () => ({
  useProfileContext: () => ({ setProfileData: mockSetProfileData }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshDashboard: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

// ─── Component under test ─────────────────────────────────────────────────────
import ProjectsSection from '@/app/(user)/profile/_components/projects/ProjectsSection';
import { toast } from 'sonner';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const emptyProfile = { projects: [] };
const projectEntry = {
  id: 'proj-1',
  project_name: 'CareerBot',
  role: 'Lead Developer',
  technologies: 'React, TypeScript',
  start_date: '2023-01-01',
  end_date: '2023-12-01',
  description: 'AI-powered career platform.',
  project_link: 'https://careerbot.ai',
};
const profileWithProj = { projects: [projectEntry] };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectsSection — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjects.mockResolvedValue([]);
  });

  it('shows empty state when API returns no projects', async () => {
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('add-project-btn')).toBeInTheDocument();
    });
  });
});

describe('ProjectsSection — list rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders project card when data is pre-loaded', async () => {
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => {
      expect(screen.getByTestId('project-card-0')).toBeInTheDocument();
    });
  });

  it('does not call getProjects when tempProfile already has projects', async () => {
    mockGetProjects.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-card-0')).toBeInTheDocument());
    expect(mockGetProjects).not.toHaveBeenCalled();
  });
});

describe('ProjectsSection — add project', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens add modal when "Add Project" button is clicked', async () => {
    mockGetProjects.mockResolvedValue([]);
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-project-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-project-btn'));
    expect(screen.getByTestId('proj-name-input')).toBeInTheDocument();
  });

  it('calls addProjectItem and shows success toast on save', async () => {
    mockGetProjects.mockResolvedValue([]);
    mockAddProjectItem.mockResolvedValue({
      id: 'new-1',
      project_name: 'New Project',
      role: 'Developer',
    });
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={emptyProfile} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('add-project-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-project-btn'));
    fireEvent.change(screen.getByTestId('proj-name-input'), {
      target: { value: 'New Project' },
    });
    fireEvent.click(screen.getByTestId('proj-save-btn'));

    await waitFor(() => {
      expect(mockAddProjectItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Project added');
    });
  });
});

describe('ProjectsSection — edit project', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens edit modal when edit button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('project-edit-btn-0'));
    expect(screen.getByTestId('proj-name-input')).toBeInTheDocument();
  });

  it('calls updateProjects and shows success toast on edit save', async () => {
    mockUpdateProjects.mockResolvedValue({
      ...projectEntry,
      project_name: 'CareerBot v2',
    });
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-edit-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('project-edit-btn-0'));
    fireEvent.click(screen.getByTestId('proj-save-btn'));

    await waitFor(() => {
      expect(mockUpdateProjects).toHaveBeenCalledWith('proj-1', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Project updated');
    });
  });
});

describe('ProjectsSection — delete project', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens confirm delete modal when delete button is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('project-delete-btn-0'));
    expect(screen.getByTestId('modal-confirm-btn')).toBeInTheDocument();
  });

  it('calls deleteProject on confirm', async () => {
    mockDeleteProject.mockResolvedValue({});
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('project-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith('proj-1');
    });
  });

  it('does not call deleteProject when cancel is clicked', async () => {
    const setTempProfile = vi.fn();
    render(<ProjectsSection tempProfile={profileWithProj} setTempProfile={setTempProfile} />);
    await waitFor(() => expect(screen.getByTestId('project-delete-btn-0')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('project-delete-btn-0'));
    fireEvent.click(screen.getByTestId('modal-cancel-btn'));
    expect(mockDeleteProject).not.toHaveBeenCalled();
  });
});
