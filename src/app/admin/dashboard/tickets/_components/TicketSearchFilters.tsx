"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Search, RefreshCw, Download, Calendar } from 'lucide-react'
import { TicketListFilters } from '@/api/adminTicketApi'

interface TicketSearchFiltersProps {
  filters: TicketListFilters
  onFilterChange: (filters: TicketListFilters) => void
  onClearFilters: () => void
  /** Receives the filters to export, including search/assignee text still in its debounce window. */
  onExport?: (filters: TicketListFilters) => void
  isLoading?: boolean
}

const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50'
const labelClass = 'block text-xs text-gray-500 mb-0.5'

const TicketSearchFilters: React.FC<TicketSearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onExport,
  isLoading,
}) => {
  const update = (patch: Partial<TicketListFilters>) => onFilterChange({ ...filters, page: 1, ...patch })

  // Search and assignee are typed text: keep them local and push to the filters
  // after a short pause instead of firing a request on every keystroke.
  const [search, setSearch] = useState(filters.search || '')
  const [assignee, setAssignee] = useState(filters.assigned_to || '')

  useEffect(() => {
    setSearch(filters.search || '')
    setAssignee(filters.assigned_to || '')
  }, [filters.search, filters.assigned_to])

  // The debounce timer must merge into the filters as they are when it fires,
  // not as they were when the user typed: a status/priority/date/page change
  // made during the pause would otherwise be overwritten.
  const latestFilters = useRef(filters)
  useEffect(() => {
    latestFilters.current = filters
  }, [filters])

  useEffect(() => {
    const next = { search: search.trim() || undefined, assigned_to: assignee.trim() || undefined }
    const timer = setTimeout(() => {
      const latest = latestFilters.current
      if (next.search === latest.search && next.assigned_to === latest.assigned_to) return
      onFilterChange({ ...latest, page: 1, ...next })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, assignee, onFilterChange])

  // Export what the inputs show: commit pending search/assignee text right away
  // and export with it, instead of the filters from before the pause.
  const handleExport = () => {
    const next = { search: search.trim() || undefined, assigned_to: assignee.trim() || undefined }
    if (next.search === filters.search && next.assigned_to === filters.assigned_to) {
      onExport?.(filters)
      return
    }
    const committed = { ...filters, page: 1, ...next }
    latestFilters.current = committed
    onFilterChange(committed)
    onExport?.(committed)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 basis-full lg:basis-0 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, subject, or requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label className={labelClass}>Status</label>
            <select className={selectClass} value={filters.status || ''} onChange={(e) => update({ status: e.target.value || undefined })}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_user">Waiting for User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="w-32">
            <label className={labelClass}>Priority</label>
            <select className={selectClass} value={filters.priority || ''} onChange={(e) => update({ priority: e.target.value || undefined })}>
              <option value="">All</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="w-44">
            <label className={labelClass}>Assignee</label>
            <input
              type="text"
              placeholder="Staff email"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={selectClass}
            />
          </div>
          <div className="w-[300px]">
            <label className={labelClass}>
              <Calendar className="inline w-3 h-3 mr-1" />
              Date Range
            </label>
            <div className="flex items-center gap-1">
              <input type="date" aria-label="From date" value={filters.date_from || ''} onChange={(e) => update({ date_from: e.target.value || undefined })} className={selectClass} />
              <input type="date" aria-label="To date" value={filters.date_to || ''} onChange={(e) => update({ date_to: e.target.value || undefined })} className={selectClass} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClearFilters}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </button>
          {onExport && (
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 rounded-lg text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketSearchFilters
