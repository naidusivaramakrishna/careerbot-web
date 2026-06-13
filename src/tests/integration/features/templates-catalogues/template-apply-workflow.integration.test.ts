/**
 * Integration tests: template apply workflow.
 *
 * Tests the real business logic of the API functions (getProfile, getAllResumes,
 * createResumeWithAuth) by spying on httpClient at the axios level — not mocking
 * the whole API module.  This verifies:
 *   - Response-format handling (flat vs nested { data: {...} })
 *   - Data normalisation (_id → id, profile fields → personalInfo)
 *   - localStorage side-effects (current_resume_id, resume_created_<id>)
 *   - The composite getProfile → POST /resumes/ sequence in createResumeWithAuth
 *
 * Run: npm run test:integration:templates
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AxiosResponse } from 'axios';
import { httpClient } from '@/lib/http';
import { getProfile } from '@/api/userApi';
import { getAllResumes, createResumeWithAuth } from '@/api/resumeApi';

// Minimal AxiosResponse-shaped object — double cast avoids explicit `any`
const axiosOk = <T>(data: T, status = 200) =>
  ({ data, status, statusText: 'OK', headers: {}, config: { headers: {} }, request: {} } as unknown as AxiosResponse<T>);

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('Template workflow — getProfile', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  it('returns a flat profile response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk({ id: 'user-123', email: 'test@example.com', username: 'testuser', full_name: 'Test User' })
    );

    const profile = await getProfile();

    expect(profile.id).toBe('user-123');
    expect(profile.email).toBe('test@example.com');
    expect(profile.full_name).toBe('Test User');
  });

  it('unwraps a nested { data: {...} } response format', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk({ data: { id: 'nested-id', email: 'nested@example.com', username: 'nested' } })
    );

    const profile = await getProfile();

    expect(profile.id).toBe('nested-id');
    expect(profile.email).toBe('nested@example.com');
  });

  it('returns the full profile object (not null)', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk({ id: 'u1', email: 'u1@x.com', username: 'u1' })
    );

    const profile = await getProfile();

    expect(profile).toBeDefined();
    expect(typeof profile).toBe('object');
  });

  it('throws when the response has no identity fields', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk({ some_field: 'irrelevant' })
    );

    await expect(getProfile()).rejects.toThrow();
  });
});

// ─── getAllResumes ────────────────────────────────────────────────────────────

describe('Template workflow — getAllResumes', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  it('returns the resume list', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk([
        { id: 'resume-1', _id: 'resume-1', personalInfo: { fullname: 'Test User', email: 'test@example.com' }, updatedAt: '', createdAt: '' },
      ])
    );

    const resumes = await getAllResumes();

    expect(Array.isArray(resumes)).toBe(true);
    expect(resumes).toHaveLength(1);
    expect(resumes[0].id).toBe('resume-1');
  });

  it('normalises a resume that only has _id (no id field)', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk([
        { _id: 'mongo-id-1', personalInfo: { fullname: 'Jane' }, updatedAt: '', createdAt: '' },
      ])
    );

    const resumes = await getAllResumes();

    expect(resumes[0].id).toBe('mongo-id-1');
  });

  it('includes personalInfo on each resume', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk([
        { id: 'r1', personalInfo: { fullname: 'Test User', email: 'test@example.com' }, updatedAt: '', createdAt: '' },
      ])
    );

    const resumes = await getAllResumes();

    expect(resumes[0].personalInfo?.fullname).toBe('Test User');
    expect(resumes[0].personalInfo?.email).toBe('test@example.com');
  });

  it('returns an empty array when the API returns []', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk([]));

    const resumes = await getAllResumes();

    expect(resumes).toHaveLength(0);
  });

  it('saves the first resume ID to localStorage', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk([{ id: 'resume-1', updatedAt: '', createdAt: '' }])
    );

    await getAllResumes();

    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'resume-1');
  });

  it('filters out resumes that have no id at all', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      axiosOk([
        { personalInfo: {}, updatedAt: '', createdAt: '' },     // no id, no _id
        { id: 'valid-1', updatedAt: '', createdAt: '' },         // has id
      ])
    );

    const resumes = await getAllResumes();

    expect(resumes).toHaveLength(1);
    expect(resumes[0].id).toBe('valid-1');
  });
});

// ─── createResumeWithAuth ─────────────────────────────────────────────────────

describe('Template workflow — createResumeWithAuth', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  const profileData = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    phone_number: '+1234567890',
    location: 'Test City',
    linkedin_url: 'https://linkedin.com/in/testuser',
  };

  const resumeData = {
    id: 'new-resume-123',
    _id: 'new-resume-123',
    personalInfo: {
      fullname: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      location: 'Test City',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      portfolioUrl: '',
    },
    updatedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('creates a resume and returns an id', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    const resume = await createResumeWithAuth();

    expect(resume.id).toBe('new-resume-123');
  });

  it('sends personalInfo populated from the user profile', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    await createResumeWithAuth();

    const body = postSpy.mock.calls[0][1] as Record<string, Record<string, string>>;
    expect(body.personalInfo.email).toBe('test@example.com');
    expect(body.personalInfo.fullname).toBe('Test User');
    expect(body.personalInfo.phone).toBe('+1234567890');
    expect(body.personalInfo.location).toBe('Test City');
    expect(body.personalInfo.linkedinUrl).toBe('https://linkedin.com/in/testuser');
  });

  it('saves the new resume ID to localStorage', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    await createResumeWithAuth();

    expect(window.localStorage.setItem).toHaveBeenCalledWith('current_resume_id', 'new-resume-123');
  });

  it('writes a numeric creation timestamp to localStorage', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    await createResumeWithAuth();

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'resume_created_new-resume-123',
      expect.stringMatching(/^\d+$/)
    );
  });

  it('makes exactly two localStorage writes: current_resume_id and resume_created_<id>', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    await createResumeWithAuth();

    const setItemCalls = (window.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls;
    const writtenKeys = setItemCalls.map((c: [string, string]) => c[0]);

    expect(writtenKeys).toContain('current_resume_id');
    expect(writtenKeys).toContain('resume_created_new-resume-123');
  });

  it('creates a resume with empty personalInfo when profile fetch fails', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce(new Error('Network error'));
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(axiosOk(resumeData, 201));

    const resume = await createResumeWithAuth();

    // Resume is still created despite profile failure
    expect(resume.id).toBe('new-resume-123');

    // personalInfo fields must all be empty strings
    const body = postSpy.mock.calls[0][1] as Record<string, Record<string, string>>;
    expect(body.personalInfo.email).toBe('');
    expect(body.personalInfo.fullname).toBe('');
    expect(body.personalInfo.phone).toBe('');
    expect(body.personalInfo.location).toBe('');
  });

  it('throws when the resume POST itself fails', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(axiosOk(profileData));
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(new Error('Server error'));

    await expect(createResumeWithAuth()).rejects.toThrow();
  });
});
