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
import { getEnhancedResume, applyFix } from '@/api/enhancerApi';
import { httpClient } from '@/lib/http';
import { toast } from 'sonner';

vi.mock('@/api/resumeApi', () => ({
  getResumeById: vi.fn(),
  getDefaultTemplate: vi.fn(),
}));

vi.mock('@/api/enhancerApi', () => ({
  getEnhancedResume: vi.fn(),
  applyFix: vi.fn(),
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
