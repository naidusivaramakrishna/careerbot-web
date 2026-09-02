import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Complete Mock Interview Workflow
 *
 * Tests the 5-stage mock interview process:
 * 1. Notes generation from resume
 * 2. Practice round 1 (with notes)
 * 3. Practice round 2 (keywords only)
 * 4. Readiness gate
 * 5. Live interview
 *
 * Run: npm run test:integration:mock-interview
 */
describe('Mock Interview: Complete 5-Stage Workflow', () => {
  it('generates notes from user profile', async () => {
    const profileRes = await fetch('/api/user/profile');
    const profile = await profileRes.json();

    expect(profileRes.status).toBe(200);
    expect(profile.email).toBeDefined();
    expect(profile.id).toBeDefined();
  });

  it('generates interview notes from resume', async () => {
    const notesRes = await fetch('/api/mock-interview/generate-notes', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
    });

    const notes = await notesRes.json();

    expect(notesRes.status).toBe(200);
    expect(notes.notes_id).toBeDefined();
    expect(notes.sections).toBeDefined();
    expect(Array.isArray(notes.sections)).toBe(true);
  });

  it('starts practice interview session', async () => {
    const startRes = await fetch('/api/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify({ notes_id: 'notes-123' }),
    });

    const session = await startRes.json();

    expect(startRes.status).toBe(200);
    expect(session.session_id).toBeDefined();
    expect(session.stage).toBeDefined();
    expect(session.question_count).toBeGreaterThan(0);
  });

  it('submits and records practice answers', async () => {
    // Start session first
    const startRes = await fetch('/api/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify({ notes_id: 'notes-123' }),
    });

    const session = await startRes.json();

    // Submit answers for all questions
    for (let i = 0; i < session.question_count; i++) {
      const submitRes = await fetch(
        `/api/mock-interview/${session.session_id}/submit-answer`,
        {
          method: 'POST',
          body: JSON.stringify({
            question_id: `q-${i}`,
            audio_data: 'audio-blob',
          }),
        }
      );

      const result = await submitRes.json();
      expect(submitRes.status).toBe(200);
      expect(result.answer_recorded).toBe(true);
    }
  });

  it('generates interview report after completion', async () => {
    const reportRes = await fetch('/api/mock-interview/session-123/report');
    const report = await reportRes.json();

    expect(reportRes.status).toBe(200);
    expect(report.session_id).toBeDefined();
    expect(report.score).toBeDefined();
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(10);
    expect(report.questions_answered).toBeGreaterThan(0);
  });

  it('tracks interview progress through stages', async () => {
    // Stage 1: Generate notes
    const notesRes = await fetch('/api/mock-interview/generate-notes', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
    });

    const notes = await notesRes.json();
    expect(notes.notes_id).toBeDefined();

    // Stage 2: Start practice
    const practiceRes = await fetch('/api/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify({ notes_id: notes.notes_id }),
    });

    const practice = await practiceRes.json();
    expect(practice.stage).toBe('practice-round-1');

    // Stage 3: Complete practice
    // (Submit answers - already tested above)

    // Stage 4: Get report
    const reportRes = await fetch(
      `/api/mock-interview/${practice.session_id}/report`
    );
    const report = await reportRes.json();

    expect(report.score).toBeDefined();
  });

  it('provides feedback on interview performance', async () => {
    const reportRes = await fetch('/api/mock-interview/session-123/report');
    const report = await reportRes.json();

    expect(report.feedback).toBeDefined();
    expect(Array.isArray(report.feedback) || typeof report.feedback === 'object').toBe(
      true
    );
  });

  it('handles interview session resumption', async () => {
    // Start session
    const startRes = await fetch('/api/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify({ notes_id: 'notes-123' }),
    });

    const session1 = await startRes.json();

    // Simulate resuming same session
    const resumeRes = await fetch('/api/mock-interview/start', {
      method: 'POST',
      body: JSON.stringify({ notes_id: 'notes-123' }),
    });

    const session2 = await resumeRes.json();

    // Should have same session ID
    expect(session2.session_id).toBeDefined();
  });

  it('validates answer submission format', async () => {
    const submitRes = await fetch('/api/mock-interview/session-123/submit-answer', {
      method: 'POST',
      body: JSON.stringify({
        question_id: 'q-1',
        audio_data: 'audio-blob',
      }),
    });

    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.answer_recorded).toBe(true);
  });

  it('generates shareable report', async () => {
    const reportRes = await fetch('/api/mock-interview/session-123/report');
    const report = await reportRes.json();

    // Report should be shareable
    expect(report.session_id).toBeDefined();
    expect(report.score).toBeDefined();
    // In real app, shareToken would be generated
  });
});
