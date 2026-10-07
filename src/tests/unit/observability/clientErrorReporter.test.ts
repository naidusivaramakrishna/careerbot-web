/**
 * Browser side: ChunkLoadError detection and per-page caps.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  MAX_REPORTS_PER_KIND,
  MAX_REPORTS_PER_PAGE,
  createClientErrorSender,
} from '@/components/ClientErrorReporter';
import { classifyClientError, isChunkLoadError } from '@/lib/observability/clientErrorKind';

describe('classifyClientError', () => {
  it('detects ChunkLoadError by name and by message', () => {
    const named = Object.assign(new Error('Loading chunk 123 failed.'), { name: 'ChunkLoadError' });
    expect(classifyClientError('unhandledrejection', named)).toBe('chunk_load');
    expect(classifyClientError('error', new Error('Loading CSS chunk 7 failed.'))).toBe('chunk_load');
    expect(
      classifyClientError('unhandledrejection', new TypeError('Failed to fetch dynamically imported module: /x.js')),
    ).toBe('chunk_load');
    expect(classifyClientError('error', null, 'Uncaught ChunkLoadError: Loading chunk app-pages failed')).toBe('chunk_load');
    expect(isChunkLoadError('Importing a module script failed.')).toBe(true);
  });

  it('falls back to js_error / unhandled_rejection', () => {
    expect(classifyClientError('error', new TypeError('x is undefined'))).toBe('js_error');
    expect(classifyClientError('error', undefined, 'Script error.')).toBe('js_error');
    expect(classifyClientError('unhandledrejection', 'nope')).toBe('unhandled_rejection');
    expect(classifyClientError('unhandledrejection', undefined)).toBe('unhandled_rejection');
  });
});

describe('createClientErrorSender', () => {
  it('sends only {kind} and caps per kind and per page', () => {
    const send = vi.fn();
    const report = createClientErrorSender(send);
    for (let i = 0; i < 10; i++) report('js_error');
    expect(send).toHaveBeenCalledTimes(MAX_REPORTS_PER_KIND);
    expect(send).toHaveBeenCalledWith('{"kind":"js_error"}');

    for (let i = 0; i < 10; i++) {
      report('unhandled_rejection');
      report('chunk_load');
    }
    expect(send.mock.calls.length).toBeLessThanOrEqual(MAX_REPORTS_PER_PAGE);
    expect(send.mock.calls.every(([b]) => Object.keys(JSON.parse(b)).join() === 'kind')).toBe(true);
  });
});
