import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  expandNestedSkillBuckets,
  mapBackendSkillsToCategorized,
  ResumeProvider,
  useResume,
  type CustomSection,
} from '@/app/(resume)/builder/creation/_context/ResumeContext';
import { getResumeById, getDefaultTemplate } from '@/api/resumeApi';
import { getEnhancedResume, applyFix, deleteFix } from '@/api/enhancerApi';
import { httpClient } from '@/lib/http';
import { toast } from 'sonner';
import { fixedEducationSnapshot } from '@/tests/fixtures/enhancer/canonicalSnapshots';

vi.mock('@/api/resumeApi', () => ({
  getResumeById: vi.fn(),
  getDefaultTemplate: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  getEnhancedResume: vi.fn(),
  applyFix: vi.fn(),
  deleteFix: vi.fn(),
}));

vi.mock('@/lib/http', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

vi.mock('@/utils/resumeMappers', () => ({
  mapParserOutputToBuilderData: vi.fn((data) => ({
    personalInfo: {
      fullname: data?.personalInfo?.fullname || data?.name || '',
      email: data?.personalInfo?.email || '',
      countryCode: '',
      phone: data?.personalInfo?.phone || '',
      location: data?.personalInfo?.location || '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    professionalSummary: {
      summary: data?.professionalSummary?.summary || '',
      targetRole: data?.professionalSummary?.targetRole || '',
    },
    education: [],
    workExperience: [],
    projects: [],
    skills: [],
    categorizedSkills: {
      programming_languages: [],
      frameworks: [],
      soft_skills: [],
      project_management: [],
      marketing_sales: [],
    },
    certifications: [],
    achievements: [],
    volunteering: [],
    references: [],
    internships: [],
    awards: [],
    hobbies: [],
    interests: [],
    languages: [],
    publications: [],
    customSections: [],
  })),
}));

vi.mock('@/app/(resume)/builder/creation/_utils/templateStyles', () => ({
  TEMPLATE_DEFAULT_STYLES: {
    clean_simple: {
      fontFamily: 'inter',
      headingColor: '#111111',
    },
    modern_blue: {
      fontFamily: 'arial',
      headingColor: '#2557a7',
    },
  },
  STYLE_CATALOGUES: {
    modern: {
      style: {
        bodyColor: '#222222',
      },
    },
    eclipse: {
      style: {
        headingColor: '#333333',
      },
    },
  },
}));

vi.mock('@/app/(resume)/templates/_utils/sectionOrder', () => ({
  getSectionOrder: vi.fn(() => ['Personal Info', 'Professional Summary', 'Skills']),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

type ResumeContextSnapshot = ReturnType<typeof useResume>;

let latestContext: ResumeContextSnapshot;

const Consumer = () => {
  const context = useResume();
  latestContext = context;

  return (
    <div>
      <p>Loading: {String(context.isLoadingResume)}</p>
      <p>Resume ID: {context.resumeId || 'none'}</p>
      <p>Name: {context.resumeData.personalInfo.fullname || 'empty'}</p>
      <p>Phone: {context.resumeData.personalInfo.phone || 'empty'}</p>
      <p>Country: {context.resumeData.personalInfo.countryCode || 'empty'}</p>
      <p>Template: {context.selectedTemplate || 'none'}</p>
      <p>Completion: {context.getCompletionPercentage()}</p>
      <p>Custom sections: {context.resumeData.customSections?.map((section) => section.sectionName).join(',') || 'none'}</p>
      <p>Suggestions: {context.enhancedSuggestions.map((suggestion) => suggestion.id).join(',') || 'none'}</p>
    </div>
  );
};

const renderProvider = (props: { resumeId?: string; source?: string } = {}) =>
  render(
    <ResumeProvider {...props}>
      <Consumer />
    </ResumeProvider>
  );

const builderResume = {
  id: 'builder-1',
  personalInfo: {
    fullname: 'Avery Builder',
    email: 'avery@example.com',
    phone: '+911234567890',
    location: 'Bengaluru',
    portifolioUrl: 'https://portfolio.example.com',
  },
  professionalSummary: 'Legacy summary',
  education: [{ _id: 'edu-1', school: 'State University', degree: 'BS', startDate: '2020', endDate: '2024' }],
  workExperience: [{ _id: 'work-1', company: 'Acme', role: 'Engineer', startDate: '2024', endDate: '', currentlyWorking: true }],
  projects: [],
  skills: {
    programmingLanguages: [{ id: 'skill-1', name: 'TypeScript' }],
    frameworks: [{ id: 'skill-2', name: 'React' }],
    softSkills: [{ id: 'skill-3', name: 'Communication' }],
  },
  certifications: [{ _id: 'cert-1', name: 'AWS', issuedBy: 'Amazon', year: '2025' }],
  achievements: [],
  volunteering: [],
  references: [],
  internships: [],
  awards: [],
  hobbies: [],
  interests: [],
  languages: [],
  publications: [],
  customSections: [
    {
      id: 'custom-1',
      sectionName: 'Open Source',
      fields: [{ id: 'field-1', fieldName: 'Project', fieldType: 'text', value: 'Design system' }],
    },
  ],
};

const enhancedResume = {
  id: 'enhanced-1',
  display_name: 'Enhanced Avery',
  enhanced_data: {
    personalInfo: {
      fullname: '',
      email: 'enhanced@example.com',
      phone: '+14155550101',
      location: 'Remote',
    },
    professionalSummary: {
      summary: 'Enhanced summary',
      targetRole: 'Senior Frontend Engineer',
    },
  },
  enhancer_state: { id: 'state-1' },
  ats_score: {
    final_score: 76,
    section_breakdown: {
      summary: {
        deductions: [
          {
            id: 'suggestion-1',
            penalty: 3,
            after_example: 'Use a stronger quantified summary.',
          },
        ],
      },
    },
  },
};

const mockGetResumeById = vi.mocked(getResumeById);
const mockGetDefaultTemplate = vi.mocked(getDefaultTemplate);
const mockGetEnhancedResume = vi.mocked(getEnhancedResume);
const mockApplyFix = vi.mocked(applyFix);
const mockDeleteFix = vi.mocked(deleteFix);
const mockHttpPost = vi.mocked(httpClient.post);
const mockToast = vi.mocked(toast);

describe('ResumeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockGetDefaultTemplate.mockResolvedValue({ template_id: 'modern_blue' } as never);
    mockGetResumeById.mockResolvedValue(builderResume as never);
    mockGetEnhancedResume.mockResolvedValue(enhancedResume as never);
    mockApplyFix.mockResolvedValue({
      success: true,
      enhancer_state: {
        resume: {
          personalInfo: {
            fullname: 'Auto Fixed Avery',
            email: 'fixed@example.com',
            phone: '+911111111111',
          },
          professionalSummary: {
            summary: 'Fixed summary',
            targetRole: 'Frontend Lead',
          },
        },
        ats_breakdown: { final_score: 88 },
      },
      suggestions: [],
      applied_fixes: [{ suggestion_id: 'suggestion-1', status: 'applied', undo_available: true }],
      operation: { type: 'apply_fix', suggestion_id: 'suggestion-1' },
    } as never);
    mockDeleteFix.mockResolvedValue({
      // Legacy deployed delete handlers did not include `success`, despite
      // returning this valid completed-undo payload.
      deleted_suggestion_id: 'suggestion-1',
      enhanced_data: enhancedResume.enhanced_data,
      ats_score: {
        final_score: 71,
        section_breakdown: enhancedResume.ats_score.section_breakdown,
      },
    } as never);
    mockHttpPost.mockResolvedValue({ data: { id: 'created-1' } } as never);
  });

  it('maps backend skill objects into categorized skills and skill id lookup', () => {
    expect(
      mapBackendSkillsToCategorized({
        programmingLanguages: [{ id: '1', name: 'TypeScript' }],
        frameworks: [{ id: '2', name: 'React' }],
        softSkills: [{ id: '3', name: 'Mentoring' }],
      })
    ).toEqual({
      programming_languages: ['TypeScript'],
      frameworks: ['React'],
      soft_skills: ['Mentoring'],
      project_management: [],
      marketing_sales: [],
      skill_id_map: {
        'programming_languages:TypeScript': '1',
        'frameworks:React': '2',
        'soft_skills:Mentoring': '3',
      },
    });

    expect(mapBackendSkillsToCategorized(null).programming_languages).toEqual([]);
  });

  it('preserves deleted predefined categories so they stay hidden after reload', () => {
    expect(mapBackendSkillsToCategorized({
      softSkills: [{ id: '1', name: 'Communication' }],
      deletedCategories: ['marketing_sales'],
    })).toMatchObject({
      soft_skills: ['Communication'],
      hidden_predefined_categories: ['marketing_sales'],
    });
  });
  it('renders slash-based custom category acronyms from backend slugs', () => {
    const mapped = mapBackendSkillsToCategorized({
      customSkills: {
        ci_cd: [{ id: '1', name: 'Jenkins' }],
        ai_ml: [{ id: '2', name: 'Deep Learning' }],
        'Ci Cd': [{ id: '3', name: 'GitHub Actions' }],
      },
    });

    expect(mapped.custom_categories).toEqual([
      { id: 'custom_backend_ci_cd', name: 'CI/CD', skills: ['Jenkins'] },
      { id: 'custom_backend_ai_ml', name: 'AI/ML', skills: ['Deep Learning'] },
      { id: 'custom_backend_Ci Cd', name: 'CI/CD', skills: ['GitHub Actions'] },
    ]);
  });
  it('starts with empty resume data when no resume id is provided', async () => {
    renderProvider();

    expect(await screen.findByText('Loading: false')).toBeInTheDocument();
    expect(screen.getByText('Resume ID: none')).toBeInTheDocument();
    expect(screen.getByText('Name: empty')).toBeInTheDocument();
    expect(mockGetResumeById).not.toHaveBeenCalled();
  });

  it('loads a builder resume, normalizes legacy data, skills, phone, ids, template, and custom sections', async () => {
    renderProvider({ resumeId: 'builder-1' });

    expect(await screen.findByText('Loading: false')).toBeInTheDocument();
    expect(screen.getByText('Resume ID: builder-1')).toBeInTheDocument();
    expect(screen.getByText('Name: Avery Builder')).toBeInTheDocument();
    expect(screen.getByText('Phone: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Country: +91')).toBeInTheDocument();
    expect(screen.getByText('Template: modern_blue')).toBeInTheDocument();
    expect(screen.getByText('Custom sections: Open Source')).toBeInTheDocument();

    expect(latestContext.resumeData.professionalSummary).toEqual({
      summary: 'Legacy summary',
      targetRole: '',
    });
    expect(latestContext.resumeData.education[0].id).toBe('edu-1');
    expect(latestContext.resumeData.workExperience[0].id).toBe('work-1');
    expect(latestContext.resumeData.skills).toEqual(['TypeScript', 'React', 'Communication']);
    expect(latestContext.resumeData.certifications[0]).toMatchObject({
      id: 'cert-1',
      issuer: 'Amazon',
      issueDate: '2025',
    });
    expect(mockToast.success).toHaveBeenCalledWith('Resume loaded successfully!');
  });

  it('keeps domain-specific personal info fields when loading a saved resume', async () => {
    // careerbot-api GET /resumes/{id} returns these under camelCase keys in
    // personalInfo (PersonalInfoOut). EditorTab now requires them for the
    // active domain, so dropping them on load blanks the form after a reload
    // and blocks the next Personal Info save.
    const domainFields = {
      fathersName: 'R. Builder',
      gender: 'Female',
      maritalStatus: 'Single',
      permanentAddress: '12 Harbour Rd',
      specialisation: 'Cardiology',
      medicalRegNo: 'MCI-123',
      barEnrollmentNo: 'D/123/2015',
      yearOfEnrollment: '2015',
      courtsOfPractise: 'Delhi High Court',
      rank: 'Chief Officer',
      cocNumber: 'COC-9',
      vesselTypes: 'Tanker',
      stcwCertificates: 'BST, AFF',
      orcidId: '0000-0002-1825-0097',
      googleScholarUrl: 'https://scholar.google.com/citations?user=x',
      hIndex: '12',
    };
    mockGetResumeById.mockResolvedValue({
      ...builderResume,
      personalInfo: { ...builderResume.personalInfo, ...domainFields },
    } as never);

    renderProvider({ resumeId: 'builder-1' });

    expect(await screen.findByText('Loading: false')).toBeInTheDocument();
    expect(latestContext.resumeData.personalInfo).toMatchObject(domainFields);
  });

  it('uses matching cached resume data and removes stale cache after loading', async () => {
    const cachedResume = JSON.stringify({
      resumeId: 'builder-1',
      data: {
        ...builderResume,
        personalInfo: {
          ...builderResume.personalInfo,
          fullname: 'Cached Avery',
        },
      },
    });
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) =>
      key === 'cached_resume_data' ? cachedResume : null
    );

    renderProvider({ resumeId: 'builder-1' });

    expect(await screen.findByText('Name: Cached Avery')).toBeInTheDocument();
    expect(mockGetResumeById).not.toHaveBeenCalled();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('cached_resume_data');
  });

  it('discards stale cached resume data and fetches the requested resume', async () => {
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) =>
      key === 'cached_resume_data'
        ? JSON.stringify({
            resumeId: 'different-resume',
            data: {
              ...builderResume,
              personalInfo: {
                ...builderResume.personalInfo,
                fullname: 'Wrong Cached Resume',
              },
            },
          })
        : null
    );

    renderProvider({ resumeId: 'builder-1' });

    expect(await screen.findByText('Name: Avery Builder')).toBeInTheDocument();
    expect(mockGetResumeById).toHaveBeenCalledWith('builder-1');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('cached_resume_data');
  });

  it('loads enhanced resume data, derives ATS suggestions, and applies an auto fix', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });

    expect(await screen.findByText('Name: Enhanced Avery')).toBeInTheDocument();
    expect(screen.getByText('Suggestions: suggestion-1')).toBeInTheDocument();
    expect(latestContext.resumeSource).toBe('enhanced');
    expect(latestContext.enhancedAtsScore).toMatchObject({ final_score: 76 });

    await act(async () => {
      await latestContext.applyAutoFix('suggestion-1');
    });

    expect(mockApplyFix).toHaveBeenCalledWith({
      enhancer_state: 'enhanced-1',
      suggestion_id: 'suggestion-1',
      fix_type: 'auto',
    });
    expect(screen.getByText('Name: Auto Fixed Avery')).toBeInTheDocument();
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
    );
    await waitFor(() => expect(
      JSON.parse(window.localStorage.getItem('careerbot:enhanced-fixed-suggestions:enhanced-1') ?? '[]'),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'suggestion-1', status: 'fixed' })])));
  });

  it('loads Summary manual action items after rescanning the same enhanced resume', async () => {
    mockGetEnhancedResume.mockResolvedValueOnce({
      ...enhancedResume,
      suggestions: [
        { id: 'summary-auto', section: 'Summary', message: 'Add measurable results.', fix_type: 'auto' },
      ],
      enhancer_state: {
        ...enhancedResume.enhancer_state,
        ats_display: {
          score: 76,
          sections: [{ name: 'Summary', score_pct: 45, weighted_pts: 2, max_pts: 5, deductions: [] }],
          action_items: {
            Summary: [
              { id: 'summary-manual-1', after_example: 'Name a target role.', fix_type: 'manual' },
              { id: 'summary-manual-2', after_example: 'Add domain keywords.', fix_type: 'manual' },
            ],
          },
        },
      },
    } as never);

    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });

    await screen.findByText('Name: Enhanced Avery');
    expect(latestContext.enhancedSuggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'summary-auto', section: 'Summary', status: 'pending' }),
      expect.objectContaining({ id: 'summary-manual-1', section: 'Summary', status: 'pending', fix_type: 'manual' }),
      expect.objectContaining({ id: 'summary-manual-2', section: 'Summary', status: 'pending', fix_type: 'manual' }),
    ]));
  });
  it('keeps pending manual suggestions after a partial auto-fix response', async () => {
    mockGetEnhancedResume.mockResolvedValueOnce({
      ...enhancedResume,
      suggestions: [
        { id: 'summary-auto', section: 'Summary', message: 'Add measurable results.', fix_type: 'auto' },
        { id: 'summary-manual-1', section: 'Summary', message: 'Name a target role.', fix_type: 'manual' },
        { id: 'summary-manual-2', section: 'Summary', message: 'Add domain keywords.', fix_type: 'manual' },
      ],
    } as never);
    mockApplyFix.mockResolvedValueOnce({
      success: true,
      suggestions: [],
      applied_fixes: [{ suggestion_id: 'summary-auto', status: 'applied', undo_available: true }],
      operation: { type: 'apply_fix', suggestion_id: 'summary-auto' },
    } as never);

    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Suggestions: summary-auto,summary-manual-1,summary-manual-2');

    await act(async () => {
      await latestContext.applyAutoFix('summary-auto');
    });

    expect(latestContext.enhancedSuggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'summary-auto', status: 'fixed' }),
      expect.objectContaining({ id: 'summary-manual-1', status: 'pending' }),
      expect.objectContaining({ id: 'summary-manual-2', status: 'pending' }),
    ]));
  });
  // P2 regression: a full, authoritative snapshot (a fresh GET / rescan, not
  // a partial apply_fix response) must drop a pending card the server no
  // longer lists -- otherwise a resolved suggestion stays pending forever,
  // including across reloads (pending cards round-trip through localStorage).
  it('drops a pending suggestion the server no longer lists on a full snapshot (rescan)', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    // Seed a pending suggestion directly (independent of the deduction-
    // derivation path exercised by the initial load) so this test's
    // premise doesn't depend on that separate, already-covered behavior.
    await act(async () => {
      latestContext.syncEnhancedScore({
        suggestions: [{ id: 'suggestion-1', section: 'Summary', message: 'Add measurable results.', fix_type: 'manual' }],
        ats_score: { final_score: 76, section_breakdown: {} },
      });
    });
    await waitFor(() => expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    ));

    await act(async () => {
      latestContext.syncEnhancedScore(
        { suggestions: [], ats_score: { final_score: 90, section_breakdown: {} } },
        { isFullSnapshot: true },
      );
    });

    await waitFor(() => expect(latestContext.enhancedSuggestions).not.toContainEqual(
      expect.objectContaining({ id: 'suggestion-1' }),
    ));
  });

  // P2 regression: syncEnhancedResumeData used to spread every mapped
  // section from the server over local resumeData unconditionally
  // ({...previous, ...mapped}). autosave only sends items that already have
  // a backend id (a brand-new, not-yet-saved entry is id-less and
  // deliberately excluded), so a response for an UNRELATED mutation (e.g.
  // deleting a Certification) silently wiped out a project the user just
  // added in a different, still-open section.
  it('preserves a local id-less entry in an unrelated section when an unrelated mutation syncs', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    // Simulate the user having just added a brand-new, not-yet-saved
    // project (no id assigned yet -- that only happens server-side).
    await act(async () => {
      latestContext.setResumeData((previous) => ({
        ...previous,
        projects: [
          ...(previous.projects ?? []),
          { title: 'Unsaved Side Project', description: '', technologies: [], startDate: '', endDate: '', link: '' },
        ],
      }));
    });
    expect(latestContext.resumeData.projects).toEqual([
      expect.objectContaining({ title: 'Unsaved Side Project' }),
    ]);

    // An unrelated mutation (e.g. a Certification delete) broadcasts its own
    // snapshot, whose mapped `projects` is the server's (empty) array --
    // it knows nothing about the just-added, unsaved project.
    await act(async () => {
      window.dispatchEvent(new CustomEvent('enhanced-resume-score-sync', {
        detail: {
          enhancedId: 'enhanced-1',
          payload: {
            enhanced_data: enhancedResume.enhanced_data,
            ats_score: { final_score: 80, section_breakdown: {} },
          },
        },
      }));
    });

    await waitFor(() => expect(latestContext.resumeData.projects).toEqual([
      expect.objectContaining({ title: 'Unsaved Side Project' }),
    ]));
  });

  it('keeps a pending suggestion missing from a PARTIAL (non-full) snapshot', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      latestContext.syncEnhancedScore({
        suggestions: [{ id: 'suggestion-1', section: 'Summary', message: 'Add measurable results.', fix_type: 'manual' }],
        ats_score: { final_score: 76, section_breakdown: {} },
      });
    });
    await waitFor(() => expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    ));

    await act(async () => {
      // No isFullSnapshot -- an ordinary apply/delete-fix-style response.
      latestContext.syncEnhancedScore({
        suggestions: [],
        ats_score: { final_score: 90, section_breakdown: {} },
      });
    });

    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    );
  });

  it('keeps the score and every pending card when the server rejects an auto fix', async () => {
    mockApplyFix.mockResolvedValueOnce({
      success: true,
      was_applied: false,
      correction_applied: 'Cannot apply this auto fix.',
      enhancer_state: {
        resume: enhancedResume.enhanced_data,
        suggestions: [],
      },
    } as never);

    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');
    const scoreBefore = latestContext.enhancedAtsScore;
    const suggestionsBefore = latestContext.enhancedSuggestions;

    await expect(latestContext.applyAutoFix('suggestion-1')).rejects.toThrow('Cannot apply this auto fix.');

    expect(latestContext.enhancedAtsScore).toEqual(scoreBefore);
    expect(latestContext.enhancedSuggestions).toEqual(suggestionsBefore);
  });

  it('uses the exact manual value and consumes the canonical apply snapshot', async () => {
    mockApplyFix.mockResolvedValueOnce({
      ...fixedEducationSnapshot,
      enhancer_state: {
        resume: {
          personalInfo: { fullname: 'Manual Fixed Avery', email: 'fixed@example.com' },
          professionalSummary: { summary: 'Updated quantified summary', targetRole: 'Frontend Lead' },
        },
      },
      applied_fixes: [{ suggestion_id: 'suggestion-1', status: 'applied', undo_available: true }],
    } as never);
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      await latestContext.applyManualFix('suggestion-1', 'Updated quantified summary');
    });

    expect(mockApplyFix).toHaveBeenCalledWith({
      enhancer_state: 'enhanced-1',
      suggestion_id: 'suggestion-1',
      fix_type: 'manual',
      value: 'Updated quantified summary',
    });
    expect(latestContext.enhancedAtsScore).toMatchObject({ final_score: 64 });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed', undoAvailable: true }),
    );
  });

  it('keeps a confirmed card fixed when a later rescan returns a stale pending copy', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      await latestContext.applyAutoFix('suggestion-1');
    });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
    );

    await act(async () => {
      latestContext.syncEnhancedScore({
        ats_score: { final_score: 80, section_breakdown: enhancedResume.ats_score.section_breakdown },
        suggestions: [
          { id: 'suggestion-1', section: 'Summary', message: 'Use a stronger quantified summary.', fix_type: 'manual' },
        ],
      });
    });

    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
    );
  });
  it('does not reopen earlier fixed sections when another fix returns a stale pending list', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      await latestContext.applyAutoFix('suggestion-1');
    });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
    );

    mockApplyFix.mockResolvedValueOnce({
      success: true,
      enhanced_data: enhancedResume.enhanced_data,
      ats_score: { final_score: 80, section_breakdown: {} },
      // The Contact response is stale for Summary/Skills. It may confirm the
      // new fix, but it must not behave like an Undo for another section.
      suggestions: [
        { id: 'suggestion-1', section: 'Skills', message: 'Use HTML in experience.', fix_type: 'manual' },
        { id: 'contact-1', section: 'Contact', message: 'Add a GitHub profile.', fix_type: 'manual' },
      ],
      applied_fixes: [{ suggestion_id: 'contact-1', status: 'applied', undo_available: true }],
      operation: { type: 'apply_fix', suggestion_id: 'contact-1' },
    } as never);

    await act(async () => {
      await latestContext.applyManualFix('contact-1', 'https://github.com/avery');
    });

    expect(latestContext.enhancedSuggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
      expect.objectContaining({ id: 'contact-1', status: 'fixed' }),
    ]));
  });
  it('does not optimistically fix a manual card when the server rejects it', async () => {
    mockApplyFix.mockResolvedValueOnce({
      success: true,
      was_applied: false,
      correction_applied: 'Manual writeback is unsupported.',
      enhancer_state: { resume: enhancedResume.enhanced_data, suggestions: [] },
    } as never);
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');
    const scoreBefore = latestContext.enhancedAtsScore;

    await expect(latestContext.applyManualFix('suggestion-1', 'new text'))
      .rejects.toThrow('Manual writeback is unsupported.');

    expect(latestContext.enhancedAtsScore).toEqual(scoreBefore);
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    );
  });
  it('accepts a legacy successful Undo response and restores the pending card and score', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      await latestContext.undoFix('suggestion-1');
    });

    expect(mockDeleteFix).toHaveBeenCalledWith({
      enhancer_state: 'enhanced-1',
      suggestion_id: 'suggestion-1',
    });
    expect(latestContext.enhancedAtsScore).toMatchObject({ final_score: 71 });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    );
  });

  it('uses the canonical applied-fix ledger for card state, then restores pending on undo snapshot', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      window.dispatchEvent(new CustomEvent('enhanced-resume-score-sync', {
        detail: {
          enhancedId: 'enhanced-1',
          payload: {
            enhanced_data: enhancedResume.enhanced_data,
            ats_score: { final_score: 80, section_breakdown: {} },
            suggestions: [],
            applied_fixes: [{
              suggestion_id: 'suggestion-1',
              status: 'applied',
              undo_available: false,
            }],
          },
        },
      }));
    });

    await waitFor(() => expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed', undoAvailable: false }),
    ));

    await act(async () => {
      window.dispatchEvent(new CustomEvent('enhanced-resume-score-sync', {
        detail: {
          enhancedId: 'enhanced-1',
          payload: {
            enhanced_data: enhancedResume.enhanced_data,
            ats_score: enhancedResume.ats_score,
            suggestions: [{
              id: 'suggestion-1',
              section: 'summary',
              message: 'Use a stronger quantified summary.',
              fix_type: 'manual',
            }],
            applied_fixes: [],
          },
        },
      }));
    });

    await waitFor(() => expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'pending' }),
    ));
  });

  // P1 regression: autosave's own enhanced-resume-score-sync broadcast used
  // to replace resumeData unconditionally. resumeData is a dependency of the
  // editor's autosave-triggering effect (EditorTab.tsx), so that replacement
  // re-armed another autosave the instant the previous one landed -- forever,
  // for as long as a section modal stayed open -- and each round overwrote
  // anything typed in the meantime with the pre-edit server snapshot. Fixed
  // by tagging the autosave broadcast {origin:"autosave"} (enhancerApi.ts)
  // and skipping syncEnhancedResumeData for it here, while still syncing the
  // score/suggestions (a separate state slice the autosave effect doesn't
  // depend on, so this doesn't reintroduce the loop).
  it('does not replace resumeData for an autosave-origin sync, but still syncs the score', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      window.dispatchEvent(new CustomEvent('enhanced-resume-score-sync', {
        detail: {
          enhancedId: 'enhanced-1',
          origin: 'autosave',
          payload: {
            enhanced_data: {
              ...enhancedResume.enhanced_data,
              personalInfo: {
                ...enhancedResume.enhanced_data.personalInfo,
                fullname: 'AUTOSAVE MUST NOT OVERWRITE LOCAL EDITS',
              },
            },
            ats_score: { final_score: 99, section_breakdown: {} },
          },
        },
      }));
    });

    // Score still syncs from an autosave response.
    await waitFor(() => expect(latestContext.enhancedAtsScore).toMatchObject({ final_score: 99 }));
    // resumeData does not: the autosave-origin payload's name never appears.
    expect(screen.queryByText('Name: AUTOSAVE MUST NOT OVERWRITE LOCAL EDITS')).not.toBeInTheDocument();
    expect(screen.getByText('Name: Enhanced Avery')).toBeInTheDocument();
  });

  it('still replaces resumeData for a non-autosave sync event (regression guard)', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      window.dispatchEvent(new CustomEvent('enhanced-resume-score-sync', {
        detail: {
          enhancedId: 'enhanced-1',
          payload: {
            enhanced_data: {
              ...enhancedResume.enhanced_data,
              personalInfo: {
                ...enhancedResume.enhanced_data.personalInfo,
                fullname: 'Explicit Save Updated Name',
              },
            },
            ats_score: { final_score: 82, section_breakdown: {} },
          },
        },
      }));
    });

    await waitFor(() => expect(screen.getByText('Name: Explicit Save Updated Name')).toBeInTheDocument());
  });

  it('clears a locally cached fixed card when the canonical undo ledger is empty', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      await latestContext.applyAutoFix('suggestion-1');
    });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({ id: 'suggestion-1', status: 'fixed' }),
    );

    await act(async () => {
      latestContext.syncEnhancedScore({
        ats_score: { final_score: 71, section_breakdown: {} },
        suggestions: [],
        applied_fixes: [],
        operation: { type: 'delete_fix', suggestion_id: 'suggestion-1' },
        deleted_suggestion_id: 'suggestion-1',
      });
    });

    expect(latestContext.enhancedSuggestions).not.toContainEqual(
      expect.objectContaining({ id: 'suggestion-1' }),
    );
  });
  it('loads the headline and section bars from the same fresh ATS display snapshot', async () => {
    mockGetEnhancedResume.mockResolvedValue({
      ...enhancedResume,
      ats_score: {
        final_score: 76,
        section_breakdown: {
          Certifications: { percentage: 0, weight: 5 },
        },
      },
      enhancer_state: {
        ats_display: {
          score: 83,
          sections: [{
            name: 'Certifications',
            score_pct: 100,
            weighted_pts: 5,
            max_pts: 5,
            deductions: [],
          }],
        },
      },
    } as never);

    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });

    await screen.findByText('Name: Enhanced Avery');
    expect(latestContext.enhancedAtsScore).toMatchObject({
      final_score: 83,
      section_breakdown: {
        Certifications: { percentage: 100, weight: 5 },
      },
    });
  });

  it('keeps a resolved Summary card visible as fixed after a section-save snapshot', async () => {
    renderProvider({ resumeId: 'enhanced-1', source: 'enhanced' });
    await screen.findByText('Name: Enhanced Avery');

    await act(async () => {
      latestContext.syncEnhancedScore({
        ats_score: {
          final_score: 83,
          section_breakdown: {
            Summary: {
              percentage: 100,
              weight: 8,
              weighted_contribution: 8,
              deductions: [],
            },
          },
        },
        // A normal section save can return the current pending list with the
        // resolved Summary suggestion absent. The UI must not drop its card.
        suggestions: [],
      }, { resolvedSuggestionSections: ['ProfessionalSummary'] });
    });

    expect(latestContext.enhancedAtsScore).toMatchObject({
      final_score: 83,
      section_breakdown: { Summary: { percentage: 100 } },
    });
    expect(latestContext.enhancedSuggestions).toContainEqual(
      expect.objectContaining({
        id: 'suggestion-1',
        status: 'fixed',
        undoAvailable: false,
      }),
    );
  });

  it('supports custom section and field mutations plus completion percentage updates', async () => {
    renderProvider();
    await screen.findByText('Loading: false');

    const customSection: CustomSection = {
      id: 'custom-2',
      sectionName: 'Patents',
      fields: [],
    };

    await act(async () => {
      latestContext.addCustomSection(customSection);
    });
    expect(screen.getByText('Custom sections: Patents')).toBeInTheDocument();

    await act(async () => {
      latestContext.addCustomField('custom-2', 'Patent title', 'text');
    });
    expect(latestContext.resumeData.customSections?.[0].fields[0]).toMatchObject({
      fieldName: 'Patent title',
      fieldType: 'text',
      value: '',
    });

    const fieldId = latestContext.resumeData.customSections?.[0].fields[0].id as string;
    await act(async () => {
      latestContext.updateCustomFieldValue('custom-2', fieldId, 'Search ranking patent');
      latestContext.setCompletionStatus({ 'Personal Info': true, Skills: true });
    });
    expect(latestContext.resumeData.customSections?.[0].fields[0].value).toBe('Search ranking patent');
    expect(screen.getByText('Completion: 100')).toBeInTheDocument();

    await act(async () => {
      latestContext.deleteCustomField('custom-2', fieldId);
      latestContext.removeCustomSection('custom-2');
    });
    expect(screen.getByText('Custom sections: none')).toBeInTheDocument();
  });

  it('persists selected template changes and creates a resume through the context API', async () => {
    renderProvider();
    await screen.findByText('Loading: false');

    await act(async () => {
      await latestContext.setSelectedTemplate('clean_simple');
      await latestContext.createResume();
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('selected_template', 'clean_simple');
    expect(mockHttpPost).toHaveBeenCalledWith('/resumes/', latestContext.resumeData);
  });

  it('shows a toast and exits loading when loading an existing resume fails', async () => {
    mockGetResumeById.mockRejectedValue(new Error('Backend failed'));

    renderProvider({ resumeId: 'broken-resume' });

    expect(await screen.findByText('Loading: false')).toBeInTheDocument();
    expect(mockToast.error).toHaveBeenCalledWith('Failed to load resume data');
  });
});

/**
 * PHASE 1b — the frontend half of the custom_skills migration.
 *
 * The backend is moving categorized skills from a flat shape to a nested one:
 *
 *     { databases: [...], tools: [...] }
 *  -> { customSkills: { databases: [...], tools: [...] } }
 *
 * mapBackendSkillsToCategorized already routes any non-PREDEFINED key into
 * `custom_categories`, and all five templates render those. The break is the
 * `!Array.isArray(items)` guard: a nested OBJECT fails it and the whole bucket
 * is silently skipped, so those skills vanish from the builder and from every
 * template with no error.
 */
describe('mapBackendSkillsToCategorized — nested customSkills bucket', () => {
  const FLAT = {
    programmingLanguages: [{ id: 'p1', name: 'TypeScript' }],
    databases: [{ id: 'd1', name: 'PostgreSQL' }],
    tools: [{ id: 't1', name: 'Git' }],
  };
  const NESTED = {
    programmingLanguages: [{ id: 'p1', name: 'TypeScript' }],
    customSkills: {
      databases: [{ id: 'd1', name: 'PostgreSQL' }],
      tools: [{ id: 't1', name: 'Git' }],
    },
  };

  const customNames = (r: ReturnType<typeof mapBackendSkillsToCategorized>) =>
    (r.custom_categories || []).flatMap(c => c.skills);

  it('surfaces nested skills exactly as the flat shape does', () => {
    const flat = mapBackendSkillsToCategorized(FLAT);
    const nested = mapBackendSkillsToCategorized(NESTED);

    expect(customNames(nested).sort()).toEqual(['Git', 'PostgreSQL']);
    expect(customNames(nested).sort()).toEqual(customNames(flat).sort());
    expect(nested.programming_languages).toEqual(['TypeScript']);
  });

  it('keeps the skill_id_map populated for nested skills', () => {
    // Without the id map, Skills.tsx cannot resolve a delete call.
    const nested = mapBackendSkillsToCategorized(NESTED);

    expect(nested.skill_id_map?.['databases:PostgreSQL']).toBe('d1');
    expect(nested.skill_id_map?.['Databases:PostgreSQL']).toBe('d1');
  });

  it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'])(
    'survives a user-named category that collides with Object.prototype (%s)',
    (key) => {
      // Category names are user-supplied. With a `{}` accumulator, expanded[key]
      // resolves to the INHERITED prototype member, the `existing ?` test is
      // truthy against a function, and .concat throws -- crashing the whole
      // resume load, not just that one category.
      const out = expandNestedSkillBuckets({ customSkills: { [key]: [{ id: '1', name: 'X' }] } });

      expect(out[key]).toEqual([{ id: '1', name: 'X' }]);
    },
  );

  it('is a no-op on the flat shape', () => {
    expect(expandNestedSkillBuckets(FLAT)).toEqual(FLAT);
  });

  it('never mutates the caller payload', () => {
    const original = [{ id: 'd1', name: 'PostgreSQL' }];
    const payload = { databases: original, customSkills: { databases: [{ id: 'd2', name: 'MySQL' }] } };

    expandNestedSkillBuckets(payload);

    expect(original).toHaveLength(1);
  });

  it('merges a nested sub-category colliding with a flat one, in both key orders', () => {
    const nestedFirst = expandNestedSkillBuckets({
      customSkills: { databases: [{ id: 'd2', name: 'MySQL' }] },
      databases: [{ id: 'd1', name: 'PostgreSQL' }],
    });
    const flatFirst = expandNestedSkillBuckets({
      databases: [{ id: 'd1', name: 'PostgreSQL' }],
      customSkills: { databases: [{ id: 'd2', name: 'MySQL' }] },
    });

    for (const out of [nestedFirst, flatFirst]) {
      expect(out.databases.map(d => d.name).sort()).toEqual(['MySQL', 'PostgreSQL']);
    }
  });
});
