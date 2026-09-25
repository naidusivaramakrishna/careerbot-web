/**
 * useCatalogues must request careerbot-api's catalogue list at the path the
 * backend serves: GET /api/v1/templates/catalogues/all
 * (careerbot-api develop2 app/api/v1/endpoints/templates.py:623-624, router
 * mounted under /api/v1/templates).
 *
 * httpClient already carries baseURL '/api/v1' (src/lib/http.ts:16-17,101),
 * so the hook's path must be relative to it. The real axios instance runs;
 * the stub adapter answers only the backend's real path and 404s anything
 * else, as the backend would.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import axios, { AxiosError } from 'axios';
import httpClient from '@/lib/http';
import { useCatalogues } from '@/hooks/useCatalogues';

const BACKEND_PATH = '/api/v1/templates/catalogues/all';
const requested: string[] = [];
const originalAdapter = httpClient.defaults.adapter;

const eclipse = { key: 'eclipse', label: 'Eclipse', template_id: 'classic_formal' };

const fakeAdapter: AxiosAdapter = async (config) => {
  const uri = axios.getUri(config);
  requested.push(uri);
  const path = new URL(uri, 'http://localhost').pathname;
  const ok = path === BACKEND_PATH;
  const response: AxiosResponse = {
    data: ok ? [eclipse] : { detail: 'Not Found' },
    status: ok ? 200 : 404,
    statusText: ok ? 'OK' : 'Not Found',
    headers: {},
    config,
  };
  if (ok) return response;
  throw new AxiosError('Request failed with status code 404', AxiosError.ERR_BAD_REQUEST, config, null, response);
};

describe('useCatalogues', () => {
  beforeEach(() => {
    requested.length = 0;
    localStorage.clear();
    httpClient.defaults.adapter = fakeAdapter;
  });
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('requests /api/v1/templates/catalogues/all exactly once, without a doubled /api/v1 prefix', async () => {
    const { result } = renderHook(() => useCatalogues());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(requested).toHaveLength(1);
    expect(requested[0]).not.toContain('/api/v1/api/v1');
    expect(new URL(requested[0], 'http://localhost').pathname).toBe(BACKEND_PATH);
  });

  it('loads the catalogues the backend returns', async () => {
    const { result } = renderHook(() => useCatalogues());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.getCataloguesMap().eclipse?.template_id).toBe('classic_formal');
  });
});

/**
 * The 24h cache in localStorage is not trusted input: earlier builds of this
 * hook (74f73bd, 44ddab0) wrote whatever the response body was to the same
 * 'catalogues_cache' key without checking it, and storage can hold anything.
 * A cached value that is not an array of catalogue objects must be ignored
 * (and the list fetched fresh), not handed to getCataloguesMap(), whose
 * `catalogues.forEach` runs during PreviewPanel's render.
 */
describe('useCatalogues cache validation', () => {
  beforeEach(() => {
    requested.length = 0;
    localStorage.clear();
    httpClient.defaults.adapter = fakeAdapter;
  });
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  const plant = (data: unknown) =>
    localStorage.setItem('catalogues_cache', JSON.stringify({ data, timestamp: Date.now() }));

  it.each([
    ['a wrapper object', { catalogues: [eclipse] }],
    ['null', null],
    ['an array holding a non-object', [null]],
    ['an array holding an object without a key', [{ label: 'x' }]],
  ])('ignores a fresh cache holding %s and fetches instead', async (_label, data) => {
    plant(data);
    const { result } = renderHook(() => useCatalogues());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(() => result.current.getCataloguesMap()).not.toThrow();
    expect(requested).toHaveLength(1);
    expect(result.current.getCataloguesMap().eclipse?.template_id).toBe('classic_formal');
    // The bad entry is replaced by the fetched list.
    expect(JSON.parse(localStorage.getItem('catalogues_cache') as string).data).toEqual([eclipse]);
  });

  it('still serves a valid fresh cache without a request', async () => {
    plant([eclipse]);
    const { result } = renderHook(() => useCatalogues());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(requested).toHaveLength(0);
    expect(result.current.getCataloguesMap().eclipse?.template_id).toBe('classic_formal');
  });
});
