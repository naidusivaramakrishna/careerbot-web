/**
 * addUserCredits through the REAL httpClient (src/lib/http.ts) with a fake
 * axios adapter. Every interceptor path in http.ts that can REPLAY a POST
 * must replay it with the SAME Idempotency-Key, otherwise the backend could
 * apply the grant twice:
 *   1. 401 -> admin token refresh -> replay
 *   2. 500 plain-text "backend crash" -> treated as auth failure -> refresh -> replay
 *   3. 500/503 AI_SERVICE_UNAVAILABLE -> delayed automatic retry
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { httpClient } from '@/lib/http';
import { addUserCredits } from '@/api/adminCreditsApi';

interface Seen { url: string; method: string; key: string | undefined; body: unknown }

const seen: Seen[] = [];
const originalAdapter = httpClient.defaults.adapter;

const respond = (config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse => ({
    data, status, statusText: String(status), headers: {}, config,
});

const fail = (config: InternalAxiosRequestConfig, status: number, data: unknown): never => {
    throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, null, respond(config, status, data));
};

const ok = { message: 'ok', user_id: 'u-1', credits_added: 10, previous_balance: 40, new_balance: 50, idempotent_replay: false };

/** Adapter: first add-credits call fails with `firstFailure`, later ones succeed; refresh always succeeds. */
const makeAdapter = (firstFailure: { status: number; data: unknown }): AxiosAdapter => async (config) => {
    const url = config.url ?? '';
    const headers = config.headers as unknown as { get?: (k: string) => unknown; [k: string]: unknown };
    const key = (headers.get?.('Idempotency-Key') ?? headers['Idempotency-Key']) as string | undefined;
    seen.push({
        url,
        method: (config.method ?? '').toLowerCase(),
        key,
        body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    });
    if (url.includes('/admin/auth/refresh')) return respond(config, 200, { success: true });
    if (url.includes('/add-credits')) {
        const attempts = seen.filter((s) => s.url.includes('/add-credits')).length;
        if (attempts === 1) return fail(config, firstFailure.status, firstFailure.data);
        return respond(config, 200, ok);
    }
    return fail(config, 404, { detail: 'Not Found' });
};

const grantCalls = () => seen.filter((s) => s.url.includes('/add-credits'));

beforeEach(() => {
    seen.length = 0;
    localStorage.clear();
    sessionStorage.clear();
});

afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    vi.useRealTimers();
});

describe('add-credits replay through the real http client keeps the Idempotency-Key', () => {
    it('401 -> admin refresh -> replay uses the SAME key and body', async () => {
        httpClient.defaults.adapter = makeAdapter({ status: 401, data: { success: false, error: { message: 'expired' } } });

        const res = await addUserCredits('u-1', { credits: 10, reason: ' Goodwill ' }, 'key-xyz');

        expect(res.new_balance).toBe(50);
        expect(seen.map((s) => s.url)).toEqual([
            '/admin/quota/user/u-1/add-credits',
            '/api/backend/admin/auth/refresh', // admin refresh path, not the user one
            '/admin/quota/user/u-1/add-credits',
        ]);
        expect(grantCalls().map((c) => c.key)).toEqual(['key-xyz', 'key-xyz']);
        expect(grantCalls().map((c) => c.body)).toEqual([
            { credits: 10, reason: 'Goodwill' },
            { credits: 10, reason: 'Goodwill' },
        ]);
    });

    it('500 plain-text crash -> refresh -> replay uses the SAME key', async () => {
        httpClient.defaults.adapter = makeAdapter({ status: 500, data: 'Internal Server Error' });

        await addUserCredits('u-1', { credits: 10, reason: 'Goodwill' }, 'key-crash');

        expect(grantCalls()).toHaveLength(2);
        expect(grantCalls().map((c) => c.key)).toEqual(['key-crash', 'key-crash']);
    });

    it('503 AI_SERVICE_UNAVAILABLE automatic retry uses the SAME key', async () => {
        vi.useFakeTimers();
        httpClient.defaults.adapter = makeAdapter({
            status: 503,
            data: { success: false, error: { message: 'down', error_code: 'AI_SERVICE_UNAVAILABLE' } },
        });

        const p = addUserCredits('u-1', { credits: 10, reason: 'Goodwill' }, 'key-ai');
        await vi.advanceTimersByTimeAsync(2500); // first AI retry waits 2s
        await p;

        expect(grantCalls()).toHaveLength(2);
        expect(grantCalls().map((c) => c.key)).toEqual(['key-ai', 'key-ai']);
    });

    it('a contract 500 (CREDIT_GRANT_FAILED, JSON envelope) is NOT auto-replayed by the client', async () => {
        httpClient.defaults.adapter = makeAdapter({
            status: 500,
            data: { success: false, error: { message: 'failed', error_code: 'CREDIT_GRANT_FAILED', details: { grant_id: 'g' } } },
        });

        await expect(addUserCredits('u-1', { credits: 10, reason: 'Goodwill' }, 'key-f')).rejects.toBeInstanceOf(AxiosError);
        expect(grantCalls()).toHaveLength(1);
    });
});
