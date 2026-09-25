/**
 * downloadEnhancedResume must tell careerbot-api whether to keep the
 * uploaded file's own layout.
 *
 * careerbot-api develop2, app/api/v1/endpoints/resume_enhancer.py:
 *   L1468  preserve_template: bool = False   (default = use an app template)
 *   L1787  `if preserve_template and not _enh_dl_has_app_template_request:`
 *          -> render with the ORIGINAL uploaded template
 *
 * So an omitted flag is not neutral: it flips the resume-list download
 * (builder/start/list/page.tsx calls downloadEnhancedResume(id, format) with
 * no template) from "original layout" to "app template". develop2 sent
 * preserve_template=true on that path and false only when a template was
 * chosen. The real axios instance runs; only the transport adapter is stubbed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import httpClient from '@/lib/http';
import { downloadEnhancedResume } from '@/api/enhancerApi';

const calls: InternalAxiosRequestConfig[] = [];
const originalAdapter = httpClient.defaults.adapter;

const fakeAdapter: AxiosAdapter = async (config) => {
  calls.push(config);
  return { data: new Blob(['%PDF']), status: 200, statusText: 'OK', headers: {}, config };
};

const queryOf = (config: InternalAxiosRequestConfig): URLSearchParams =>
  new URL(axios.getUri(config), 'http://localhost').searchParams;

describe('downloadEnhancedResume query params', () => {
  beforeEach(() => {
    calls.length = 0;
    httpClient.defaults.adapter = fakeAdapter;
  });
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('resume-list download (no template chosen) asks the backend to preserve the uploaded layout', async () => {
    await downloadEnhancedResume('enh-1', 'pdf');

    expect(calls).toHaveLength(1);
    const q = queryOf(calls[0]);
    expect(q.get('format')).toBe('pdf');
    expect(q.get('preserve_template')).toBe('true');
    expect(q.has('template_id')).toBe(false);
    expect(q.has('catalogue_template_id')).toBe(false);
  });

  it('preview-panel download with a domain template sends preserve_template=false and the template', async () => {
    await downloadEnhancedResume('enh-1', 'docx', 'classic_formal', 'software_engineer');

    const q = queryOf(calls[0]);
    expect(q.get('format')).toBe('docx');
    expect(q.get('preserve_template')).toBe('false');
    expect(q.get('template_id')).toBe('software_engineer');
    expect(q.get('catalogue_template_id')).toBe('classic_formal');
  });

  it('a catalogue alone still counts as a chosen template (preserve_template=false)', async () => {
    // With preserve_template=true and no template_id the backend would enter
    // its preserve branch (L1787) rather than the catalogue overlay (L2006).
    await downloadEnhancedResume('enh-1', 'pdf', 'classic_formal');

    const q = queryOf(calls[0]);
    expect(q.get('preserve_template')).toBe('false');
    expect(q.get('catalogue_template_id')).toBe('classic_formal');
    expect(q.has('template_id')).toBe(false);
  });
});
