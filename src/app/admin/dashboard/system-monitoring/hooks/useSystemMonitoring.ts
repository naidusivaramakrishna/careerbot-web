import { useState, useEffect, useCallback } from 'react'
import {
    getSystemOverview,
    getApiRequestMetrics,
    getCpuUsage,
    getMemoryUsage,
    getSystemLogs,
    type SystemOverviewResponse,
    type ApiRequestMetricsResponse,
    type CpuUsageResponse,
    type MemoryUsageResponse,
    type SystemLogsResponse,
    type MonitoringPeriod,
    type LogLevel,
    type LogSource,
} from '@/api/adminMonitoringApi'
import { logger } from '@/lib/logger'

interface LogsFilters {
    level: LogLevel | ''
    source: LogSource | ''
    search: string
    startDate: string
    endDate: string
}

interface UseSystemMonitoringProps {
    activeTab: string
    cpuActiveTab?: string
    memoryActiveTab?: string
    apiShowComparison: boolean
    cpuShowComparison: boolean
    memoryShowComparison: boolean
    autoRefresh: string
    logsFilters?: LogsFilters
}

export const useSystemMonitoring = ({
    activeTab,
    cpuActiveTab,
    memoryActiveTab,
    apiShowComparison,
    cpuShowComparison,
    memoryShowComparison,
    autoRefresh,
    logsFilters
}: UseSystemMonitoringProps) => {
    const [systemOverview, setSystemOverview] = useState<SystemOverviewResponse | null>(null)
    const [apiMetrics, setApiMetrics] = useState<ApiRequestMetricsResponse | null>(null)
    const [cpuMetrics, setCpuMetrics] = useState<CpuUsageResponse | null>(null)
    const [memoryMetrics, setMemoryMetrics] = useState<MemoryUsageResponse | null>(null)
    const [systemLogs, setSystemLogs] = useState<SystemLogsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastRefreshed, setLastRefreshed] = useState<string>("")

    // Map tab names to API period values
    const getPeriodFromTab = useCallback((tab: string): MonitoringPeriod => {
        const periodMap: Record<string, MonitoringPeriod> = {
            "Today": "today",
            "Yesterday": "yesterday",
            "Last 7 Days": "last_7_days",
            "Last 30 Days": "last_30_days"
        }
        return periodMap[tab] || "today"
    }, [])

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const apiPeriod = getPeriodFromTab(activeTab)
            const cpuPeriod = getPeriodFromTab(cpuActiveTab || activeTab)
            const memoryPeriod = getPeriodFromTab(memoryActiveTab || activeTab)

            const logsParams: Record<string, any> = { page: 1, page_size: 10 }
            if (logsFilters?.level) logsParams.level = logsFilters.level
            if (logsFilters?.source) logsParams.source = logsFilters.source
            if (logsFilters?.search) logsParams.search = logsFilters.search
            if (logsFilters?.startDate) logsParams.start_date = logsFilters.startDate
            if (logsFilters?.endDate) logsParams.end_date = logsFilters.endDate

            const [overview, api, cpu, memory, logs] = await Promise.all([
                getSystemOverview(),
                getApiRequestMetrics(apiPeriod, apiShowComparison),
                getCpuUsage(cpuPeriod, cpuShowComparison),
                getMemoryUsage(memoryPeriod, memoryShowComparison),
                getSystemLogs(logsParams)
            ])

            setSystemOverview(overview)
            setApiMetrics(api)
            setCpuMetrics(cpu)
            setMemoryMetrics(memory)
            setSystemLogs(logs)
            setLastRefreshed(
                new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            )
        } catch (error) {
            logger.error('Error fetching monitoring data:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [activeTab, cpuActiveTab, memoryActiveTab, apiShowComparison, cpuShowComparison, memoryShowComparison, logsFilters, getPeriodFromTab])

    // Initial fetch
    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh === "On") {
            const interval = setInterval(() => {
                fetchAllData()
            }, 30000) // Refresh every 30 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh, fetchAllData])

    return {
        systemOverview,
        apiMetrics,
        cpuMetrics,
        memoryMetrics,
        systemLogs,
        loading,
        isRefreshing,
        lastRefreshed,
        fetchAllData
    }
}
