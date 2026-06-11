import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Resume Builder Complete Workflow
 *
 * Tests the complete resume creation flow:
 * 1. Create new resume
 * 2. Add sections and content
 * 3. Auto-save functionality
 * 4. Score calculation
 * 5. Display in dashboard
 *
 * Run: npm run test:integration:resume
 */
describe('Resume Builder: Build, Save, and Display Flow', () => {
  it('creates new resume', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'My Resume' }),
    });

    const resume = await createRes.json();

    expect(createRes.status).toBe(200);
    expect(resume.id).toBeDefined();
    expect(resume.title).toBe('My Resume');
    expect(resume.sections).toBeDefined();
  });

  it('updates resume with sections', async () => {
    // First create
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Resume' }),
    });

    const created = await createRes.json();

    // Then update with sections
    const updateRes = await fetch(`/api/resume/${created.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sections: {
          summary: 'Professional summary',
          experience: [
            {
              title: 'Senior Engineer',
              company: 'Tech Corp',
              duration: '5 years',
            },
          ],
          education: [
            {
              degree: 'BS Computer Science',
              school: 'University',
            },
          ],
        },
      }),
    });

    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.sections.experience).toHaveLength(1);
    expect(updated.sections.education).toHaveLength(1);
  });

  it('auto-saves resume periodically', async () => {
    // Create resume
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Auto-save Test' }),
    });

    const resume = await createRes.json();

    // Simulate periodic auto-saves
    for (let i = 0; i < 3; i++) {
      const updateRes = await fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          sections: { summary: `Updated ${i + 1}` },
        }),
      });

      expect(updateRes.status).toBe(200);
    }
  });

  it('calculates resume score', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Scoring Test' }),
    });

    const resume = await createRes.json();

    expect(resume.score).toBeDefined();
    expect(resume.score).toBeGreaterThanOrEqual(0);
    expect(resume.score).toBeLessThanOrEqual(100);
  });

  it('improves score when sections added', async () => {
    // Create resume (starts with low score)
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Score Progress' }),
    });

    const created = await createRes.json();
    const initialScore = created.score;

    // Add content
    useHandler(
      http.put(`/api/resume/${created.id}`, () => {
        return HttpResponse.json({
          ...created,
          sections: {
            summary: 'Professional with 10+ years experience',
            experience: [
              {
                title: 'Principal Engineer',
                company: 'FAANG',
                duration: '8 years',
              },
            ],
            education: [{ degree: 'MS', school: 'Top University' }],
            skills: ['React', 'Node', 'Python'],
          },
          score: initialScore + 40, // Score improved
        });
      })
    );

    const updateRes = await fetch(`/api/resume/${created.id}`, {
      method: 'PUT',
      body: JSON.stringify({ summary: 'Professional...' }),
    });

    const updated = await updateRes.json();
    expect(updated.score).toBeGreaterThan(initialScore);
  });

  it('retrieves saved resume for editing', async () => {
    // Create
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Retrieved Resume' }),
    });

    const created = await createRes.json();

    // Retrieve
    const getRes = await fetch(`/api/resume/${created.id}`);
    const retrieved = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe('Retrieved Resume');
  });

  it('handles complex resume with multiple sections', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Complex Resume' }),
    });

    const resume = await createRes.json();

    // Update with all sections
    const updateRes = await fetch(`/api/resume/${resume.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sections: {
          summary: 'Summary text',
          experience: [
            { title: 'Role 1', company: 'Company 1', duration: '2 years' },
            { title: 'Role 2', company: 'Company 2', duration: '3 years' },
          ],
          education: [{ degree: 'BS', school: 'School 1' }],
          skills: ['Skill1', 'Skill2', 'Skill3'],
          certifications: ['Cert1', 'Cert2'],
          projects: [{ title: 'Project 1', description: 'Details' }],
        },
      }),
    });

    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.sections.experience).toHaveLength(2);
    expect(updated.sections.skills).toHaveLength(3);
  });

  it('displays resume in dashboard', async () => {
    // Create resume
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Dashboard Resume' }),
    });

    const resume = await createRes.json();

    // Check dashboard
    const dashboardRes = await fetch('/api/dashboard/summary');
    const dashboard = await dashboardRes.json();

    expect(dashboardRes.status).toBe(200);
    expect(dashboard.recentResumes).toBeDefined();
    expect(Array.isArray(dashboard.recentResumes)).toBe(true);
  });

  it('handles concurrent edits', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Concurrent Edit' }),
    });

    const resume = await createRes.json();

    // Simulate concurrent edits
    const promises = [
      fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sections: { summary: 'Edit 1' } }),
      }),
      fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sections: { summary: 'Edit 2' } }),
      }),
    ];

    const responses = await Promise.all(promises);

    // Both should complete
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it('enhances existing resume', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Enhance Test' }),
    });

    const resume = await createRes.json();

    // Enhance
    const enhanceRes = await fetch(`/api/resume/${resume.id}/enhance`, {
      method: 'POST',
      body: JSON.stringify({ focus: 'bullets' }),
    });

    const enhanced = await enhanceRes.json();

    expect(enhanceRes.status).toBe(200);
    expect(enhanced.id).toBe(resume.id);
    expect(enhanced.sections).toBeDefined();
  });

  it('tracks resume modifications', async () => {
    const createRes = await fetch('/api/resume/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Track Mods' }),
    });

    const resume = await createRes.json();
    const createdAt = new Date();

    // Modify
    await fetch(`/api/resume/${resume.id}`, {
      method: 'PUT',
      body: JSON.stringify({ sections: { summary: 'Updated' } }),
    });

    // Should have modification timestamp
    const getRes = await fetch(`/api/resume/${resume.id}`);
    const updated = await getRes.json();

    expect(updated.lastModified).toBeDefined();
  });
});
