import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeCard from '@/app/(resume)/builder/start/_components/ResumeCard';
import { computeResumeCompletion, atsTone, readEnhancedTargetRole } from '@/app/(resume)/builder/start/_components/resumeCompletion';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/(resume)/builder/start/_components/ResumeThumbnail', () => ({ default: () => <div data-testid="thumb" /> }));

const base = {
  id: 'r1', initials: 'AB', name: 'Software Developer Resume', job: '', score: 78, modified: '', created: '',
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', primary: false, source: 'builder' as const,
};

const renderCard = (resume: Partial<typeof base> & { completion?: number | null }) =>
  render(<ResumeCard resume={{ ...base, ...resume }} onDownload={vi.fn()} downloading={false} />);

describe('ResumeCard - More actions menu', () => {
  it('sets the resume as primary from the menu', () => {
    const onSetPrimary = vi.fn();
    render(<ResumeCard resume={base} onSetPrimary={onSetPrimary} onDownload={vi.fn()} downloading={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set as Primary' }));

    expect(onSetPrimary).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Set as Primary' })).not.toBeInTheDocument();
  });

  it('shows the primary resume as already primary and does not offer it again', () => {
    const onSetPrimary = vi.fn();
    render(<ResumeCard resume={{ ...base, primary: true }} onSetPrimary={onSetPrimary} onDownload={vi.fn()} downloading={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));

    expect(screen.getByRole('button', { name: 'Primary resume' })).toBeDisabled();
  });

  it('downloads from the menu', () => {
    const onDownload = vi.fn();
    render(<ResumeCard resume={base} onDownload={onDownload} downloading={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});

describe('ResumeCard — ATS score and completion', () => {
  it.each([
    [78, 'good'],
    [70, 'good'],
    [62, 'fair'],
    [55, 'fair'],
    [52, 'low'],
    [48, 'low'],
  ])('shows ATS Score - %i%% as a %s pill', (score, tone) => {
    renderCard({ score });
    const pill = screen.getByTestId('ats-score-pill');
    expect(pill).toHaveTextContent(`ATS Score - ${score}%`);
    expect(pill).toHaveAttribute('data-tone', tone);
  });

  it('uses a different colour for each of the three bands', () => {
    const colours = [80, 60, 40].map((score) => {
      const { unmount } = renderCard({ score });
      const cls = screen.getByTestId('ats-score-pill').className;
      unmount();
      return cls;
    });
    expect(new Set(colours).size).toBe(3);
  });

  it('shows how much of the resume is complete', () => {
    renderCard({ completion: 75 });
    expect(screen.getByText('75% complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Resume completion' })).toHaveAttribute('aria-valuenow', '75');
  });

  it('shows a placeholder while the completion is still unknown', () => {
    renderCard({});
    expect(screen.queryByText(/% complete/)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Resume completion' })).not.toHaveAttribute('aria-valuenow');
  });

  it('shows a dash when the completion could not be read', () => {
    renderCard({ completion: null });
    expect(screen.queryByText(/% complete/)).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('does not show a Builder / Enhancer source label', () => {
    const { unmount } = renderCard({ source: 'builder' });
    expect(screen.queryByText('Builder')).not.toBeInTheDocument();
    unmount();
    renderCard({ source: 'enhanced' as never });
    expect(screen.queryByText('Enhancer')).not.toBeInTheDocument();
  });

  it('keeps the name, ATS pill, details, progress and both buttons together beside the thumbnail', () => {
    renderCard({ completion: 40 });
    const column = screen.getByTestId('ats-score-pill').closest('.flex-col') as HTMLElement;
    expect(column).toContainElement(screen.getByText('Software Developer Resume'));
    expect(column).toContainElement(screen.getByText(/^Updated /));
    expect(column).toContainElement(screen.getByRole('progressbar', { name: 'Resume completion' }));
    expect(column).toContainElement(screen.getByRole('button', { name: 'Continue Editing' }));
    expect(column).toContainElement(screen.getByRole('button', { name: 'More actions' }));
  });

  it('no longer draws the score ring', () => {
    const { container } = renderCard({ score: 78 });
    expect(container.querySelector('path[stroke-dasharray]')).toBeNull();
    expect(screen.queryByText('ATS Score', { exact: true })).not.toBeInTheDocument();
  });
});

describe('ResumeCard — one-line details', () => {
  it('keeps the updated date on one line', () => {
    renderCard({});
    expect(screen.getByText(/^Updated /).className).toContain('whitespace-nowrap');
  });

  it('keeps the target role on a single line, shortening a long role', () => {
    renderCard({ job: 'Senior Full Stack Developer and Cloud Platform Architect' });
    const role = screen.getByText('Senior Full Stack Developer and Cloud Platform Architect');
    const row = role.parentElement as HTMLElement;
    expect(row.className).toContain('flex-nowrap');
    expect(row.className).not.toContain('flex-wrap');
    expect(role.className).toContain('truncate');
  });
});

describe('resume completion helpers', () => {
  it('counts the filled core sections', () => {
    expect(computeResumeCompletion({})).toBe(0);
    expect(computeResumeCompletion(null)).toBe(0);
    expect(computeResumeCompletion({
      personalInfo: { fullname: 'A', email: 'a@b.c', phone: '1' },
      professionalSummary: { summary: 'x' },
      education: [{ degree: 'x' }],
      workExperience: [{ company: 'x' }],
    })).toBe(50);
  });

  it('counts a list record in the API shape (snake_case, nested skills) too', () => {
    expect(computeResumeCompletion({
      personalInfo: { fullname: 'A', email: 'a@b.c', phone: '1' },
      professional_summary: { summary: 'x', target_role: 'Dev' },
      work_experience: [{ company: 'Acme', role: 'Dev' }],
      education: [{ school: 'MIT', degree: 'BS' }],
      skills: { programmingLanguages: [{ name: 'TypeScript' }], frameworks: [{ name: 'React' }] },
      projects: [{ title: 'Portfolio' }],
      certifications: [{ name: 'AWS' }],
      internships: [{ company: 'X', role: 'Intern' }],
    })).toBe(100);
  });

  it('bands scores at 55 and 70', () => {
    expect(atsTone(70)).toBe('good');
    expect(atsTone(69)).toBe('fair');
    expect(atsTone(55)).toBe('fair');
    expect(atsTone(54)).toBe('low');
  });
});

describe('readEnhancedTargetRole', () => {
  it('uses the target role when the resume has one (freshers)', () => {
    expect(readEnhancedTargetRole({
      enhanced_data: { professionalSummary: { summary: 's', targetRole: 'Junior Data Analyst' }, headline: ['Ignored'] },
    })).toBe('Junior Data Analyst');
  });

  it('falls back to the parser headline for experienced resumes (array or text)', () => {
    expect(readEnhancedTargetRole({ enhanced_data: { professionalSummary: { summary: 's', targetRole: '' }, headline: ['Senior Backend Engineer', 'Cloud'] } }))
      .toBe('Senior Backend Engineer');
    expect(readEnhancedTargetRole({ enhanced_data: { headline: 'Product Manager' } })).toBe('Product Manager');
  });

  it('looks in the enhancer copy and the original parse too', () => {
    expect(readEnhancedTargetRole({ enhancer_state: { resume: { headline: ['QA Lead'] } } })).toBe('QA Lead');
    expect(readEnhancedTargetRole({ original_data: { headline: ['DevOps Engineer'] } })).toBe('DevOps Engineer');
    expect(readEnhancedTargetRole({ professional_summary: { target_role: 'Designer' } })).toBe('Designer');
  });

  it('returns an empty string when neither exists', () => {
    expect(readEnhancedTargetRole({ enhanced_data: { headline: [] } })).toBe('');
    expect(readEnhancedTargetRole(null)).toBe('');
  });
});
