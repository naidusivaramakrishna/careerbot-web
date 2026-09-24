"use client"
import React, { useState, useCallback, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import Dropdown from '@/components/common/CustomDropdown'
import { LoadingSpinner } from '../_components/LoadingSpinner'
import { useSystemMonitoring } from './hooks/useSystemMonitoring'
import { ApiRequestsSection } from './_components/ApiRequestsSection'
import { HealthCards } from './_components/HealthCards'
import { CpuUsageSection } from './_components/CpuUsageSection'
import { MemoryUsageSection } from './_components/MemoryUsageSection'
import { SystemLogsSection } from './_components/SystemLogsSection'
import { PerformanceMetrics } from './_components/PerformanceMetrics'
import { logger } from '@/lib/logger'
import { useAdminAccess } from '../../_hooks/useAdminAccess'
import { LockedPageOverlay } from '../../_components/LockedPageOverlay'
import type { LogLevel, LogSource } from '@/api/adminMonitoringApi'

interface LogsFilters {
    level: LogLevel | ''
    source: LogSource | ''
    search: string
    startDate: string
    endDate: string
}

const SystemMonitoring = () => {
    const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('system-monitoring');

    const [activeTabs, setActiveTabs] = useState({ api: "Today", cpu: "Today", memory: "Today" })
    const [showComparisons, setShowComparisons] = useState({ api: false, cpu: false, memory: false })
    const [autoRefresh, setAutoRefresh] = useState<string>("Off")
    const [logsFilters, setLogsFilters] = useState<LogsFilters>({
        level: '',
        source: '',
        search: '',
        startDate: '',
        endDate: '',
    })

    // Load auto-refresh preference from localStorage on mount
    useEffect(() => {
        const VALID_REFRESH_OPTIONS = ['Off', '30s', '1m', '5m', '10m'];
        const savedAutoRefresh = localStorage.getItem('systemMonitoring_autoRefresh');
        if (savedAutoRefresh && VALID_REFRESH_OPTIONS.includes(savedAutoRefresh)) {
            setAutoRefresh(savedAutoRefresh);
        }
    }, [])

    const {
        systemOverview,
        apiMetrics,
        cpuMetrics,
        memoryMetrics,
        systemLogs,
        loading,
        isRefreshing,
        lastRefreshed,
        fetchAllData
    } = useSystemMonitoring({
        activeTab: activeTabs.api,
        cpuActiveTab: activeTabs.cpu,
        memoryActiveTab: activeTabs.memory,
        apiShowComparison: showComparisons.api,
        cpuShowComparison: showComparisons.cpu,
        memoryShowComparison: showComparisons.memory,
        autoRefresh,
        logsFilters
    })

    const handleRefresh = useCallback(() => {
        logger.info('Refreshing system monitoring data')
        fetchAllData()
    }, [fetchAllData])

    const handleAutoRefreshChange = useCallback((value: string) => {
        logger.debug(`Auto-refresh changed to: ${value}`)
        setAutoRefresh(value)
        // Save to localStorage
        localStorage.setItem('systemMonitoring_autoRefresh', value)
    }, [])

    // Block render until access check completes
    if (accessLoading) {
        return <LoadingSpinner />;
    }

    // Check access
    if (!hasAccess) {
        return <LockedPageOverlay requiredRoles={requiredRoles} pageName="System Monitoring" />;
    }

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div>
            {/* Header */}
            <div className='flex justify-between items-center'>
                <div>
                    <h1 className='font-semibold text-xl'>System Monitoring</h1>
                    <p className="text-[#4A5565] text-xs">
                        Monitor system health and performance metrics.
                    </p>
                </div>
                <div className='flex gap-4'>
                    <Dropdown
                        options={["Auto-refresh", "Off", "On"]}
                        defaultValue={autoRefresh}
                        bgColor="bg-gray-100"
                        bgOptions="bg-white"
                        onChange={handleAutoRefreshChange}
                        className="w-34"
                    />
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className='bg-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer disabled:opacity-50'
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <p className='text-[#62627D] text-xs my-4'>
                Last refreshed: {lastRefreshed}
            </p>

            {/* Health Cards */}
            {systemOverview && (
                <HealthCards healthCards={systemOverview.health_cards} />
            )}

            {/* API Requests Section */}
            <ApiRequestsSection
                activeTab={activeTabs.api}
                onTabChange={(v) => setActiveTabs(s => ({ ...s, api: v }))}
                showComparison={showComparisons.api}
                onComparisonChange={(v) => setShowComparisons(s => ({ ...s, api: v }))}
                metrics={apiMetrics}
            />

            {/* CPU Usage Section */}
            <CpuUsageSection
                activeTab={activeTabs.cpu}
                onTabChange={(v) => setActiveTabs(s => ({ ...s, cpu: v }))}
                showComparison={showComparisons.cpu}
                onComparisonChange={(v) => setShowComparisons(s => ({ ...s, cpu: v }))}
                metrics={cpuMetrics}
            />

            {/* Memory Usage Section */}
            <MemoryUsageSection
                activeTab={activeTabs.memory}
                onTabChange={(v) => setActiveTabs(s => ({ ...s, memory: v }))}
                showComparison={showComparisons.memory}
                onComparisonChange={(v) => setShowComparisons(s => ({ ...s, memory: v }))}
                metrics={memoryMetrics}
            />

            {/* System Logs */}
            {systemLogs && (
                <SystemLogsSection
                    logs={systemLogs.logs}
                    loading={isRefreshing}
                    filters={logsFilters}
                    onFiltersChange={setLogsFilters}
                />
            )}

            {/* Performance Metrics */}
            {systemOverview && (
                <PerformanceMetrics
                    cachePerformance={systemOverview.cache_performance}
                    databaseStats={systemOverview.database_stats}
                    storageMetrics={systemOverview.storage_metrics}
                />
            )}
        </div>
    )
}

export default SystemMonitoring
