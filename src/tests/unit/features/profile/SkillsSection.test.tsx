/**
 * Unit tests for SkillsSection — the skills management section on the profile page.
 *
 * Covers:
 *   - Skills fetched on mount are rendered as chip tags
 *   - Skill input and Add button are present
 *   - Add button calls addSkillItem with the typed skill
 *   - Enter key also triggers add
 *   - "Adding..." shown while add request is in flight
 *   - Delete button removes skill via deleteSkill
 *   - Suggestions dropdown appears on focus when input is empty
 *   - Suggestions are filtered by typed text
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetSkills = vi.fn();
const mockDeleteSkill = vi.fn();
vi.mock('@/api/userApi', () => ({
  getSkills: (...args: unknown[]) => mockGetSkills(...args),
  deleteSkill: (...args: unknown[]) => mockDeleteSkill(...args),
}));

const mockAddSkillItem = vi.fn();
vi.mock('@/app/(user)/profile/_utils/autoFillHelper', () => ({
  addSkillItem: (...args: unknown[]) => mockAddSkillItem(...args),
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

vi.mock('@/app/(user)/profile/_utils/skillsData', () => ({
  suggestedSkills: ['React', 'TypeScript', 'Node.js', 'Python'],
}));

// ─── Component under test ─────────────────────────────────────────────────────
import SkillsSection from '@/app/(user)/profile/_components/SkillsSection';
import type { ProfileData } from '@/app/(user)/profile/_types/ProfileData';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseProfile: ProfileData = {
  personalInformation: { fullName: '', email: '' },
  skills: [],
};

const defaultProps = {
  tempProfile: baseProfile,
  setTempProfile: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SkillsSection — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders skills fetched on mount as chip tags', async () => {
    mockGetSkills.mockResolvedValueOnce([
      { id: '1', name: 'React' },
      { id: '2', name: 'TypeScript' },
    ]);

    render(<SkillsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('React', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText('TypeScript', { selector: 'span' })).toBeInTheDocument();
    });
  });

  it('renders the skill input with placeholder text', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByPlaceholderText('Add a skill...')).toBeInTheDocument();
  });

  it('renders the Add button', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    render(<SkillsSection {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });
});

describe('SkillsSection — add skill', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls addSkillItem with typed skill name on Add click', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    mockAddSkillItem.mockResolvedValueOnce({ id: '3', name: 'Vue' });

    render(<SkillsSection {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Add a skill...'), {
      target: { value: 'Vue' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockAddSkillItem).toHaveBeenCalledWith({ name: 'Vue' }, false);
    });
  });

  it('calls addSkillItem on Enter key press', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    mockAddSkillItem.mockResolvedValueOnce({ id: '4', name: 'Python' });

    render(<SkillsSection {...defaultProps} />);

    const input = screen.getByPlaceholderText('Add a skill...');
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockAddSkillItem).toHaveBeenCalledWith({ name: 'Python' }, false);
    });
  });

  it('shows "Adding..." while add request is in flight', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    let resolveAdd!: (v: unknown) => void;
    mockAddSkillItem.mockReturnValueOnce(new Promise(r => { resolveAdd = r; }));

    render(<SkillsSection {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Add a skill...'), {
      target: { value: 'Django' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('Adding...')).toBeInTheDocument();

    resolveAdd({ id: '5', name: 'Django' });
    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument();
    });
  });

  it('clears the input after a successful add', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    mockAddSkillItem.mockResolvedValueOnce({ id: '6', name: 'GraphQL' });

    render(<SkillsSection {...defaultProps} />);

    const input = screen.getByPlaceholderText('Add a skill...');
    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });
});

describe('SkillsSection — delete skill', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteSkill with the correct id on chip delete click', async () => {
    mockGetSkills.mockResolvedValueOnce([{ id: 'abc-123', name: 'React' }]);
    mockDeleteSkill.mockResolvedValueOnce(undefined);

    render(<SkillsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('React', { selector: 'span' })).toBeInTheDocument();
    });

    const chip = screen.getByText('React', { selector: 'span' });
    const deleteBtn = within(chip).getByRole('button');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteSkill).toHaveBeenCalledWith('abc-123');
    });
  });

  it('removes the skill chip from the UI after deletion', async () => {
    mockGetSkills.mockResolvedValueOnce([{ id: 'xyz', name: 'Vue' }]);
    mockDeleteSkill.mockResolvedValueOnce(undefined);

    render(<SkillsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Vue', { selector: 'span' })).toBeInTheDocument();
    });

    const chip = screen.getByText('Vue', { selector: 'span' });
    fireEvent.click(within(chip).getByRole('button'));

    await waitFor(() => {
      expect(screen.queryByText('Vue', { selector: 'span' })).not.toBeInTheDocument();
    });
  });
});

describe('SkillsSection — suggestions dropdown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows all suggestions on input focus when input is empty', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    render(<SkillsSection {...defaultProps} />);

    fireEvent.focus(screen.getByPlaceholderText('Add a skill...'));

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('filters suggestions to match typed text', async () => {
    mockGetSkills.mockResolvedValueOnce([]);
    render(<SkillsSection {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Add a skill...'), {
      target: { value: 'type' },
    });

    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
    });
  });

  it('excludes already-added skills from suggestions', async () => {
    mockGetSkills.mockResolvedValueOnce([{ id: '1', name: 'React' }]);
    render(<SkillsSection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('React', { selector: 'span' })).toBeInTheDocument();
    });

    fireEvent.focus(screen.getByPlaceholderText('Add a skill...'));

    // React is already added, should not appear in suggestions
    const suggestions = screen.queryAllByText('React');
    // Only the chip should have React, not a suggestion div
    expect(suggestions).toHaveLength(1);
  });
});
