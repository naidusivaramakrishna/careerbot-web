import { vi } from 'vitest';

/**
 * Shared API mock utilities for integration tests
 * Provides consistent mock implementations across all integration tests
 */

export const createApiMocks = () => {
  const mockHttpClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  const mockDashboardApi = {
    getDashboardSummary: vi.fn(),
  };

  const mockCreditsApi = {
    getCreditsBalance: vi.fn(),
    checkCredits: vi.fn(),
    getCreditsUsage: vi.fn(),
  };

  const mockResumeApi = {
    createResume: vi.fn(),
    updateResume: vi.fn(),
    enhanceResume: vi.fn(),
    getResume: vi.fn(),
  };

  const mockCommunicationApi = {
    generateTest: vi.fn(),
    submitResponse: vi.fn(),
    getScore: vi.fn(),
  };

  const mockMockInterviewApi = {
    generateNotes: vi.fn(),
    startInterview: vi.fn(),
    submitAnswer: vi.fn(),
    getReport: vi.fn(),
  };

  const mockUserApi = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  };

  return {
    mockHttpClient,
    mockDashboardApi,
    mockCreditsApi,
    mockResumeApi,
    mockCommunicationApi,
    mockMockInterviewApi,
    mockUserApi,
  };
};

/**
 * Default mock responses for common scenarios
 */
export const mockResponses = {
  dashboard: {
    success: {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
      },
      plan: {
        credits_remaining: 100,
        credits_total: 500,
        plan_id: 'premium',
        plan_name: 'Premium Plan',
      },
      stats: {
        resumesCreated: 2,
        atsScansCompleted: 1,
        jobApplications: 5,
      },
      recentResumes: [
        {
          id: 'resume-1',
          title: 'Software Engineer Resume',
          lastModified: new Date().toISOString(),
          score: 85,
        },
      ],
    },
  },

  credits: {
    balance: {
      credits_remaining: 100,
      credits_total: 500,
      plan_id: 'premium',
      plan_name: 'Premium Plan',
    },
    checkResult: {
      can_proceed: true,
      credit_cost: 10,
      credits_remaining: 100,
      balance_after: 90,
      is_low_balance: false,
    },
  },

  resume: {
    created: {
      id: 'resume-123',
      title: 'My Resume',
      sections: {
        summary: 'Professional summary',
        experience: [],
        education: [],
      },
      score: 0,
    },
    enhanced: {
      id: 'resume-123',
      title: 'My Resume (Enhanced)',
      sections: {
        summary: 'Improved professional summary',
        experience: ['Improved bullet points'],
        education: [],
      },
      score: 85,
    },
  },

  communication: {
    testGenerated: {
      test_id: 'test-456',
      difficulty: 'medium',
      sections: ['listen-repeat', 'story-facts'],
    },
    scoreResult: {
      test_id: 'test-456',
      score: 78,
      feedback: 'Good pronunciation',
      reportUrl: '/communication/report/test-456',
    },
  },

  ats: {
    parsed: {
      resume_id: 'ats-resume-123',
      cache_hit: false,
      parsed_data: {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: [{ role: 'Software Engineer', company: 'TechCorp', years: 2 }],
        education: [{ degree: 'B.Tech', institution: 'MIT' }],
      },
    },
    enhanced: {
      resume_id: 'ats-resume-123',
      enhanced_resume: { name: 'John Doe', skills: ['JavaScript', 'React', 'Node.js'] },
      enhancer_state: {
        ats_breakdown: {
          FinalScore: 82,
          SectionBreakdown: {
            ContactInfo: { score: 90, max: 100 },
            Skills: { score: 85, max: 100 },
            Experience: { score: 80, max: 100 },
            Education: { score: 75, max: 100 },
            Keywords: { score: 78, max: 100 },
          },
        },
      },
      ats_display: {
        score: 82,
        grade: 'Good',
        sections: [],
      },
    },
    resumeList: [
      {
        id: 'ats-resume-123',
        personalInfo: { name: 'John Doe' },
        work_experience: [{ role: 'Software Engineer' }],
        builder_score: { score: 82 },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    resumeDetail: {
      id: 'ats-resume-123',
      personalInfo: { name: 'John Doe' },
      work_experience: [{ role: 'Software Engineer' }],
      builder_score: { score: 82 },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  },

  jobs: {
    jobList: {
      success: true,
      data: [
        {
          id: 'job-001',
          title: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'Bangalore, India',
          job_type: 'Full-time',
          work_mode: 'Hybrid',
          salary: '₹20-30 LPA',
          skills: 'React, TypeScript, Node.js',
          experience_level: '3-5 years',
          source: 'linkedin',
          is_applied: false,
          posted_date: new Date().toISOString(),
        },
        {
          id: 'job-002',
          title: 'Backend Engineer',
          company: 'StartupXYZ',
          location: 'Mumbai, India',
          job_type: 'Contract',
          work_mode: 'Remote',
          skills: 'Python, Django, PostgreSQL',
          experience_level: '2-4 years',
          source: 'naukri',
          is_applied: false,
          posted_date: new Date().toISOString(),
        },
      ],
      pagination: { total: 2, skip: 0, limit: 20, page: 1, total_pages: 1, has_next: false, has_prev: false },
    },
    jobDetail: {
      success: true,
      data: {
        id: 'job-001',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'Bangalore, India',
        job_type: 'Full-time',
        work_mode: 'Hybrid',
        description: 'We are looking for a Senior Frontend Developer...',
        skills_required: ['React', 'TypeScript', 'Node.js'],
        salary: '₹20-30 LPA',
        experience_level: '3-5 years',
        source: 'linkedin',
        is_applied: false,
      },
    },
    smartMatch: {
      jobs: [
        {
          job: {
            id: 'job-001',
            title: 'Senior Frontend Developer',
            company: 'TechCorp',
            location: 'Bangalore, India',
          },
          match: {
            job_id: 'job-001',
            score: 92,
            band: 'strong',
            breakdown: { skills: 95, title: 90, experience: 88, education: 85, location: 100 },
            matched_skills: ['React', 'TypeScript'],
            missing_skills: ['GraphQL'],
            scorer_version: 2,
            computed_at: new Date().toISOString(),
          },
        },
      ],
      total: 1,
      skip: 0,
      limit: 50,
      cache_hit: false,
      computed_in_ms: 120,
      scorer_version: 2,
      profile_version: 1,
    },
    application: {
      id: 'app-001',
      job_id: 'job-001',
      job_title: 'Senior Frontend Developer',
      company: 'TechCorp',
      candidate_id: 'user-123',
      status: 'new' as const,
      applied_at: new Date().toISOString(),
    },
    analytics: {
      success: true,
      data: {
        total_jobs: 150,
        jobs_by_type: { 'Full-time': 100, 'Contract': 30, 'Part-time': 20 },
        jobs_by_location: { 'Bangalore': 60, 'Mumbai': 50, 'Remote': 40 },
        top_skills: ['React', 'Python', 'Node.js', 'TypeScript'],
        total_applications: 25,
        success_rate: 0.4,
      },
    },
    chatResponse: {
      response: 'This job requires 3-5 years of experience with React.',
      intent: 'job_details',
      intent_type: 'free' as const,
      session_id: 'chat-session-001',
      suggested_action: null,
    },
  },

  mockInterview: {
    notesGenerated: {
      notes_id: 'notes-789',
      content: 'Interview notes from resume',
      sections: ['self-intro', 'projects', 'hr-questions'],
    },
    interviewComplete: {
      session_id: 'session-101',
      score: 8.5,
      questions_answered: 10,
      reportUrl: '/mock-interview/report/session-101',
    },
  },
};

/**
 * Common API error responses
 */
export const mockErrors = {
  unauthorized: {
    status: 401,
    message: 'Unauthorized',
  },
  notFound: {
    status: 404,
    message: 'Not found',
  },
  insufficientCredits: {
    status: 402,
    message: 'Insufficient credits',
  },
  serverError: {
    status: 500,
    message: 'Internal server error',
  },
};

/**
 * Helper to setup all API mocks at once
 */
export const setupAllApiMocks = () => {
  const mocks = createApiMocks();

  // Setup default successful responses
  mocks.mockDashboardApi.getDashboardSummary.mockResolvedValue(
    mockResponses.dashboard.success
  );
  mocks.mockCreditsApi.getCreditsBalance.mockResolvedValue(
    mockResponses.credits.balance
  );
  mocks.mockCreditsApi.checkCredits.mockResolvedValue(
    mockResponses.credits.checkResult
  );

  return mocks;
};
