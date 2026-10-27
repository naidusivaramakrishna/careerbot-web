"use client"

import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useAdminAccess } from '../../_hooks/useAdminAccess'
import { LockedPageOverlay } from '../../_components/LockedPageOverlay'
import { useAdminTickets } from './_hooks/useAdminTickets'
import TicketSummaryCards from './_components/TicketSummaryCards'
import TicketSearchFilters from './_components/TicketSearchFilters'
import TicketTable from './_components/TicketTable'
import TicketDetailDrawer from './_components/TicketDetailDrawer'
import ErrorBoundary from '@/components/ErrorBoundary'
import { exportAdminTickets, getApiErrorMessage, TicketListFilters } from '@/api/adminTicketApi'

const TicketManagementPage = () => {
  const { hasAccess, loading: accessLoading, requiredRoles } = useAdminAccess('ticket-management')
  const {
    stats, tickets, filters, isLoading, error, statsLoading, statsError, staff, staffError,
    refreshStats, refreshTickets, setFilters, clearFilters,
  } = useAdminTickets()
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  if (accessLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!hasAccess) {
    return <LockedPageOverlay requiredRoles={requiredRoles} />
  }

  // Exports every ticket matching the current search/filters (all pages) as CSV
  const handleExport = async (exportFilters: TicketListFilters = filters) => {
    try {
      setExporting(true)
      const blob = await exportAdminTickets(exportFilters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to export tickets'))
    } finally {
      setExporting(false)
    }
  }

  // After any successful ticket change: refresh the table and the six cards
  const handleChanged = () => {
    void refreshTickets()
    void refreshStats()
  }

  return (
    <ErrorBoundary>
      <Toaster richColors position="bottom-right" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Ticket Management</h1>
            <p className="text-sm text-gray-600">View and manage user support tickets, assign to agents, and track resolution progress.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {statsError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">{statsError}</p>
              <button
                onClick={() => void refreshStats()}
                disabled={statsLoading}
                className="text-sm font-medium text-red-700 underline disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          <TicketSummaryCards stats={stats} isLoading={statsLoading && !stats} />

          <TicketSearchFilters
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
            onExport={(exportFilters) => void handleExport(exportFilters)}
            isLoading={isLoading || exporting}
          />

          <TicketTable
            data={tickets}
            isLoading={isLoading}
            onTicketClick={setSelectedTicketId}
            onPageChange={(page) => setFilters({ ...filters, page })}
            onPageSizeChange={(page_size) => setFilters({ ...filters, page: 1, page_size })}
          />
        </div>
      </div>

      {selectedTicketId && (
        <TicketDetailDrawer
          ticketId={selectedTicketId}
          staff={staff}
          staffError={staffError}
          onClose={() => setSelectedTicketId(null)}
          onChanged={handleChanged}
        />
      )}
    </ErrorBoundary>
  )
}

export default TicketManagementPage
