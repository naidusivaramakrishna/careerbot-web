import React, { memo, useCallback } from 'react'
import { formatTimestamp, getLogLevelColor, type LogLevel, type LogSource } from '@/api/adminMonitoringApi'
import type { SystemLog } from '@/api/adminMonitoringApi'
import { X } from 'lucide-react'

interface SystemLogsSectionProps {
    logs: SystemLog[]
    loading?: boolean
    filters: {
        level: LogLevel | ''
        source: LogSource | ''
        search: string
        startDate: string
        endDate: string
    }
    onFiltersChange: (filters: SystemLogsSectionProps['filters']) => void
}

const LogRow = memo(({ log }: { log: SystemLog }) => {
    return (
        <tr className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
            <td className="p-3">{log.message}</td>
            <td className="p-3">
                <span className={`px-2 uppercase py-1 text-xs rounded-full font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level}
                </span>
            </td>
            <td className="p-3">{log.source}</td>
            <td className="p-3 text-gray-600">{formatTimestamp(log.timestamp)}</td>
        </tr>
    )
})

LogRow.displayName = 'LogRow'

export const SystemLogsSection = memo(({ logs, loading, filters, onFiltersChange }: SystemLogsSectionProps) => {
    const handleFilterChange = useCallback((key: keyof typeof filters, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }, [filters, onFiltersChange])

    const handleClearFilters = useCallback(() => {
        onFiltersChange({
            level: '',
            source: '',
            search: '',
            startDate: '',
            endDate: '',
        })
    }, [onFiltersChange])

    const hasActiveFilters = filters.level || filters.source || filters.search || filters.startDate || filters.endDate

    return (
        <div className="bg-white rounded-lg p-6 my-10">
            <div className='flex justify-between items-center pb-4'>
                <h1 className='font-semibold'>System Logs</h1>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className='text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1'
                    >
                        <X className='w-3 h-3' />
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="space-y-3 mb-4">
                {/* First Row: Search, Level, Source */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search message..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Log Level</label>
                        <select
                            value={filters.level}
                            onChange={(e) => handleFilterChange('level', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Levels</option>
                            <option value="WARNING">Warning</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Source</label>
                        <select
                            value={filters.source}
                            onChange={(e) => handleFilterChange('source', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Sources</option>
                            <option value="System">System</option>
                            <option value="Database">Database</option>
                        </select>
                    </div>
                </div>

                {/* Second Row: Date Range */}
                <div className="flex gap-3 flex-wrap">
                    <div className="flex flex-col w-44">
                        <label className="text-xs text-gray-600 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex flex-col w-44">
                        <label className="text-xs text-gray-600 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-96 border border-[#E5E7EB] rounded-lg">
                <table className="w-full border-collapse text-sm">
                    <thead className='border-b border-[#E5E7EB] sticky top-0 bg-white'>
                        <tr className="text-left text-gray-700">
                            <th className="p-3 font-semibold">Message</th>
                            <th className="p-3 font-semibold">Level</th>
                            <th className="p-3 font-semibold">Source</th>
                            <th className="p-3 font-semibold">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs && logs.length > 0 ? (
                            logs.map((log) => (
                                <LogRow key={log.id} log={log} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    No logs available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})

SystemLogsSection.displayName = 'SystemLogsSection'
