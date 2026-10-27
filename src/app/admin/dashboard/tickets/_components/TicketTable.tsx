"use client"

import React from 'react'
import { ChevronLeft, ChevronRight, MoreVertical, User } from 'lucide-react'
import { TicketListResponse } from '@/api/adminTicketApi'

interface TicketTableProps {
  data: TicketListResponse | null
  isLoading?: boolean
  onTicketClick?: (ticketId: string) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-blue-50 text-blue-600' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-600' },
  waiting_user: { label: 'Waiting for User', cls: 'bg-sky-50 text-sky-600' },
  escalated: { label: 'Escalated', cls: 'bg-violet-100 text-violet-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
}

const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-600' },
  high: { label: 'High', cls: 'bg-red-100 text-red-600' },
  normal: { label: 'Normal', cls: 'bg-green-100 text-green-700' },
  low: { label: 'Low', cls: 'bg-gray-100 text-gray-600' },
}

const formatDate = (dateString: string) => {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return { date: dateString, time: '' }
  return {
    date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

const initials = (name?: string, email?: string) => {
  const src = (name || email || '?').trim()
  const parts = src.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase()
}

const Pill: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => (
  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{children}</span>
)

const DateCell: React.FC<{ value: string }> = ({ value }) => {
  const { date, time } = formatDate(value)
  return (
    <div className="text-xs text-gray-700 whitespace-nowrap">
      <div>{date}</div>
      <div className="text-gray-400">{time}</div>
    </div>
  )
}

const TicketTable: React.FC<TicketTableProps> = ({ data, isLoading = false, onTicketClick, onPageChange, onPageSizeChange }) => {
  const tickets = data?.tickets ?? []
  const start = data && tickets.length ? (data.page - 1) * data.page_size + 1 : 0
  const end = data ? start + tickets.length - (tickets.length ? 1 : 0) : 0

  const pages = data
    ? Array.from({ length: data.total_pages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === data.total_pages || Math.abs(p - data.page) <= 1
      )
    : []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-600">
              <th className="px-4 py-3">Ticket ID / Subject</th>
              <th className="px-4 py-3">Requester</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && tickets.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">Loading tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">No tickets found. Try adjusting your filters.</td></tr>
            ) : (
              tickets.map((t) => {
                const status = STATUS_STYLES[t.status] ?? { label: t.status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' }
                const priority = PRIORITY_STYLES[t.priority] ?? { label: t.priority, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr
                    key={t.ticket_id}
                    onClick={() => onTicketClick?.(t.ticket_id)}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition ${onTicketClick ? 'cursor-pointer' : ''} ${isLoading ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-4 text-sm max-w-[220px]">
                      <p className="font-semibold text-gray-900">{t.ticket_id}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{t.subject}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                          {initials(t.requester_name, t.requester_email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.requester_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 truncate">{t.requester_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{t.category}</td>
                    <td className="px-4 py-4"><Pill cls={priority.cls}>{priority.label}</Pill></td>
                    <td className="px-4 py-4"><Pill cls={status.cls}>{status.label}</Pill></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </span>
                        <span className={t.assigned_to ? '' : 'text-gray-400'}>{t.assigned_to || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><DateCell value={t.created_at} /></td>
                    <td className="px-4 py-4"><DateCell value={t.updated_at} /></td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onTicketClick?.(t.ticket_id) }}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                        title="View ticket details"
                        aria-label={`Actions for ${t.ticket_id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            Showing {start} - {end} of {data.total_records} tickets
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(data.page - 1)}
              disabled={data.page <= 1 || isLoading}
              aria-label="Previous page"
              className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                <button
                  onClick={() => onPageChange?.(p)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${
                    p === data.page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
            <button
              onClick={() => onPageChange?.(data.page + 1)}
              disabled={data.page >= data.total_pages || isLoading}
              aria-label="Next page"
              className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <select
              value={data.page_size}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              aria-label="Rows per page"
              className="ml-2 px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketTable
