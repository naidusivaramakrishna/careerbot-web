"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  TicketDetailResponse,
  StaffMember,
  getTicketDetails,
  assignTicket,
  updateTicketStatus,
  updateTicketPriority,
  sendTicketReply,
  resolveTicket,
  closeTicket,
  getApiErrorMessage,
} from '@/api/adminTicketApi'
import { logger } from '@/lib/logger'

interface TicketDetailDrawerProps {
  ticketId: string
  staff: StaffMember[]
  staffError?: string | null
  onClose: () => void
  /** Called after any successful change so the list and the dashboard counts can refresh. */
  onChanged: () => void
}

// Statuses an admin may set. "Cancelled" is a user-side action, so it is not offered.
// Resolved and Closed are set with the Resolve / Close actions below, which
// record the required resolution summary or closing reason; the dropdown would
// set them without one. A ticket already in either state still shows it.
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_user', label: 'Waiting for User' },
]
const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
]

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50'
const btnClass =
  'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
const sectionTitle = 'text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'

const fmt = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString()
}

const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({ ticketId, staff, staffError, onClose, onChanged }) => {
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [assignee, setAssignee] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [resolution, setResolution] = useState('')
  const [closingReason, setClosingReason] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const data = await getTicketDetails(ticketId)
      setTicket(data)
      setAssignee(data.assigned_to ?? '')
      setStatus(data.status)
      setPriority(data.priority)
    } catch (err) {
      logger.error('Failed to load ticket details:', err)
      setLoadError(getApiErrorMessage(err, 'Failed to load ticket details'))
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Runs one write, then refreshes this drawer and (via onChanged) the list + cards.
  const run = async (key: string, action: () => Promise<void>, success: string, after?: () => void) => {
    try {
      setBusy(key)
      await action()
      toast.success(success)
      after?.()
      onChanged()
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
      // 409: the ticket changed in the meantime (e.g. the user cancelled it).
      // The server's message says to reload; do that here and refresh the list.
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        onChanged()
        await load()
      }
    } finally {
      setBusy(null)
    }
  }

  const assigneeKnown = !assignee || staff.some((s) => s.email === assignee)
  const closed = ticket?.status === 'closed'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ticket details">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{ticketId}</p>
            <p className="text-xs text-gray-500 truncate">{ticket?.subject}</p>
          </div>
          <button onClick={onClose} aria-label="Close details" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && !ticket ? (
          <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading ticket...
          </div>
        ) : loadError && !ticket ? (
          <div className="p-5">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">{loadError}</p>
              <button onClick={() => void load()} className="text-sm font-medium text-red-700 underline">Retry</button>
            </div>
          </div>
        ) : ticket ? (
          <div className="p-5 space-y-6">
            {loadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
                <p className="text-sm text-red-700">{loadError}</p>
                <button onClick={() => void load()} className="text-sm font-medium text-red-700 underline">Retry</button>
              </div>
            )}
            <section className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Requester</p><p className="text-gray-900">{ticket.requester_name || 'N/A'}</p><p className="text-xs text-gray-500 break-all">{ticket.requester_email}</p></div>
              <div><p className="text-xs text-gray-500">Category</p><p className="text-gray-900">{ticket.category}</p></div>
              <div><p className="text-xs text-gray-500">Created</p><p className="text-gray-900">{fmt(ticket.created_at)}</p></div>
              <div><p className="text-xs text-gray-500">Last updated</p><p className="text-gray-900">{fmt(ticket.updated_at)}</p></div>
            </section>

            <section>
              <h3 className={sectionTitle}>Description</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
              {ticket.original_question && (
                <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">Original question: {ticket.original_question}</p>
              )}
              {ticket.chatbot_answer && (
                <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">Chatbot answer: {ticket.chatbot_answer}</p>
              )}
              {ticket.attachment_count > 0 && (
                <p className="mt-2 text-xs text-gray-500">{ticket.attachment_count} attachment(s)</p>
              )}
            </section>

            <section className="space-y-3">
              <h3 className={sectionTitle}>Manage</h3>

              <div>
                <label className="block text-xs text-gray-500 mb-1" htmlFor="td-assignee">Assigned to</label>
                <div className="flex gap-2">
                  <select id="td-assignee" className={inputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)} disabled={busy !== null}>
                    <option value="" disabled>Select staff member</option>
                    {!assigneeKnown && <option value={assignee}>{assignee} (not in staff list)</option>}
                    {staff.map((s) => (
                      <option key={s.email} value={s.email}>{s.full_name ? `${s.full_name} (${s.email})` : s.email}</option>
                    ))}
                  </select>
                  <button
                    className={btnClass}
                    disabled={busy !== null || !assignee || assignee === (ticket.assigned_to ?? '') || !staff.some((s) => s.email === assignee)}
                    onClick={() => run('assign', () => assignTicket(ticket.ticket_id, assignee), ticket.assigned_to ? 'Ticket reassigned' : 'Ticket assigned')}
                  >
                    {busy === 'assign' ? 'Saving...' : ticket.assigned_to ? 'Reassign' : 'Assign'}
                  </button>
                </div>
                {staffError && <p className="mt-1 text-xs text-red-600">{staffError}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="td-status">Status</label>
                  <div className="flex gap-2">
                    <select id="td-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy !== null}>
                      {!STATUS_OPTIONS.some((o) => o.value === status) && <option value={status} disabled>{status.replace(/_/g, ' ')}</option>}
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                      className={btnClass}
                      disabled={busy !== null || status === ticket.status || !STATUS_OPTIONS.some((o) => o.value === status)}
                      onClick={() => run('status', () => updateTicketStatus(ticket.ticket_id, status), 'Status updated')}
                    >
                      {busy === 'status' ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" htmlFor="td-priority">Priority</label>
                  <div className="flex gap-2">
                    <select id="td-priority" className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)} disabled={busy !== null}>
                      {!PRIORITY_OPTIONS.some((o) => o.value === priority) && <option value={priority} disabled>{priority}</option>}
                      {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                      className={btnClass}
                      disabled={busy !== null || priority === ticket.priority || !PRIORITY_OPTIONS.some((o) => o.value === priority)}
                      onClick={() => run('priority', () => updateTicketPriority(ticket.ticket_id, priority), 'Priority updated')}
                    >
                      {busy === 'priority' ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className={sectionTitle}>Conversation</h3>
              {ticket.replies.length === 0 ? (
                <p className="text-sm text-gray-400">No replies yet.</p>
              ) : (
                <ul className="space-y-2">
                  {ticket.replies.map((r, i) => (
                    <li key={i} className={`rounded-lg p-3 text-sm ${r.internal ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-500 mb-1">{r.author} · {fmt(r.created_at)}{r.internal ? ' · internal note' : ''}</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{r.message}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 space-y-2">
                <textarea
                  className={inputClass}
                  rows={3}
                  maxLength={5000}
                  placeholder={internal ? 'Add an internal note (not visible to the user)...' : 'Write a reply to the user...'}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  disabled={busy !== null}
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note
                  </label>
                  <button
                    className={btnClass}
                    disabled={busy !== null || !reply.trim()}
                    onClick={() => run('reply', () => sendTicketReply(ticket.ticket_id, reply.trim(), internal), internal ? 'Note added' : 'Reply sent', () => setReply(''))}
                  >
                    {busy === 'reply' ? 'Sending...' : internal ? 'Add note' : 'Send reply'}
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className={sectionTitle}>Resolve or close</h3>
              <div className="flex gap-2">
                <input className={inputClass} placeholder="Resolution summary" maxLength={2000} value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={busy !== null} />
                <button
                  className={btnClass}
                  disabled={busy !== null || !resolution.trim() || ticket.status === 'resolved' || closed}
                  onClick={() => run('resolve', () => resolveTicket(ticket.ticket_id, resolution.trim()), 'Ticket resolved', () => setResolution(''))}
                >
                  {busy === 'resolve' ? 'Saving...' : 'Resolve'}
                </button>
              </div>
              <div className="flex gap-2">
                <input className={inputClass} placeholder="Reason for closing" maxLength={2000} value={closingReason} onChange={(e) => setClosingReason(e.target.value)} disabled={busy !== null} />
                <button
                  className={btnClass}
                  disabled={busy !== null || !closingReason.trim() || closed}
                  onClick={() => run('close', () => closeTicket(ticket.ticket_id, closingReason.trim()), 'Ticket closed', () => setClosingReason(''))}
                >
                  {busy === 'close' ? 'Saving...' : 'Close'}
                </button>
              </div>
            </section>

            <section>
              <h3 className={sectionTitle}>Activity</h3>
              {ticket.activity_log.length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded.</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...ticket.activity_log].reverse().map((a, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      <span className="text-gray-400">{fmt(a.timestamp)}</span> · {a.changed_by || 'system'} · {a.action.replace(/_/g, ' ')}
                      {a.field ? ` (${a.field}: ${a.old_value ?? '—'} → ${a.new_value ?? '—'})` : ''}
                      {a.reason ? ` · ${a.reason}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TicketDetailDrawer
