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

const SystemMonitoring = () => {
    const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('system-monitoring');
    // Separate time tab state for each section
    const [apiActiveTab, setApiActiveTab] = useState<string>("Today")
    const [cpuActiveTab, setCpuActiveTab] = useState<string>("Today")
    const [memoryActiveTab, setMemoryActiveTab] = useState<string>("Today")

    const [apiShowComparison, setApiShowComparison] = useState(false)
    const [cpuShowComparison, setCpuShowComparison] = useState(false)
    const [memoryShowComparison, setMemoryShowComparison] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState<string>("Off")

    // Load auto-refresh preference from localStorage on mount
    useEffect(() => {
        const savedAutoRefresh = localStorage.getItem('systemMonitoring_autoRefresh')
        if (savedAutoRefresh) {
            setAutoRefresh(savedAutoRefresh)
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
        activeTab: apiActiveTab,
        cpuActiveTab: cpuActiveTab,
        memoryActiveTab: memoryActiveTab,
        apiShowComparison,
        cpuShowComparison,
        memoryShowComparison,
        autoRefresh
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
                activeTab={apiActiveTab}
                onTabChange={setApiActiveTab}
                showComparison={apiShowComparison}
                onComparisonChange={setApiShowComparison}
                metrics={apiMetrics}
            />

            {/* CPU Usage Section */}
            <CpuUsageSection
                activeTab={cpuActiveTab}
                onTabChange={setCpuActiveTab}
                showComparison={cpuShowComparison}
                onComparisonChange={setCpuShowComparison}
                metrics={cpuMetrics}
            />

            {/* Memory Usage Section */}
            <MemoryUsageSection
                activeTab={memoryActiveTab}
                onTabChange={setMemoryActiveTab}
                showComparison={memoryShowComparison}
                onComparisonChange={setMemoryShowComparison}
                metrics={memoryMetrics}
            />

            {/* System Logs */}
            {systemLogs && (
                <SystemLogsSection logs={systemLogs.logs} />
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
