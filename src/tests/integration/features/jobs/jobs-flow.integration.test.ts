import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, resetMSWServer, useHandler } from '../../shared/msw-server';
import { mockResponses, mockErrors } from '../../shared/api-mocks';

/**
 * Integration Test: Jobs Feature Complete Flow
 *
 * Tests the full jobs workflow:
 * 1. Search / list jobs
 * 2. Get job detail
 * 3. SmartMatch - matched jobs for user resume
 * 4. Apply to a job
 * 5. Job chat (Ask Nancy)
 * 6. Analytics
 * 7. CRUD (create, update, delete)
 * 8. Error scenarios (unauthorized, 404, server error, insufficient credits)
 *
 * Run: npm run test:integration:jobs
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => resetMSWServer());
afterAll(() => server.close());

describe('Jobs Integration Flow', () => {

  // ─── Search / List Jobs ───────────────────────────────────────────────────

  it('searches jobs and returns paginated results', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/all?skip=0&limit=20`);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThan(0);
  });

  it('returns correct job fields in list response', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/all?skip=0&limit=20`);
    const data = await res.json();
    const job = data.data[0];

    expect(job.id).toBe('job-001');
    expect(job.title).toBe('Senior Frontend Developer');
    expect(job.company).toBe('TechCorp');
    expect(job.location).toBe('Bangalore, India');
    expect(job.job_type).toBe('Full-time');
  });

  it('searches jobs with text query filter', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/all`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('q');
        const filtered = mockResponses.jobs.jobList.data.filter(
          (j) => q && j.title.toLowerCase().includes(q.toLowerCase())
        );
        return HttpResponse.json({
          ...mockResponses.jobs.jobList,
          data: filtered,
          pagination: { ...mockResponses.jobs.jobList.pagination, total: filtered.length },
        });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/all?q=Frontend&skip=0&limit=20`);
    const data = await res.json();

    expect(data.data.length).toBe(1);
    expect(data.data[0].title).toContain('Frontend');
  });

  it('returns empty list when no jobs match the query', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/all`, () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { total: 0, skip: 0, limit: 20, page: 1, total_pages: 0, has_next: false, has_prev: false },
        });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/all?q=nonexistentjob`);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
  });

  it('returns minimal job list from /jobs/list', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/list?skip=0&limit=10`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    const job = data.data[0];
    expect(job.id).toBeDefined();
    expect(job.title).toBeDefined();
    expect(job.company).toBeDefined();
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  it('paginates results correctly', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/all`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        return HttpResponse.json({
          success: true,
          data: mockResponses.jobs.jobList.data.slice(skip, skip + limit),
          pagination: {
            total: 2,
            skip,
            limit,
            page: Math.floor(skip / limit) + 1,
            total_pages: Math.ceil(2 / limit),
            has_next: skip + limit < 2,
            has_prev: skip > 0,
          },
        });
      })
    );

    const page1 = await (await fetch(`${API_BASE}/v1/jobs/all?skip=0&limit=1`)).json();
    expect(page1.data).toHaveLength(1);
    expect(page1.pagination.has_next).toBe(true);

    const page2 = await (await fetch(`${API_BASE}/v1/jobs/all?skip=1&limit=1`)).json();
    expect(page2.data).toHaveLength(1);
    expect(page2.pagination.has_prev).toBe(true);
    expect(page2.pagination.has_next).toBe(false);
  });

  // ─── Job Detail ───────────────────────────────────────────────────────────

  it('fetches a single job by id', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/job-001`);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe('job-001');
    expect(data.data.title).toBe('Senior Frontend Developer');
    expect(data.data.description).toBeDefined();
    expect(Array.isArray(data.data.skills_required)).toBe(true);
  });

  it('returns 404 when job does not exist', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/:jobId`, () => {
        return HttpResponse.json(mockErrors.notFound, { status: 404 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/nonexistent-id`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe('Not found');
  });

  // ─── SmartMatch ───────────────────────────────────────────────────────────

  it('returns smart matched jobs with scores and breakdown', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/matched?limit=50`);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data.jobs)).toBe(true);
    expect(data.jobs.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
    expect(data.scorer_version).toBeDefined();
  });

  it('matched job has required match fields', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/matched?limit=50`);
    const data = await res.json();
    const match = data.jobs[0].match;

    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBeLessThanOrEqual(100);
    expect(['strong', 'good', 'partial', 'low']).toContain(match.band);
    expect(Array.isArray(match.matched_skills)).toBe(true);
    expect(Array.isArray(match.missing_skills)).toBe(true);
    expect(match.breakdown).toBeDefined();
  });

  it('returns 404 when user has no resume for smart match', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/matched`, () => {
        return HttpResponse.json(
          { message: 'No resume found for user' },
          { status: 404 }
        );
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/matched`);
    expect(res.status).toBe(404);
  });

  it('smart match returns cache_hit flag', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/matched`, () => {
        return HttpResponse.json({ ...mockResponses.jobs.smartMatch, cache_hit: true });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/matched`);
    const data = await res.json();
    expect(data.cache_hit).toBe(true);
  });

  // ─── Apply to Job ─────────────────────────────────────────────────────────

  it('applies to a job and returns application record', async () => {
    const payload = {
      cover_letter: 'I am excited about this role...',
      phone_number: '+91-9876543210',
      experience_years: '4',
      notice_period: '30 days',
    };

    const res = await fetch(`${API_BASE}/v1/jobs/job-001/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.id).toBe('app-001');
    expect(data.job_id).toBe('job-001');
    expect(data.status).toBe('new');
    expect(data.applied_at).toBeDefined();
  });

  it('handles insufficient credits when applying to a job', async () => {
    useHandler(
      http.post(`${API_BASE}/v1/jobs/:jobId/apply`, () => {
        return HttpResponse.json(mockErrors.insufficientCredits, { status: 402 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/job-001/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.message).toBe('Insufficient credits');
  });

  // ─── Get Applications ─────────────────────────────────────────────────────

  it('retrieves applications for a job', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/job-001/applications?skip=0&limit=50`);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.job_id).toBe('job-001');
    expect(data.total).toBeGreaterThan(0);
    expect(Array.isArray(data.applications)).toBe(true);
    expect(data.applications[0].status).toBe('new');
  });

  // ─── Job Chat (Ask Nancy) ─────────────────────────────────────────────────

  it('sends a chat message about a job and receives a response', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/job-001/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What experience is required for this job?' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.response).toBeDefined();
    expect(data.session_id).toBeDefined();
    expect(data.intent_type).toBe('free');
  });

  it('maintains session across multiple chat messages', async () => {
    useHandler(
      http.post(`${API_BASE}/v1/jobs/:jobId/chat`, async ({ request }) => {
        const body = await request.json() as { message: string; session_id?: string };
        return HttpResponse.json({
          ...mockResponses.jobs.chatResponse,
          session_id: body.session_id || 'new-session-001',
        });
      })
    );

    const first = await (
      await fetch(`${API_BASE}/v1/jobs/job-001/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Tell me about this role' }),
      })
    ).json();

    const second = await (
      await fetch(`${API_BASE}/v1/jobs/job-001/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What skills do I need?', session_id: first.session_id }),
      })
    ).json();

    expect(second.session_id).toBe(first.session_id);
  });

  // ─── Analytics ────────────────────────────────────────────────────────────

  it('fetches job analytics with stats', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/analytics/stats`);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.total_jobs).toBeGreaterThan(0);
    expect(data.data.jobs_by_type).toBeDefined();
    expect(Array.isArray(data.data.top_skills)).toBe(true);
  });

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  it('creates a new job posting', async () => {
    const newJob = {
      title: 'React Developer',
      company: 'NewCo',
      location: 'Pune, India',
      job_type: 'Full-time',
    };

    const res = await fetch(`${API_BASE}/v1/jobs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
  });

  it('updates an existing job', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/job-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salary: '₹25-35 LPA' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('deletes a job by id', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/job-001`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('job-001');
  });

  // ─── Health & Cache ───────────────────────────────────────────────────────

  it('returns healthy status from health check', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('ok');
  });

  it('clears job cache successfully', async () => {
    const res = await fetch(`${API_BASE}/v1/jobs/cache/clear`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Cache cleared');
  });

  // ─── Auth Errors ──────────────────────────────────────────────────────────

  it('returns 401 when accessing jobs without authentication', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/all`, () => {
        return HttpResponse.json(mockErrors.unauthorized, { status: 401 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/all`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe('Unauthorized');
  });

  it('returns 500 on internal server error', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/jobs/all`, () => {
        return HttpResponse.json(mockErrors.serverError, { status: 500 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/jobs/all`);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toBe('Internal server error');
  });
});
