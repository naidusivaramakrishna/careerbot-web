import { describe, it, expect, vi, afterEach } from 'vitest'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/http', () => ({ httpClient: http }))
vi.mock('@/lib/logger', () => ({ default: { error: vi.fn(), info: vi.fn() } }))

import {
  localDateToUtcIso, listAdminTickets, exportAdminTickets, getTicketDetails, updateTicketStatus,
  updateTicketPriority, assignTicket, sendTicketReply, escalateTicket, resolveTicket, closeTicket,
} from './adminTicketApi'

afterEach(() => {
  vi.clearAllMocks()
})

// These assertions hold in whatever timezone the tests run in: the result must
// be the UTC instant of *local* midnight, not of UTC midnight.
const expectLocalMidnight = (iso: string, y: number, m: number, d: number) => {
  const t = new Date(iso)
  expect([t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()]).toEqual([y, m, d, 0, 0, 0])
}

describe('localDateToUtcIso', () => {
  it('returns the UTC instant of local midnight on the date', () => {
    const iso = localDateToUtcIso('2026-10-26')
    expect(iso).toMatch(/Z$/)
    expectLocalMidnight(iso, 2026, 10, 26)
  })

  it('dayOffset 1 gives local midnight of the following day (exclusive end)', () => {
    expectLocalMidnight(localDateToUtcIso('2026-10-26', 1), 2026, 10, 27)
  })

  it('rolls over month and year ends', () => {
    expectLocalMidnight(localDateToUtcIso('2026-10-31', 1), 2026, 11, 1)
    expectLocalMidnight(localDateToUtcIso('2026-12-31', 1), 2027, 1, 1)
  })

  it('a one-day range spans exactly one local calendar day', () => {
    const start = new Date(localDateToUtcIso('2026-10-26')).getTime()
    const end = new Date(localDateToUtcIso('2026-10-26', 1)).getTime()
    expect(end - start).toBeGreaterThanOrEqual(23 * 3600_000)
    expect(end - start).toBeLessThanOrEqual(25 * 3600_000)
  })

  it('leaves non-date input untouched', () => {
    expect(localDateToUtcIso('')).toBe('')
    expect(localDateToUtcIso('2026-10-26T00:00:00Z')).toBe('2026-10-26T00:00:00Z')
  })
})

describe('request construction', () => {
  it('list sends the local-day range as UTC instants with an exclusive end', async () => {
    http.get.mockResolvedValue({ data: {} })
    await listAdminTickets({ page: 1, page_size: 10, status: 'open', date_from: '2026-10-26', date_to: '2026-10-26' })
    const params = new URL(http.get.mock.calls[0][0], 'http://x').searchParams
    expect(params.get('date_from')).toBe(localDateToUtcIso('2026-10-26'))
    expect(params.get('date_to')).toBe(localDateToUtcIso('2026-10-26', 1))
    expect(params.get('status')).toBe('open')
    expect(params.get('page_size')).toBe('10')
  })

  it('export uses the same boundaries and omits pagination', async () => {
    http.get.mockResolvedValue({ data: new Blob() })
    await exportAdminTickets({ page: 3, page_size: 50, date_from: '2026-10-26', date_to: '2026-10-27', priority: 'urgent' })
    const params = new URL(http.get.mock.calls[0][0], 'http://x').searchParams
    expect(params.get('date_from')).toBe(localDateToUtcIso('2026-10-26'))
    expect(params.get('date_to')).toBe(localDateToUtcIso('2026-10-27', 1))
    expect(params.get('priority')).toBe('urgent')
    expect(params.has('page')).toBe(false)
    expect(params.has('page_size')).toBe(false)
  })

  it('sends no date params when no dates are picked', async () => {
    http.get.mockResolvedValue({ data: {} })
    await listAdminTickets({ page: 1 })
    expect(http.get.mock.calls[0][0]).toBe('/admin/api/v1/tickets?page=1')
  })
})

describe('ticket id in the URL', () => {
  it('is URL-encoded on every per-ticket route', async () => {
    http.get.mockResolvedValue({ data: {} })
    http.patch.mockResolvedValue({ data: {} })
    http.post.mockResolvedValue({ data: {} })
    const id = 'CB 1/../x?y#z'
    const enc = encodeURIComponent(id)
    await getTicketDetails(id)
    await updateTicketStatus(id, 'open')
    await updateTicketPriority(id, 'urgent')
    await assignTicket(id, 'a@example.com')
    await sendTicketReply(id, 'hi')
    await escalateTicket(id, 'why')
    await resolveTicket(id, 'done')
    await closeTicket(id, 'dup')
    const urls = [...http.get.mock.calls, ...http.patch.mock.calls, ...http.post.mock.calls].map((c) => c[0])
    expect(urls.sort()).toEqual([
      `/admin/api/v1/tickets/${enc}`,
      `/admin/api/v1/tickets/${enc}/assign`,
      `/admin/api/v1/tickets/${enc}/close`,
      `/admin/api/v1/tickets/${enc}/escalate`,
      `/admin/api/v1/tickets/${enc}/priority`,
      `/admin/api/v1/tickets/${enc}/reply`,
      `/admin/api/v1/tickets/${enc}/resolve`,
      `/admin/api/v1/tickets/${enc}/status`,
    ].sort())
  })

  it('leaves a normal ticket id unchanged (control)', async () => {
    http.get.mockResolvedValue({ data: {} })
    await getTicketDetails('CB-00001')
    expect(http.get.mock.calls[0][0]).toBe('/admin/api/v1/tickets/CB-00001')
  })
})
