/**
 * Integration tests for the Profile API workflow.
 *
 * Uses vi.spyOn(httpClient, ...) to intercept real axios calls without MSW,
 * testing that each userApi function calls the correct endpoint and correctly
 * handles both success and error responses.
 *
 * Covers:
 *   - getProfile: calls /profile/, extracts nested and flat responses
 *   - updateProfile: PUTs to /profile/update, propagates validation errors
 *   - getSkills: calls /profile/skills, unwraps data array
 *   - addSkill: POSTs to /profile/skills with skill name
 *   - deleteSkill: DELETEs /profile/skills/{id}
 *   - getEmploymentInfo: calls /profile/employment-info
 *   - updateEmploymentInfo: PUTs to /profile/employment-info
 *   - getResume: calls /profile/resume, re-throws non-404 errors
 *   - deleteResume: DELETEs /profile/resume, returns message
 *   - getEducation / addEducation / updateEducation / deleteEducation
 *   - getExperience / addExperience / updateExperience / deleteExperience
 *   - getProjects / addProject / updateProjects / deleteProject
 *   - getCertification / addCertification / updateCertification / deleteCertification
 *   - getProfilePicture / uploadProfilePicture / deleteProfilePicture
 *
 * Run: npm run test:integration:profile
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AxiosResponse } from 'axios';
import { httpClient } from '@/lib/http';
import {
  getProfile,
  updateProfile,
  getSkills,
  addSkill,
  deleteSkill,
  getEmploymentInfo,
  updateEmploymentInfo,
  getResume,
  deleteResume,
  getEducation,
  addEducation,
  updateEducation,
  deleteEducation,
  getExperience,
  addExperience,
  updateExperience,
  deleteExperience,
  getProjects,
  addProject,
  updateProjects,
  deleteProject,
  getCertification,
  addCertification,
  updateCertification,
  deleteCertification,
  getProfilePicture,
  uploadProfilePicture,
  deleteProfilePicture,
} from '@/api/userApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeResponse = <T>(data: T, status = 200): AxiosResponse<T> =>
  ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as never,
  }) as unknown as AxiosResponse<T>;

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('Profile API — getProfile', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ id: 'u1', email: 'jane@example.com', full_name: 'Jane Doe' })
    );

    await getProfile();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/'),
      undefined
    );
  });

  it('returns profile from flat response (no nested data field)', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ id: 'u1', email: 'jane@example.com', full_name: 'Jane Doe' })
    );

    const result = await getProfile();

    expect(result.email).toBe('jane@example.com');
    expect(result.full_name).toBe('Jane Doe');
  });

  it('returns profile from nested { data: {...} } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: { id: 'u2', email: 'john@example.com', full_name: 'John Smith' } })
    );

    const result = await getProfile();

    expect(result.email).toBe('john@example.com');
  });

  it('throws when response is missing identity fields', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ headline: 'Developer' })
    );

    await expect(getProfile()).rejects.toThrow();
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('Profile API — updateProfile', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/update with provided fields', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ id: 'u1', email: 'jane@example.com', full_name: 'Updated Name' })
    );

    await updateProfile({ full_name: 'Updated Name', headline: 'Engineer' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/update'),
      expect.objectContaining({ full_name: 'Updated Name', headline: 'Engineer' })
    );
  });

  it('returns the updated profile data', async () => {
    vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'u1', email: 'j@e.com', full_name: 'New Name' } })
    );

    const result = await updateProfile({ full_name: 'New Name' });

    expect(result.full_name).toBe('New Name');
  });

  it('propagates 400 validation errors to the caller', async () => {
    vi.spyOn(httpClient, 'put').mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          details: {
            validation_errors: [{ field: 'full_name', message: 'Required' }],
          },
        },
      },
    });

    await expect(updateProfile({ full_name: '' })).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ─── Skills ───────────────────────────────────────────────────────────────────

describe('Profile API — getSkills', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/skills', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [] })
    );

    await getSkills();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/skills'));
  });

  it('returns skills from nested { data: [...] } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [{ id: '1', name: 'React' }, { id: '2', name: 'TypeScript' }] })
    );

    const result = await getSkills();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('React');
  });

  it('returns skills from flat array response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse([{ id: '3', name: 'Node.js' }] as never)
    );

    const result = await getSkills();

    expect(result[0].name).toBe('Node.js');
  });
});

describe('Profile API — addSkill', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/skills with the skill name', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-1', name: 'Python' } })
    );

    await addSkill('Python');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/skills'),
      { name: 'Python' }
    );
  });

  it('returns the created skill object', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-2', name: 'Go' } })
    );

    const result = await addSkill('Go');

    expect(result).toMatchObject({ id: 'new-2', name: 'Go' });
  });
});

describe('Profile API — deleteSkill', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/skills/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(
      makeResponse({})
    );

    await deleteSkill('skill-abc');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/skills/skill-abc')
    );
  });
});

// ─── Employment Info ──────────────────────────────────────────────────────────

describe('Profile API — getEmploymentInfo', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/employment-info', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: { employment_status: 'employed' } })
    );

    await getEmploymentInfo();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/employment-info')
    );
  });

  it('returns employment info from nested response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: { employment_status: 'student', gender: 'female' } })
    );

    const result = await getEmploymentInfo();

    expect(result.employment_status).toBe('student');
    expect(result.gender).toBe('female');
  });
});

describe('Profile API — updateEmploymentInfo', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/employment-info with provided data', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { employment_status: 'freelancer' } })
    );

    await updateEmploymentInfo({ employment_status: 'freelancer' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/employment-info'),
      expect.objectContaining({ employment_status: 'freelancer' })
    );
  });
});

// ─── Resume ───────────────────────────────────────────────────────────────────

describe('Profile API — getResume', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/resume', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ resume_url: 'https://example.com/resume.pdf' })
    );

    await getResume();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/resume')
    );
  });

  it('returns the resume URL', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ resume_url: 'https://cdn.example.com/user-resume.pdf' })
    );

    const result = await getResume();

    expect(result.resume_url).toBe('https://cdn.example.com/user-resume.pdf');
  });

  it('silently rethrows 404 (no resume uploaded yet)', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({
      response: { status: 404 },
    });

    await expect(getResume()).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('rethrows non-404 errors', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({
      response: { status: 500 },
    });

    await expect(getResume()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('Profile API — deleteResume', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/resume', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(
      makeResponse({ message: 'Resume deleted successfully' })
    );

    await deleteResume();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/resume')
    );
  });

  it('returns the response message', async () => {
    vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(
      makeResponse({ message: 'Resume deleted successfully' })
    );

    const result = await deleteResume();

    expect(result.message).toBe('Resume deleted successfully');
  });
});

// ─── Education ────────────────────────────────────────────────────────────────

describe('Profile API — getEducation', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/education', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [] })
    );

    await getEducation();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/education'));
  });

  it('returns education from nested { data: [...] } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [{ id: 'e1', institution: 'MIT', degree: 'B.Sc' }] })
    );

    const result = await getEducation();

    expect(result).toHaveLength(1);
    expect(result[0].institution).toBe('MIT');
  });

  it('returns education from flat array response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse([{ id: 'e2', institution: 'Harvard', degree: 'M.Sc' }] as never)
    );

    const result = await getEducation();

    expect(result[0].institution).toBe('Harvard');
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({ response: { status: 500 } });

    await expect(getEducation()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('Profile API — addEducation', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/education with education data', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-e1', institution: 'Oxford', degree: 'PhD' } })
    );

    await addEducation({ institution: 'Oxford', degree: 'PhD', stream: 'CS', start_date: '2020-09-01' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/education'),
      expect.objectContaining({ institution: 'Oxford', degree: 'PhD' })
    );
  });

  it('returns the created education entry', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-e2', institution: 'Cambridge', degree: 'B.A.' } })
    );

    const result = await addEducation({ institution: 'Cambridge', degree: 'B.A.', stream: 'Arts', start_date: '2019-09-01' });

    expect(result).toMatchObject({ id: 'new-e2', institution: 'Cambridge' });
  });
});

describe('Profile API — updateEducation', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/education/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'e1', institution: 'MIT Updated', degree: 'B.Sc' } })
    );

    await updateEducation('e1', { institution: 'MIT Updated' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/education/e1'),
      expect.objectContaining({ institution: 'MIT Updated' })
    );
  });

  it('returns the updated education entry', async () => {
    vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'e1', institution: 'MIT Updated', degree: 'M.Sc' } })
    );

    const result = await updateEducation('e1', { degree: 'M.Sc' });

    expect(result.degree).toBe('M.Sc');
  });
});

describe('Profile API — deleteEducation', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/education/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(makeResponse({}));

    await deleteEducation('e1');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/education/e1'));
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'delete').mockRejectedValueOnce({ response: { status: 404 } });

    await expect(deleteEducation('e-missing')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ─── Experience ───────────────────────────────────────────────────────────────

describe('Profile API — getExperience', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/experience', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [] })
    );

    await getExperience();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/experience'));
  });

  it('returns experience from nested { data: [...] } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [{ id: 'x1', job_title: 'Engineer', company: 'Acme' }] })
    );

    const result = await getExperience();

    expect(result).toHaveLength(1);
    expect(result[0].job_title).toBe('Engineer');
  });

  it('returns experience from flat array response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse([{ id: 'x2', job_title: 'Manager', company: 'Corp' }] as never)
    );

    const result = await getExperience();

    expect(result[0].company).toBe('Corp');
  });
});

describe('Profile API — addExperience', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/experience with experience data', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-x1', job_title: 'Dev', company: 'StartupCo' } })
    );

    await addExperience({ job_title: 'Dev', company: 'StartupCo', job_type: 'full-time', location: 'Remote', start_date: '2021-01-01' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/experience'),
      expect.objectContaining({ job_title: 'Dev', company: 'StartupCo' })
    );
  });

  it('returns the created experience entry', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-x2', job_title: 'Analyst', company: 'BigBank' } })
    );

    const result = await addExperience({ job_title: 'Analyst', company: 'BigBank', job_type: 'full-time', location: 'NYC', start_date: '2022-06-01' });

    expect(result).toMatchObject({ id: 'new-x2', company: 'BigBank' });
  });
});

describe('Profile API — updateExperience', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/experience/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'x1', job_title: 'Senior Engineer', company: 'Acme' } })
    );

    await updateExperience('x1', { job_title: 'Senior Engineer' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/experience/x1'),
      expect.objectContaining({ job_title: 'Senior Engineer' })
    );
  });

  it('returns the updated experience entry', async () => {
    vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'x1', job_title: 'Staff Engineer', company: 'Acme' } })
    );

    const result = await updateExperience('x1', { job_title: 'Staff Engineer' });

    expect(result.job_title).toBe('Staff Engineer');
  });
});

describe('Profile API — deleteExperience', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/experience/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(makeResponse({}));

    await deleteExperience('x1');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/experience/x1'));
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'delete').mockRejectedValueOnce({ response: { status: 403 } });

    await expect(deleteExperience('x-missing')).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ─── Projects ─────────────────────────────────────────────────────────────────

describe('Profile API — getProjects', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/projects', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [] })
    );

    await getProjects();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/projects'));
  });

  it('returns projects from nested { data: [...] } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [{ id: 'p1', project_name: 'CareerBot', role: 'Lead Dev' }] })
    );

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].project_name).toBe('CareerBot');
  });

  it('returns projects from flat array response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse([{ id: 'p2', project_name: 'Flat Project', role: 'Dev' }] as never)
    );

    const result = await getProjects();

    expect(result[0].project_name).toBe('Flat Project');
  });
});

describe('Profile API — addProject', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/projects with project data', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-p1', project_name: 'NewApp', role: 'Developer' } })
    );

    await addProject({ project_name: 'NewApp', role: 'Developer', start_date: '2023-01-01' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/projects'),
      expect.objectContaining({ project_name: 'NewApp', role: 'Developer' })
    );
  });

  it('returns the created project entry', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-p2', project_name: 'ToolX', role: 'Architect' } })
    );

    const result = await addProject({ project_name: 'ToolX', role: 'Architect', start_date: '2023-06-01' });

    expect(result).toMatchObject({ id: 'new-p2', project_name: 'ToolX' });
  });
});

describe('Profile API — updateProjects', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/projects/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'p1', project_name: 'CareerBot v2', role: 'Lead' } })
    );

    await updateProjects('p1', { project_name: 'CareerBot v2' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/projects/p1'),
      expect.objectContaining({ project_name: 'CareerBot v2' })
    );
  });

  it('returns the updated project entry', async () => {
    vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'p1', project_name: 'CareerBot v3', role: 'Lead' } })
    );

    const result = await updateProjects('p1', { project_name: 'CareerBot v3' });

    expect(result.project_name).toBe('CareerBot v3');
  });
});

describe('Profile API — deleteProject', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/projects/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(makeResponse({}));

    await deleteProject('p1');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/projects/p1'));
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'delete').mockRejectedValueOnce({ response: { status: 404 } });

    await expect(deleteProject('p-missing')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ─── Certifications ───────────────────────────────────────────────────────────

describe('Profile API — getCertification', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/certifications', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [] })
    );

    await getCertification();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/certifications'));
  });

  it('returns certifications from nested { data: [...] } response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ data: [{ id: 'c1', certification_name: 'AWS Developer', issuer: 'Amazon' }] })
    );

    const result = await getCertification();

    expect(result).toHaveLength(1);
    expect(result[0].certification_name).toBe('AWS Developer');
  });

  it('returns certifications from flat array response', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse([{ id: 'c2', certification_name: 'GCP Associate', issuer: 'Google' }] as never)
    );

    const result = await getCertification();

    expect(result[0].issuer).toBe('Google');
  });
});

describe('Profile API — addCertification', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/certifications with certification data', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-c1', certification_name: 'Azure Fundamentals', issuer: 'Microsoft' } })
    );

    await addCertification({ certification_name: 'Azure Fundamentals', issuer: 'Microsoft', start_date: '2023-01-01', credential_id: 'AZ-900' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/certifications'),
      expect.objectContaining({ certification_name: 'Azure Fundamentals', issuer: 'Microsoft' })
    );
  });

  it('returns the created certification entry', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ data: { id: 'new-c2', certification_name: 'CKA', issuer: 'CNCF' } })
    );

    const result = await addCertification({ certification_name: 'CKA', issuer: 'CNCF', start_date: '2023-06-01', credential_id: 'CKA-2023' });

    expect(result).toMatchObject({ id: 'new-c2', certification_name: 'CKA' });
  });
});

describe('Profile API — updateCertification', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('PUTs to /profile/certifications/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'c1', certification_name: 'AWS Solutions Architect', issuer: 'Amazon' } })
    );

    await updateCertification('c1', { certification_name: 'AWS Solutions Architect' });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/certifications/c1'),
      expect.objectContaining({ certification_name: 'AWS Solutions Architect' })
    );
  });

  it('returns the updated certification entry', async () => {
    vi.spyOn(httpClient, 'put').mockResolvedValueOnce(
      makeResponse({ data: { id: 'c1', certification_name: 'AWS SAA', issuer: 'Amazon' } })
    );

    const result = await updateCertification('c1', { certification_name: 'AWS SAA' });

    expect(result.certification_name).toBe('AWS SAA');
  });
});

describe('Profile API — deleteCertification', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/certifications/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(makeResponse({}));

    await deleteCertification('c1');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/certifications/c1'));
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'delete').mockRejectedValueOnce({ response: { status: 404 } });

    await expect(deleteCertification('c-missing')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ─── Profile Picture ──────────────────────────────────────────────────────────

describe('Profile API — getProfilePicture', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls GET /profile/picture', async () => {
    const spy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ picture_url: 'https://cdn.example.com/pic.jpg' })
    );

    await getProfilePicture();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/picture'));
  });

  it('returns the picture URL', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce(
      makeResponse({ picture_url: 'https://cdn.example.com/avatar.png' })
    );

    const result = await getProfilePicture();

    expect(result.picture_url).toBe('https://cdn.example.com/avatar.png');
  });

  it('rethrows 404 (no picture uploaded yet)', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({ response: { status: 404 } });

    await expect(getProfilePicture()).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('rethrows non-404 errors', async () => {
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce({ response: { status: 500 } });

    await expect(getProfilePicture()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('Profile API — uploadProfilePicture', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('POSTs to /profile/picture/upload with multipart form data', async () => {
    const spy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ picture_url: 'https://cdn.example.com/new-pic.jpg' })
    );
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });

    await uploadProfilePicture(file);

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/profile/picture/upload'),
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );
  });

  it('returns the uploaded picture URL', async () => {
    vi.spyOn(httpClient, 'post').mockResolvedValueOnce(
      makeResponse({ picture_url: 'https://cdn.example.com/uploaded.jpg' })
    );
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploadProfilePicture(file);

    expect(result.picture_url).toBe('https://cdn.example.com/uploaded.jpg');
  });

  it('rethrows upload errors', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce({ response: { status: 413 } });
    const file = new File(['img'], 'huge.jpg', { type: 'image/jpeg' });

    await expect(uploadProfilePicture(file)).rejects.toMatchObject({ response: { status: 413 } });
  });
});

describe('Profile API — deleteProfilePicture', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends DELETE to /profile/picture', async () => {
    const spy = vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(
      makeResponse({ message: 'Profile picture deleted' })
    );

    await deleteProfilePicture();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/profile/picture'));
  });

  it('returns the response message', async () => {
    vi.spyOn(httpClient, 'delete').mockResolvedValueOnce(
      makeResponse({ message: 'Profile picture deleted' })
    );

    const result = await deleteProfilePicture();

    expect(result.message).toBe('Profile picture deleted');
  });

  it('rethrows errors', async () => {
    vi.spyOn(httpClient, 'delete').mockRejectedValueOnce({ response: { status: 404 } });

    await expect(deleteProfilePicture()).rejects.toMatchObject({ response: { status: 404 } });
  });
});
