/**
 * useSystemMonitoring — system-log requests.
 *
 * Up to three log requests can be in flight at once (the 500ms-debounced
 * filter fetch, the manual Refresh and the 30s auto-refresh), and they can
 * resolve in any order. Only the most recently started request may update the
 * table; an older response must not overwrite it, and a failed request must
 * not leave the previous filter's rows on screen under the new filters.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { SystemLogsResponse } from '@/api/adminMonitoringApi';
import type { LogsFilters } from '@/app/admin/dashboard/system-monitoring/hooks/useSystemMonitoring';

const mockGetSystemLogs = vi.fn();

vi.mock('@/api/adminMonitoringApi', () => ({
  getSystemOverview: vi.fn(() => Promise.resolve({})),
  getApiRequestMetrics: vi.fn(() => Promise.resolve({})),
  getCpuUsage: vi.fn(() => Promise.resolve({})),
  getMemoryUsage: vi.fn(() => Promise.resolve({})),
  getSystemLogs: (...args: unknown[]) => mockGetSystemLogs(...args),
}));

vi.mock('@/lib/logger', () => {
  const l = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { logger: l, default: l };
});

import { useSystemMonitoring } from '@/app/admin/dashboard/system-monitoring/hooks/useSystemMonitoring';

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const logsResponse = (message: string): SystemLogsResponse => ({
  logs: [{ id: message, message, level: 'CRITICAL', source: 'System', timestamp: '2026-09-25T00:00:00Z' }],
  total: 1,
  page: 1,
  page_size: 10,
  total_pages: 1,
} as SystemLogsResponse);

const noFilters: LogsFilters = { level: '', source: '', search: '', startDate: '', endDate: '' };

const renderMonitoring = (initial: LogsFilters) =>
  renderHook(({ logsFilters }: { logsFilters: LogsFilters }) =>
    useSystemMonitoring({
      activeTab: 'Today',
      apiShowComparison: false,
      cpuShowComparison: false,
      memoryShowComparison: false,
      autoRefresh: 'Off',
      logsFilters,
    }), { initialProps: { logsFilters: initial } });

describe('useSystemMonitoring — log requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the newest filter results when an older request resolves last', async () => {
    const first = deferred<SystemLogsResponse>();
    const second = deferred<SystemLogsResponse>();
    mockGetSystemLogs.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const searchOnly = { ...noFilters, search: 'timeout' };
    const { result, rerender } = renderMonitoring(searchOnly);
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(mockGetSystemLogs).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'timeout' }));

    rerender({ logsFilters: { ...searchOnly, level: 'CRITICAL' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(mockGetSystemLogs).toHaveBeenCalledTimes(2);
    expect(mockGetSystemLogs).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'timeout', level: 'CRITICAL' }));

    await act(async () => { second.resolve(logsResponse('critical + timeout')); });
    await act(async () => { first.resolve(logsResponse('timeout only')); });

    expect(result.current.systemLogs?.logs.map((l) => l.message)).toEqual(['critical + timeout']);
  });

  it('does not show the previous filter results when the new request fails', async () => {
    mockGetSystemLogs
      .mockResolvedValueOnce(logsResponse('unfiltered'))
      .mockRejectedValueOnce(new Error('422 bad date'));

    const { result, rerender } = renderMonitoring(noFilters);
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.systemLogs?.logs.map((l) => l.message)).toEqual(['unfiltered']);
    expect(result.current.logsError).toBeNull();

    rerender({ logsFilters: { ...noFilters, startDate: '2026-09-01' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(result.current.systemLogs?.logs).toEqual([]);
    expect(result.current.logsError).toBe('Failed to load logs. Please try again.');
  });

  it('ignores a stale failure that arrives after a newer request succeeded', async () => {
    const first = deferred<SystemLogsResponse>();
    mockGetSystemLogs.mockReturnValueOnce(first.promise).mockResolvedValueOnce(logsResponse('newer'));

    const { result, rerender } = renderMonitoring({ ...noFilters, search: 'a' });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    rerender({ logsFilters: { ...noFilters, search: 'ab' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    await act(async () => { first.reject(new Error('timeout')); });

    expect(result.current.systemLogs?.logs.map((l) => l.message)).toEqual(['newer']);
    expect(result.current.logsError).toBeNull();
  });
});

describe('SystemLogsSection — failed logs request', () => {
  it('shows the error instead of "No logs available"', async () => {
    const { render, screen } = await import('@testing-library/react');
    const React = await import('react');
    const { SystemLogsSection } = await import(
      '@/app/admin/dashboard/system-monitoring/_components/SystemLogsSection'
    );
    render(React.createElement(SystemLogsSection, {
      logs: [],
      error: 'Failed to load logs. Please try again.',
      filters: noFilters,
      onFiltersChange: vi.fn(),
    }));
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load logs. Please try again.');
    expect(screen.queryByText('No logs available')).not.toBeInTheDocument();
  });
});
