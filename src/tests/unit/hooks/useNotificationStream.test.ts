/**
 * useNotificationStream: a stream that errors is CLOSED before the hook's own
 * backoff reconnect, so exactly one EventSource is open per tab. Before the
 * fix the errored source was only dereferenced; the browser kept
 * auto-reconnecting it while the timer opened another (ADO 2818).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

interface FakeSource { close: ReturnType<typeof vi.fn>; fireError: () => void; fireOpen: () => void }

const sources = vi.hoisted(() => [] as FakeSource[]);
vi.mock('@/api/notificationsApi', () => ({
  subscribeToNotifications: (_userId: string, _onNotification: unknown, onError?: (e: Event) => void) => {
    const listeners: Record<string, () => void> = {};
    const source = {
      close: vi.fn(),
      addEventListener: (type: string, fn: () => void) => { listeners[type] = fn; },
      fireError: () => onError?.(new Event('error')),
      fireOpen: () => listeners.open?.(),
    };
    sources.push(source);
    return source;
  },
  getNotifications: vi.fn().mockResolvedValue({ items: [], unread_count: 0 }),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

import { useNotificationStream } from '@/hooks/useNotificationStream';

async function mountConnected() {
  const view = renderHook(() => useNotificationStream());
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(sources).toHaveLength(1);
  return view;
}

describe('useNotificationStream reconnect', () => {
  beforeEach(() => {
    sources.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user_id: 'u1' }) }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('closes the errored source before opening a new one', async () => {
    const { result } = await mountConnected();

    act(() => sources[0].fireError());
    expect(sources[0].close).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(sources).toHaveLength(2);
    expect(sources[1].close).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
  });

  it('ignores a late error from a source that is no longer current', async () => {
    await mountConnected();

    act(() => sources[0].fireError());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(sources).toHaveLength(2);

    // A second error from the old source must not drop the live one or
    // schedule another reconnect.
    act(() => sources[0].fireError());
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(sources).toHaveLength(2);
    expect(sources[1].close).not.toHaveBeenCalled();
  });

  it('stops after the max reconnect attempts with every source closed', async () => {
    await mountConnected();

    for (let i = 0; i < 10; i++) {
      act(() => sources[sources.length - 1].fireError());
      act(() => { vi.advanceTimersByTime(5000 * 2 ** 6); });
    }
    expect(sources).toHaveLength(6); // first connect + 5 reconnects
    sources.forEach((s) => expect(s.close).toHaveBeenCalled());
  });

  it('waits the backoff delay before reconnecting', async () => {
    await mountConnected();

    act(() => sources[0].fireError());
    act(() => { vi.advanceTimersByTime(4999); });
    expect(sources).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1); });
    expect(sources).toHaveLength(2);

    act(() => sources[1].fireError());
    act(() => { vi.advanceTimersByTime(9999); });
    expect(sources).toHaveLength(2);
    act(() => { vi.advanceTimersByTime(1); });
    expect(sources).toHaveLength(3);
  });

  it('starts the backoff over after a stream that stayed open', async () => {
    await mountConnected();
    for (let i = 0; i < 5; i++) {
      act(() => sources[sources.length - 1].fireError());
      act(() => { vi.advanceTimersByTime(5000 * 2 ** 6); });
    }
    expect(sources).toHaveLength(6); // all 5 attempts used

    act(() => sources[5].fireOpen());
    act(() => { vi.advanceTimersByTime(60_000); });
    act(() => sources[5].fireError());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(sources).toHaveLength(7);
  });

  it('keeps climbing for a stream evicted right after it opened', async () => {
    await mountConnected();
    for (let i = 0; i < 10; i++) {
      const s = sources[sources.length - 1];
      act(() => s.fireOpen());
      act(() => { vi.advanceTimersByTime(1000); });
      act(() => s.fireError());
      act(() => { vi.advanceTimersByTime(5000 * 2 ** 6); });
    }
    expect(sources).toHaveLength(6);
  });

  it('does not open a stream when unmounted while the token is in flight', async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolveFetch = r; })));
    const { unmount } = renderHook(() => useNotificationStream());
    unmount();
    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ user_id: 'u1' }) });
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    });
    expect(sources).toHaveLength(0);
  });

  it('closes the open source on unmount', async () => {
    const { unmount } = await mountConnected();
    unmount();
    expect(sources[0].close).toHaveBeenCalledTimes(1);
  });
});
