import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { TicketListFilters } from '@/api/adminTicketApi'
import TicketSearchFilters from './TicketSearchFilters'

// The page passes useAdminTickets' plain setter as onFilterChange; this harness
// does the same with a useState setter and records every committed filter set.
const START: TicketListFilters = { page: 3, page_size: 10, sort_by: 'created_at', sort_order: 'desc' }

const Harness = ({ commits, onExport }: { commits: TicketListFilters[]; onExport?: (f: TicketListFilters) => void }) => {
  const [filters, setFilters] = useState<TicketListFilters>(START)
  const onFilterChange = (f: TicketListFilters) => {
    commits.push(f)
    setFilters(f)
  }
  return (
    <>
      <TicketSearchFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={() => setFilters(START)}
        onExport={onExport}
      />
      <output data-testid="filters">{JSON.stringify(filters)}</output>
    </>
  )
}

const current = (): TicketListFilters => JSON.parse(screen.getByTestId('filters').textContent || '{}')
const searchBox = () => screen.getByPlaceholderText('Search by ticket ID, subject, or requester...')
const statusSelect = () => screen.getAllByRole('combobox')[0]

describe('TicketSearchFilters debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('commits typed search after the pause, on page 1 (control)', () => {
    const commits: TicketListFilters[] = []
    render(<Harness commits={commits} />)
    fireEvent.change(searchBox(), { target: { value: 'john' } })
    expect(commits).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(400) })
    expect(current()).toMatchObject({ search: 'john', page: 1, page_size: 10 })
    expect(commits).toHaveLength(1)
  })

  it('keeps a status change made while the search debounce is pending', () => {
    const commits: TicketListFilters[] = []
    render(<Harness commits={commits} />)
    fireEvent.change(searchBox(), { target: { value: 'john' } })
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.change(statusSelect(), { target: { value: 'open' } })
    expect(current()).toMatchObject({ status: 'open' })
    act(() => { vi.advanceTimersByTime(400) })
    expect(current()).toMatchObject({ search: 'john', status: 'open', page: 1 })
  })

  it('exports with the search text that is still in its debounce window, and commits it once', () => {
    const commits: TicketListFilters[] = []
    const onExport = vi.fn()
    render(<Harness commits={commits} onExport={onExport} />)
    fireEvent.change(statusSelect(), { target: { value: 'resolved' } })
    fireEvent.change(searchBox(), { target: { value: 'john ' } })
    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport.mock.calls[0][0]).toMatchObject({ search: 'john', status: 'resolved' })
    expect(current()).toMatchObject({ search: 'john', status: 'resolved', page: 1 })
    const before = commits.length
    act(() => { vi.advanceTimersByTime(1000) })
    expect(commits).toHaveLength(before)
  })

  it('exports the current filters unchanged when nothing is pending (control)', () => {
    const commits: TicketListFilters[] = []
    const onExport = vi.fn()
    render(<Harness commits={commits} onExport={onExport} />)
    fireEvent.change(statusSelect(), { target: { value: 'open' } })
    const committed = commits.length
    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(onExport.mock.calls[0][0]).toMatchObject({ status: 'open', page: 1 })
    expect(onExport.mock.calls[0][0].search).toBeUndefined()
    expect(commits).toHaveLength(committed)
  })
})
