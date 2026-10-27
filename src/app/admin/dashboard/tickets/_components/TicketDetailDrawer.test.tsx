import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const api = vi.hoisted(() => ({
  getTicketDetails: vi.fn(),
  assignTicket: vi.fn(),
  updateTicketStatus: vi.fn(),
  updateTicketPriority: vi.fn(),
  sendTicketReply: vi.fn(),
  resolveTicket: vi.fn(),
  closeTicket: vi.fn(),
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() }, default: { error: vi.fn(), info: vi.fn() } }))
vi.mock('@/api/adminTicketApi', async () => {
  const actual = await vi.importActual<typeof import('@/api/adminTicketApi')>('@/api/adminTicketApi').catch(() => ({}))
  return {
    ...actual,
    ...api,
    getApiErrorMessage: (e: { response?: { data?: { detail?: string } } }, fallback: string) =>
      e?.response?.data?.detail ?? fallback,
  }
})

import TicketDetailDrawer from './TicketDetailDrawer'

const staff = [
  { id: '1', email: 'alice@example.com', full_name: 'Alice', role: 'support' },
  { id: '2', email: 'bob@example.com', full_name: 'Bob', role: 'admin' },
]
const ticket = {
  ticket_id: 'CB-00001', subject: 'Cannot pay', description: 'Payment failed', category: 'payments',
  priority: 'normal', status: 'open', requester_name: 'Sam', requester_email: 'sam@example.com',
  requester_type: 'student', assigned_to: undefined, created_at: '2026-10-20T10:00:00Z',
  updated_at: '2026-10-20T10:00:00Z', replies: [], activity_log: [], attachment_count: 0,
}

const renderDrawer = (onChanged = vi.fn()) => {
  render(<TicketDetailDrawer ticketId="CB-00001" staff={staff} onClose={vi.fn()} onChanged={onChanged} />)
  return onChanged
}

describe('TicketDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getTicketDetails.mockResolvedValue({ ...ticket })
    Object.values(api).forEach((fn) => fn !== api.getTicketDetails && fn.mockResolvedValue(undefined))
  })

  it('loads and shows the ticket', async () => {
    renderDrawer()
    expect(await screen.findByText('Payment failed')).toBeInTheDocument()
    expect(api.getTicketDetails).toHaveBeenCalledWith('CB-00001')
  })

  it('shows an error with retry when loading fails', async () => {
    api.getTicketDetails.mockRejectedValueOnce(new Error('boom'))
    renderDrawer()
    expect(await screen.findByText('Failed to load ticket details')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retry'))
    expect(await screen.findByText('Payment failed')).toBeInTheDocument()
  })

  it('assigns a staff member, toasts, and asks the page to refresh', async () => {
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    fireEvent.change(screen.getByLabelText('Assigned to'), { target: { value: 'alice@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
    await waitFor(() => expect(api.assignTicket).toHaveBeenCalledWith('CB-00001', 'alice@example.com'))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ticket assigned'))
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  it('updates status and priority', async () => {
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'waiting_user' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0])
    await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith('CB-00001', 'waiting_user'))
    // The status write, its onChanged and the drawer reload must finish (busy
    // cleared) before the priority step; otherwise the controls are still
    // disabled and the reload can reset the picked priority.
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByLabelText('Priority')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'urgent' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[1])
    await waitFor(() => expect(api.updateTicketPriority).toHaveBeenCalledWith('CB-00001', 'urgent'))
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(2))
  }, 15_000) // two full write + reload cycles; ~2.5-3.7 s alone on a loaded host, over 5 s on CI

  it('does not offer Cancelled as a status', async () => {
    renderDrawer()
    await screen.findByText('Payment failed')
    expect(screen.queryByRole('option', { name: /cancel/i })).toBeNull()
  })

  it('does not offer Resolved or Closed in the status dropdown (they need a summary or reason)', async () => {
    renderDrawer()
    await screen.findByText('Payment failed')
    const options = Array.from((screen.getByLabelText('Status') as HTMLSelectElement).options).map((o) => o.value)
    expect(options).toEqual(['open', 'in_progress', 'waiting_user'])
  })

  it('shows a resolved ticket\'s current status and can still reopen it from the dropdown', async () => {
    api.getTicketDetails.mockResolvedValue({ ...ticket, status: 'resolved' })
    renderDrawer()
    await screen.findByText('Payment failed')
    const select = screen.getByLabelText('Status') as HTMLSelectElement
    expect(select.value).toBe('resolved')
    fireEvent.change(select, { target: { value: 'open' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0])
    await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith('CB-00001', 'open'))
  })

  it.each([
    ['status', async () => {
      fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in_progress' } })
      fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0])
    }, () => api.updateTicketStatus],
    ['resolve', async () => {
      fireEvent.change(screen.getByPlaceholderText('Resolution summary'), { target: { value: 'Refunded' } })
      fireEvent.click(screen.getByRole('button', { name: 'Resolve' }))
    }, () => api.resolveTicket],
    ['close', async () => {
      fireEvent.change(screen.getByPlaceholderText('Reason for closing'), { target: { value: 'Duplicate' } })
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    }, () => api.closeTicket],
  ])('on a 409 from %s: shows the server message, reloads the ticket and refreshes the page', async (_name, act, fn) => {
    const detail = "Ticket CB-00001 changed to 'cancelled' in the meantime; reload it and try again"
    fn().mockRejectedValueOnce({ response: { status: 409, data: { detail } } })
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    expect(api.getTicketDetails).toHaveBeenCalledTimes(1)
    api.getTicketDetails.mockResolvedValue({ ...ticket, status: 'cancelled' })
    await act()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(detail))
    await waitFor(() => expect(api.getTicketDetails).toHaveBeenCalledTimes(2))
    await waitFor(() => expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('cancelled'))
    expect(onChanged).toHaveBeenCalledTimes(1)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('does not reload on a non-409 failure (control)', async () => {
    api.updateTicketStatus.mockRejectedValueOnce({ response: { status: 500, data: { detail: 'Failed to update ticket status' } } })
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in_progress' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0])
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update ticket status'))
    expect(api.getTicketDetails).toHaveBeenCalledTimes(1)
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('shows a reload failure even while the earlier ticket data is still on screen', async () => {
    renderDrawer()
    await screen.findByText('Payment failed')
    api.getTicketDetails.mockRejectedValueOnce(new Error('boom'))
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in_progress' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0])
    expect(await screen.findByText('Failed to load ticket details')).toBeInTheDocument()
    expect(screen.getByText('Payment failed')).toBeInTheDocument()
  })

  it('shows the reason of an activity entry and the captured chatbot answer', async () => {
    api.getTicketDetails.mockResolvedValue({
      ...ticket,
      chatbot_answer: 'Try another card',
      activity_log: [{ timestamp: '2026-10-21T10:00:00Z', action: 'closed', field: 'status', old_value: 'open', new_value: 'closed', changed_by: 'alice@example.com', reason: 'Duplicate of CB-00002' }],
    })
    renderDrawer()
    await screen.findByText('Payment failed')
    expect(screen.getByText(/Duplicate of CB-00002/)).toBeInTheDocument()
    expect(screen.getByText(/Try another card/)).toBeInTheDocument()
  })

  it('shows the server error message and does not refresh when an update fails', async () => {
    api.assignTicket.mockRejectedValueOnce({ response: { data: { detail: "'x' is not an active staff member" } } })
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    fireEvent.change(screen.getByLabelText('Assigned to'), { target: { value: 'bob@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("'x' is not an active staff member"))
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('resolves with a summary', async () => {
    const onChanged = renderDrawer()
    await screen.findByText('Payment failed')
    const resolve = screen.getByRole('button', { name: 'Resolve' })
    expect(resolve).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Resolution summary'), { target: { value: 'Refunded' } })
    fireEvent.click(resolve)
    await waitFor(() => expect(api.resolveTicket).toHaveBeenCalledWith('CB-00001', 'Refunded'))
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
  })
})
