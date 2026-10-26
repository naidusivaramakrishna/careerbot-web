/**
 * G6: a college's feature switches, as the web applies them to a student.
 * Keys must match careerbot-api (entitlements.py _KNOWN_FEATURES /
 * feature_gate.py ENGINE_FEATURES) exactly.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/lib/http';
import {
  COLLEGE_FEATURE_DISABLED,
  ENGINE_FEATURES,
  NAV_ITEM_FEATURE,
  collegeFeatureFromError,
  isGatedPage,
  normaliseDisabledFeatures,
  onCollegeFeatureRefused,
  withoutDisabledFeatures,
} from '@/lib/collegeFeatures';

/** careerbot-api app/core/institution/entitlements.py _KNOWN_FEATURES. */
const API_KNOWN_FEATURES = [
  'mock_test', 'coding_test', 'mock_interview', 'english_assessment',
  'resume_tools', 'job_matching', 'rankings',
];
/** careerbot-api feature_gate.py NOT_ENGINE_FEATURES. */
const API_NOT_ENGINE = ['resume_tools', 'job_matching', 'rankings'];

describe('feature keys match the API', () => {
  it('engine keys are exactly the API known list minus its non-engine keys', () => {
    expect([...ENGINE_FEATURES].sort()).toEqual(
      API_KNOWN_FEATURES.filter((f) => !API_NOT_ENGINE.includes(f)).sort(),
    );
  });

  it('every nav mapping points at an engine key', () => {
    for (const f of Object.values(NAV_ITEM_FEATURE)) {
      expect(ENGINE_FEATURES).toContain(f);
    }
  });

  const LAYOUTS: Record<string, string> = {
    mock_test: 'src/app/(interview)/mock-test/layout.tsx',
    coding_test: 'src/app/coding-test/layout.tsx',
    mock_interview: 'src/app/(interview)/mock-interview/layout.tsx',
    english_assessment: 'src/app/(interview)/communication/layout.tsx',
  };

  it.each(ENGINE_FEATURES.map((f) => [f]))('%s is hidden in nav AND gated on its pages', (feature) => {
    expect(Object.values(NAV_ITEM_FEATURE)).toContain(feature);
    const source = readFileSync(join(process.cwd(), LAYOUTS[feature]), 'utf8');
    expect(source).toContain(`<CollegeFeatureGate feature="${feature}">`);
  });

  it('interview prep pages go with the mock interview', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/(interview)/prep/layout.tsx'), 'utf8');
    expect(source).toContain('<CollegeFeatureGate feature="mock_interview">');
  });
});

describe('normaliseDisabledFeatures', () => {
  it.each([
    [[' Mock_Test ', 'coding_test'], ['mock_test', 'coding_test']],
    ['mock_interview', ['mock_interview']],
    [['', 7, null, 'rankings'], ['rankings']],
    [null, []],
    [undefined, []],
    [{ mock_test: true }, []],
  ])('%j -> %j', (input, out) => {
    expect([...normaliseDisabledFeatures(input)].sort()).toEqual([...out].sort());
  });
});

describe('withoutDisabledFeatures', () => {
  const groups = [
    { label: 'A', items: [{ id: 'dashboard' }, { id: 'interview_notes' }] },
    { label: 'B', items: [{ id: 'mock_test' }, { id: 'mock_interview' }] },
    { label: 'C', items: [{ id: 'coding_test' }, { id: 'comm_assess' }] },
  ];

  it('nothing off: the same groups, untouched', () => {
    expect(withoutDisabledFeatures(groups, new Set())).toBe(groups);
  });

  it('drops the items of switched-off features and any group left empty', () => {
    const out = withoutDisabledFeatures(groups, new Set(['mock_test', 'mock_interview']));
    expect(out.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ['A', ['dashboard']],
      ['C', ['coding_test', 'comm_assess']],
    ]);
  });

  it('english_assessment hides the Communication item', () => {
    const out = withoutDisabledFeatures(groups, new Set(['english_assessment']));
    expect(out[2].items.map((i) => i.id)).toEqual(['coding_test']);
  });

  it('a non-engine key hides nothing', () => {
    expect(withoutDisabledFeatures(groups, new Set(['rankings']))).toEqual(groups);
  });
});

describe('isGatedPage', () => {
  it.each([
    ['/mock-test', true],
    ['/mock-test/company/tcs', true],
    ['/mock-interview/live', true],
    ['/coding-test', true],
    ['/coding-test/two-sum', true],
    ['/communication/start', true],
    ['/prep/notes', true],
    // past results stay readable, like the API's reads
    ['/mock-test/history', false],
    ['/mock-test/results/abc', false],
    ['/mock-interview/report/s1', false],
    ['/coding-test/history', false],
    ['/communication/report', false],
    // public marketing pages
    ['/mock-interview', false],
    ['/communication', false],
    ['/prep', false],
    // segment match, not a raw prefix
    ['/mock-test/historyx', true],
    [null, false],
  ])('%s -> %s', (path, gated) => {
    expect(isGatedPage(path as string | null)).toBe(gated);
  });
});

const refusal = (feature: unknown, status = 403, code: unknown = COLLEGE_FEATURE_DISABLED) => ({
  response: {
    status,
    data: { success: false, error: { error_code: 'HTTP_403', details: { error: code, feature } } },
  },
});

describe('collegeFeatureFromError', () => {
  it('reads the feature from the API refusal shape', () => {
    expect(collegeFeatureFromError(refusal('mock_interview'))).toBe('mock_interview');
  });
  it.each([
    ['another 403', refusal('mock_test', 403, 'FEATURE_DISABLED')],
    ['not a 403', refusal('mock_test', 402)],
    ['unknown feature', refusal('rankings')],
    ['no response', new Error('network')],
    ['null', null],
  ])('%s -> null', (_name, err) => {
    expect(collegeFeatureFromError(err)).toBeNull();
  });
});

describe('the HTTP client announces a refusal once, for every engine', () => {
  const realAdapter = httpClient.defaults.adapter;
  afterEach(() => {
    httpClient.defaults.adapter = realAdapter;
  });

  function backend(status: number, body: unknown) {
    const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
      const response = { data: body, status, statusText: '', headers: {}, config };
      throw Object.assign(new Error(`HTTP ${status}`), { config, response, isAxiosError: true });
    };
    httpClient.defaults.adapter = adapter;
  }

  it('a COLLEGE_FEATURE_DISABLED 403 is announced and still rejected', async () => {
    const heard = vi.fn();
    const off = onCollegeFeatureRefused(heard);
    backend(403, refusal('coding_test').response.data);
    await expect(httpClient.post('/coding-test/sessions', {})).rejects.toBeTruthy();
    off();
    expect(heard).toHaveBeenCalledWith('coding_test');
  });

  it('any other 403 is not', async () => {
    const heard = vi.fn();
    const off = onCollegeFeatureRefused(heard);
    backend(403, { success: false, error: { error_code: 'HTTP_403', details: { error: 'FEATURE_DISABLED', feature: 'coding_test' } } });
    await expect(httpClient.post('/coding-test/sessions', {})).rejects.toBeTruthy();
    off();
    expect(heard).not.toHaveBeenCalled();
  });
});
