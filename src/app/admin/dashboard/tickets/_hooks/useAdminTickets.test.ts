import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({
  getTicketStats: vi.fn(),
  listAdminTickets: vi.fn(),
  getAssignableStaff: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() }, default: { error: vi.fn(), info: vi.fn() } }))
vi.mock('@/api/adminTicketApi', () => ({
  ...api,
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}))

import { useAdminTickets } from './useAdminTickets'

const page = (id: string) => ({ page: 1, page_size: 10, total_records: 1, total_pages: 1, tickets: [{ ticket_id: id }] })
const deferred = <T,>() => {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

describe('useAdminTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getTicketStats.mockResolvedValue({ total: 1, open: 1, in_progress: 0, waiting_user: 0, resolved: 0, closed: 0, urgent: 0 })
    api.getAssignableStaff.mockResolvedValue([])
  })

  it('ignores a slow, older list response that arrives after a newer one', async () => {
    const first = deferred<ReturnType<typeof page>>()   // initial (unfiltered) request: slow
    const second = deferred<ReturnType<typeof page>>()  // filtered request: finishes first
    api.listAdminTickets.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result } = renderHook(() => useAdminTickets())
    act(() => result.current.setFilters({ ...result.current.filters, assigned_to: 'a@example.com' }))
    await waitFor(() => expect(api.listAdminTickets).toHaveBeenCalledTimes(2))

    await act(async () => { second.resolve(page('FILTERED')) })
    await waitFor(() => expect(result.current.tickets?.tickets[0].ticket_id).toBe('FILTERED'))

    await act(async () => { first.resolve(page('STALE-UNFILTERED')) })
    expect(result.current.tickets?.tickets[0].ticket_id).toBe('FILTERED')
    expect(result.current.isLoading).toBe(false)
  })

  it('loads stats once and does not refetch them when filters change', async () => {
    api.listAdminTickets.mockResolvedValue(page('X'))
    const { result } = renderHook(() => useAdminTickets())
    await waitFor(() => expect(result.current.stats).not.toBeNull())
    act(() => result.current.setFilters({ ...result.current.filters, status: 'open' }))
    await waitFor(() => expect(api.listAdminTickets).toHaveBeenCalledTimes(2))
    expect(api.getTicketStats).toHaveBeenCalledTimes(1)
  })

  it('moves back to the last page when the current page no longer exists (e.g. its last row was closed)', async () => {
    api.listAdminTickets.mockImplementation(async (f: { page?: number }) =>
      ({ page: f.page, page_size: 10, total_records: 11, total_pages: 2, tickets: f.page === 2 ? [{ ticket_id: 'LAST' }] : [] }))
    const { result } = renderHook(() => useAdminTickets())
    act(() => result.current.setFilters({ ...result.current.filters, page: 3 }))
    await waitFor(() => expect(result.current.filters.page).toBe(2))
    await waitFor(() => expect(result.current.tickets?.tickets[0]?.ticket_id).toBe('LAST'))
  })

  it('stays on page 1 when there are no results at all (control)', async () => {
    api.listAdminTickets.mockResolvedValue({ page: 1, page_size: 10, total_records: 0, total_pages: 0, tickets: [] })
    const { result } = renderHook(() => useAdminTickets())
    await waitFor(() => expect(result.current.tickets).not.toBeNull())
    expect(result.current.filters.page).toBe(1)
    expect(api.listAdminTickets).toHaveBeenCalledTimes(1)
  })

  it('keeps previous counts and reports an error when a stats refresh fails (no fake zeros)', async () => {
    api.listAdminTickets.mockResolvedValue(page('X'))
    const { result } = renderHook(() => useAdminTickets())
    await waitFor(() => expect(result.current.stats?.total).toBe(1))
    api.getTicketStats.mockRejectedValueOnce(new Error('boom'))
    await act(async () => { await result.current.refreshStats() })
    expect(result.current.stats?.total).toBe(1)
    expect(result.current.statsError).toBeTruthy()
  })
})
