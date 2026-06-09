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
