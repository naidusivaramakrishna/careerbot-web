"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTicketStats,
  listAdminTickets,
  getAssignableStaff,
  getApiErrorMessage,
  StaffMember,
  TicketListFilters,
  TicketStatsResponse,
  TicketListResponse,
} from '@/api/adminTicketApi'
import { logger } from '@/lib/logger'

interface UseAdminTicketsReturn {
  stats: TicketStatsResponse | null
  tickets: TicketListResponse | null
  filters: TicketListFilters
  isLoading: boolean
  error: string | null
  statsLoading: boolean
  statsError: string | null
  staff: StaffMember[]
  staffError: string | null

  setFilters: (filters: TicketListFilters) => void
  clearFilters: () => void
  refreshStats: () => Promise<void>
  refreshTickets: () => Promise<void>
}

const describeError = (err: unknown, fallback: string): string =>
  (err as { response?: { status?: number } })?.response?.status === 403
    ? "You don't have permission to view tickets"
    : fallback

const DEFAULT_FILTERS: TicketListFilters = {
  page: 1,
  page_size: 10,
  sort_by: 'created_at',
  sort_order: 'desc',
}

export const useAdminTickets = (): UseAdminTicketsReturn => {
  const [stats, setStats] = useState<TicketStatsResponse | null>(null)
  const [tickets, setTickets] = useState<TicketListResponse | null>(null)
  const [filters, setFiltersState] = useState<TicketListFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffError, setStaffError] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch statistics. On failure the previous counts (if any) are kept and the
  // error is surfaced separately; counts are never replaced with zeros.
  // Responses can arrive out of order; only the most recent request may update state,
  // otherwise a slow earlier response overwrites the table/cards with stale data.
  const statsSeq = useRef(0)
  const ticketsSeq = useRef(0)

  const fetchStats = useCallback(async () => {
    const seq = ++statsSeq.current
    try {
      setStatsLoading(true)
      const data = await getTicketStats()
      if (seq !== statsSeq.current) return
      setStats(data)
      setStatsError(null)
    } catch (err) {
      if (seq !== statsSeq.current) return
      logger.error('Failed to fetch ticket statistics:', err)
      setStatsError(describeError(err, 'Failed to load ticket statistics'))
    } finally {
      if (seq === statsSeq.current) setStatsLoading(false)
    }
  }, [])

  // Fetch tickets with current filters
  const fetchTickets = useCallback(async () => {
    const seq = ++ticketsSeq.current
    try {
      setIsLoading(true)
      setError(null)
      const data = await listAdminTickets(filters)
      if (seq !== ticketsSeq.current) return
      setTickets(data)
      // The page can stop existing (e.g. its last row was closed and filtered
      // out): move to the last page that does, which refetches.
      if (data.total_pages > 0 && (filters.page ?? 1) > data.total_pages) {
        setFiltersState((prev) => ({ ...prev, page: data.total_pages }))
      }
    } catch (err) {
      if (seq !== ticketsSeq.current) return
      logger.error('Failed to fetch tickets:', err)
      setError(describeError(err, 'Failed to load tickets'))
    } finally {
      if (seq === ticketsSeq.current) setIsLoading(false)
    }
  }, [filters])

  // Counts are global (not filtered), so load them once, not on every filter change
  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  useEffect(() => {
    void fetchTickets()
  }, [fetchTickets])

  // Assignee dropdown options; loaded once
  useEffect(() => {
    getAssignableStaff()
      .then((data) => {
        setStaff(data)
        setStaffError(null)
      })
      .catch((err) => {
        logger.error('Failed to fetch staff list:', err)
        setStaffError(getApiErrorMessage(err, 'Could not load staff list; assignment is unavailable'))
      })
  }, [])

  const setFilters = useCallback((newFilters: TicketListFilters) => {
    setFiltersState(newFilters)
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const refreshStats = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  const refreshTickets = useCallback(async () => {
    await fetchTickets()
  }, [fetchTickets])

  return {
    stats,
    tickets,
    filters,
    isLoading,
    error,
    statsLoading,
    statsError,
    staff,
    staffError,
    setFilters,
    clearFilters,
    refreshStats,
    refreshTickets,
  }
}
