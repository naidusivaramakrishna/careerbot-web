import { http, HttpResponse } from 'msw';
import { mockResponses, mockErrors } from './api-mocks';

/**
 * MSW (Mock Service Worker) Handlers for Integration Testing
 *
 * These handlers intercept HTTP requests and return mock responses.
 * They work across all tests without needing vi.mock() for each API.
 *
 * Benefits:
 * - Realistic HTTP simulation
 * - Can simulate network delays/errors
 * - Automatic request validation
 * - Works across multiple test suites
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const handlers = [
  // ==================== Dashboard API ====================
  http.get(`${API_BASE}/dashboard/summary`, () => {
    return HttpResponse.json(mockResponses.dashboard.success);
  }),

  // ==================== Credits API ====================
  http.get(`${API_BASE}/credits/balance`, () => {
    return HttpResponse.json(mockResponses.credits.balance);
  }),

  http.post(`${API_BASE}/credits/check`, () => {
    return HttpResponse.json(mockResponses.credits.checkResult);
  }),

  http.get(`${API_BASE}/credits/usage`, () => {
    return HttpResponse.json({
      total: 10,
      items: [
        {
          id: 'usage-1',
          feature: 'communication_test',
          feature_label: 'Communication Test',
          credits_used: 10,
          timestamp: new Date().toISOString(),
          status: 'success',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    });
  }),

  // ==================== Resume API ====================
  http.post(`${API_BASE}/resume/create`, () => {
    return HttpResponse.json(mockResponses.resume.created);
  }),

  http.put(`${API_BASE}/resume/:resumeId`, () => {
    return HttpResponse.json(mockResponses.resume.created);
  }),

  http.get(`${API_BASE}/resume/:resumeId`, () => {
    return HttpResponse.json(mockResponses.resume.created);
  }),

  http.post(`${API_BASE}/resume/:resumeId/enhance`, () => {
    return HttpResponse.json(mockResponses.resume.enhanced);
  }),

  // ==================== Communication API ====================
  http.post(`${API_BASE}/communication/generate-test`, () => {
    return HttpResponse.json(mockResponses.communication.testGenerated);
  }),

  http.post(`${API_BASE}/communication/submit-response`, () => {
    return HttpResponse.json({
      test_id: 'test-123',
      response_saved: true,
    });
  }),

  http.get(`${API_BASE}/communication/:testId/score`, () => {
    return HttpResponse.json(mockResponses.communication.scoreResult);
  }),

  // ==================== Mock Interview API ====================
  http.post(`${API_BASE}/mock-interview/generate-notes`, () => {
    return HttpResponse.json(mockResponses.mockInterview.notesGenerated);
  }),

  http.post(`${API_BASE}/mock-interview/start`, () => {
    return HttpResponse.json({
      session_id: 'session-123',
      stage: 'practice-round-1',
      question_count: 10,
    });
  }),

  http.post(`${API_BASE}/mock-interview/:sessionId/submit-answer`, () => {
    return HttpResponse.json({
      answer_recorded: true,
      feedback: 'Good response',
    });
  }),

  http.get(`${API_BASE}/mock-interview/:sessionId/report`, () => {
    return HttpResponse.json(mockResponses.mockInterview.interviewComplete);
  }),

  // ==================== Jobs API ====================
  http.get(`${API_BASE}/v1/jobs/all`, () => {
    return HttpResponse.json(mockResponses.jobs.jobList);
  }),

  http.get(`${API_BASE}/v1/jobs/list`, () => {
    return HttpResponse.json({
      success: true,
      data: mockResponses.jobs.jobList.data.map(({ id, title, company, location, job_type }) => ({
        id, title, company, location, job_type,
      })),
    });
  }),

  http.get(`${API_BASE}/v1/jobs/matched`, () => {
    return HttpResponse.json(mockResponses.jobs.smartMatch);
  }),

  http.get(`${API_BASE}/v1/jobs/analytics/stats`, () => {
    return HttpResponse.json(mockResponses.jobs.analytics);
  }),

  http.get(`${API_BASE}/v1/jobs/health`, () => {
    return HttpResponse.json({ success: true, data: { status: 'ok' } });
  }),

  http.get(`${API_BASE}/v1/jobs/:jobId`, () => {
    return HttpResponse.json(mockResponses.jobs.jobDetail);
  }),

  http.post(`${API_BASE}/v1/jobs/`, () => {
    return HttpResponse.json({ success: true, data: mockResponses.jobs.jobDetail.data });
  }),

  http.put(`${API_BASE}/v1/jobs/:jobId`, () => {
    return HttpResponse.json({ success: true, data: mockResponses.jobs.jobDetail.data });
  }),

  http.delete(`${API_BASE}/v1/jobs/:jobId`, () => {
    return HttpResponse.json({ success: true, data: { id: 'job-001' } });
  }),

  http.post(`${API_BASE}/v1/jobs/:jobId/apply`, () => {
    return HttpResponse.json(mockResponses.jobs.application);
  }),

  http.get(`${API_BASE}/v1/jobs/:jobId/applications`, () => {
    return HttpResponse.json({
      job_id: 'job-001',
      total: 1,
      applications: [mockResponses.jobs.application],
    });
  }),

  http.post(`${API_BASE}/v1/jobs/:jobId/chat`, () => {
    return HttpResponse.json(mockResponses.jobs.chatResponse);
  }),

  http.delete(`${API_BASE}/v1/jobs/cache/clear`, () => {
    return HttpResponse.json({ success: true, data: { message: 'Cache cleared' } });
  }),

  // ==================== ATS API ====================
  http.post(`${API_BASE}/v1/parser/parse_resume/`, () => {
    return HttpResponse.json(mockResponses.ats.parsed);
  }),

  http.post(`${API_BASE}/v1/resume/enhance`, () => {
    return HttpResponse.json(mockResponses.ats.enhanced);
  }),

  http.get(`${API_BASE}/v1/resumes/`, () => {
    return HttpResponse.json(mockResponses.ats.resumeList);
  }),

  http.get(`${API_BASE}/v1/resumes/:resumeId`, () => {
    return HttpResponse.json(mockResponses.ats.resumeDetail);
  }),

  http.delete(`${API_BASE}/v1/resumes/:resumeId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API_BASE}/v1/parser/clear-cache/:resumeId`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${API_BASE}/v1/parser/download/:resumeId`, () => {
    return new HttpResponse(new Blob(['pdf-content'], { type: 'application/pdf' }), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  }),

  // ==================== User API ====================
  http.get(`${API_BASE}/user/profile`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'user@example.com',
      name: 'John Doe',
    });
  }),

  http.put(`${API_BASE}/user/profile`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'user@example.com',
      name: 'John Doe Updated',
    });
  }),
];

/**
 * Advanced MSW utilities for test-specific behavior
 */
export const createCustomHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  response: any,
  delay = 0
) => {
  const fullPath = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const httpMethod = {
    get: http.get,
    post: http.post,
    put: http.put,
    delete: http.delete,
  }[method];

  return httpMethod(fullPath, async () => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return HttpResponse.json(response);
  });
};

/**
 * Error response handlers for testing error scenarios
 */
export const errorHandlers = {
  unauthorized: (endpoint: string) =>
    http.get(endpoint, () => {
      return HttpResponse.json(mockErrors.unauthorized, { status: 401 });
    }),

  notFound: (endpoint: string) =>
    http.get(endpoint, () => {
      return HttpResponse.json(mockErrors.notFound, { status: 404 });
    }),

  insufficientCredits: (endpoint: string) =>
    http.post(endpoint, () => {
      return HttpResponse.json(mockErrors.insufficientCredits, { status: 402 });
    }),

  serverError: (endpoint: string) =>
    http.get(endpoint, () => {
      return HttpResponse.json(mockErrors.serverError, { status: 500 });
    }),
};
