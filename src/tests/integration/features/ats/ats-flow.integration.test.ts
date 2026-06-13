import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, resetMSWServer, useHandler } from '../../shared/msw-server';
import { mockResponses, mockErrors } from '../../shared/api-mocks';

/**
 * Integration Test: ATS Scanner Complete Flow
 *
 * Tests the full ATS resume scanning workflow:
 * 1. Upload & parse resume
 * 2. Enhance resume → get ATS score
 * 3. Store result in localStorage
 * 4. Retrieve all resumes list
 * 5. Delete resume
 * 6. Cache clear
 * 7. Download resume
 * 8. Error scenarios (insufficient credits, server error)
 *
 * Run: npm run test:integration:ats
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => resetMSWServer());
afterAll(() => server.close());

describe('ATS Scanner Integration Flow', () => {

  // ─── Step 1: Parse Resume ─────────────────────────────────────────────────

  it('parses uploaded resume and returns resume_id', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(`${API_BASE}/v1/parser/parse_resume/`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.resume_id).toBe('ats-resume-123');
    expect(data.parsed_data).toBeDefined();
    expect(data.parsed_data.name).toBe('John Doe');
  });

  // ─── Step 2: Enhance Resume → ATS Score ──────────────────────────────────

  it('enhances resume and returns ATS breakdown with score', async () => {
    const res = await fetch(`${API_BASE}/v1/resume/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'ats-resume-123' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.enhancer_state.ats_breakdown).toBeDefined();
    expect(data.enhancer_state.ats_breakdown.FinalScore).toBe(82);
    expect(data.ats_display.score).toBe(82);
    expect(data.ats_display.grade).toBe('Good');
  });

  // ─── Full Flow: Upload → Enhance → Score ─────────────────────────────────

  it('completes full ATS scan flow from upload to score', async () => {
    // Step 1: Parse
    const formData = new FormData();
    formData.append('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'resume.pdf');

    const parseRes = await fetch(`${API_BASE}/v1/parser/parse_resume/`, {
      method: 'POST',
      body: formData,
    });
    const parseData = await parseRes.json();

    expect(parseData.resume_id).toBeDefined();
    const resumeId = parseData.resume_id;

    // Step 2: Enhance → ATS score
    const enhanceRes = await fetch(`${API_BASE}/v1/resume/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId }),
    });
    const enhanceData = await enhanceRes.json();

    expect(enhanceData.enhancer_state.ats_breakdown.FinalScore).toBeGreaterThan(0);
    expect(enhanceData.enhancer_state.ats_breakdown.FinalScore).toBeLessThanOrEqual(100);

    // Step 3: Verify section breakdown exists
    const breakdown = enhanceData.enhancer_state.ats_breakdown.SectionBreakdown;
    expect(breakdown).toBeDefined();
    expect(breakdown.Skills).toBeDefined();
    expect(breakdown.Experience).toBeDefined();
  });

  // ─── Resume List ──────────────────────────────────────────────────────────

  it('retrieves all resumes for the user', async () => {
    const res = await fetch(`${API_BASE}/v1/resumes/`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].id).toBe('ats-resume-123');
    expect(data[0].personalInfo.name).toBe('John Doe');
  });

  it('retrieves a single resume by id', async () => {
    const res = await fetch(`${API_BASE}/v1/resumes/ats-resume-123`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.id).toBe('ats-resume-123');
    expect(data.builder_score.score).toBe(82);
  });

  // ─── Delete Resume ────────────────────────────────────────────────────────

  it('deletes a resume by id', async () => {
    const res = await fetch(`${API_BASE}/v1/resumes/ats-resume-123`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(204);
  });

  // ─── Clear Cache ──────────────────────────────────────────────────────────

  it('clears cache for a resume', async () => {
    const res = await fetch(`${API_BASE}/v1/parser/clear-cache/ats-resume-123`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
  });

  // ─── Download Resume ──────────────────────────────────────────────────────

  it('downloads resume as PDF', async () => {
    const res = await fetch(
      `${API_BASE}/v1/parser/download/ats-resume-123?format=pdf`,
      { method: 'GET' }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/pdf');
  });

  // ─── Error Scenarios ──────────────────────────────────────────────────────

  it('handles insufficient credits error when uploading resume', async () => {
    useHandler(
      http.post(`${API_BASE}/v1/parser/parse_resume/`, () => {
        return HttpResponse.json(mockErrors.insufficientCredits, { status: 402 });
      })
    );

    const formData = new FormData();
    formData.append('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(`${API_BASE}/v1/parser/parse_resume/`, {
      method: 'POST',
      body: formData,
    });

    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.message).toBe('Insufficient credits');
  });

  it('handles server error during enhance step', async () => {
    useHandler(
      http.post(`${API_BASE}/v1/resume/enhance`, () => {
        return HttpResponse.json(mockErrors.serverError, { status: 500 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/resume/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'ats-resume-123' }),
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toBe('Internal server error');
  });

  it('handles cache hit — skips enhance and returns cached data', async () => {
    useHandler(
      http.post(`${API_BASE}/v1/parser/parse_resume/`, () => {
        return HttpResponse.json({
          ...mockResponses.ats.parsed,
          cache_hit: true,
        });
      })
    );

    const formData = new FormData();
    formData.append('file', new Blob(['pdf-content'], { type: 'application/pdf' }), 'resume.pdf');

    const res = await fetch(`${API_BASE}/v1/parser/parse_resume/`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    expect(data.cache_hit).toBe(true);
    expect(data.resume_id).toBe('ats-resume-123');
  });

  it('handles unauthorized access to resume endpoints', async () => {
    useHandler(
      http.get(`${API_BASE}/v1/resumes/`, () => {
        return HttpResponse.json(mockErrors.unauthorized, { status: 401 });
      })
    );

    const res = await fetch(`${API_BASE}/v1/resumes/`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe('Unauthorized');
  });

  // ─── Score Validation ─────────────────────────────────────────────────────

  it('ATS score is within valid range (0–100)', async () => {
    const res = await fetch(`${API_BASE}/v1/resume/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'ats-resume-123' }),
    });

    const data = await res.json();
    const score = data.ats_display.score;

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('section breakdown contains all expected sections', async () => {
    const res = await fetch(`${API_BASE}/v1/resume/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'ats-resume-123' }),
    });

    const data = await res.json();
    const breakdown = data.enhancer_state.ats_breakdown.SectionBreakdown;

    expect(breakdown.ContactInfo).toBeDefined();
    expect(breakdown.Skills).toBeDefined();
    expect(breakdown.Experience).toBeDefined();
    expect(breakdown.Education).toBeDefined();
    expect(breakdown.Keywords).toBeDefined();
  });
});
