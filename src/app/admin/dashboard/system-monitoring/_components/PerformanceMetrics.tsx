import React, { memo } from 'react'

interface CachePerformance {
    hit_rate: number
    miss_rate: number
    evictions: number
}

interface DatabaseStats {
    active_connections: number
    queries_per_second: number
    slow_queries: number
}

interface StorageMetrics {
    total_gb: number
    used_gb: number
    free_gb: number
}

interface PerformanceMetricsProps {
    cachePerformance: CachePerformance
    databaseStats: DatabaseStats
    storageMetrics: StorageMetrics
}

interface MetricItemProps {
    label: string
    value: string | number
}

const MetricItem = memo(({ label, value }: MetricItemProps) => {
    return (
        <div className='flex justify-between text-sm'>
            <p className='text-[#717182]'>{label}</p>
            <span>{value}</span>
        </div>
    )
})

MetricItem.displayName = 'MetricItem'

const MetricCard = memo(({
    title,
    children
}: {
    title: string
    children: React.ReactNode
}) => {
    return (
        <div className='bg-white rounded-lg p-4'>
            <h1 className='font-semibold text-sm py-4'>{title}</h1>
            <div className='flex flex-col gap-2'>
                {children}
            </div>
        </div>
    )
})

MetricCard.displayName = 'MetricCard'

export const PerformanceMetrics = memo(({
    cachePerformance,
    databaseStats,
    storageMetrics
}: PerformanceMetricsProps) => {
    return (
        <div className='grid grid-cols-3 gap-4'>
            <MetricCard title="Cache Performance">
                <MetricItem
                    label="Hit Rate"
                    value={cachePerformance.hit_rate ? `${cachePerformance.hit_rate.toFixed(1)}%` : '-'}
                />
                <MetricItem
                    label="Miss Rate"
                    value={cachePerformance.miss_rate ? `${cachePerformance.miss_rate.toFixed(1)}%` : '-'}
                />
                <MetricItem
                    label="Evictions"
                    value={cachePerformance.evictions || '-'}
                />
            </MetricCard>

            <MetricCard title="Database Stats">
                <MetricItem
                    label="Active Connections"
                    value={databaseStats.active_connections || '-'}
                />
                <MetricItem
                    label="Queries/sec"
                    value={databaseStats.queries_per_second || '-'}
                />
                <MetricItem
                    label="Slow Queries"
                    value={databaseStats.slow_queries || '-'}
                />
            </MetricCard>

            <MetricCard title="Storage">
                <MetricItem
                    label="Total Size"
                    value={storageMetrics.total_gb ? `${storageMetrics.total_gb.toFixed(1)} GB` : '-'}
                />
                <MetricItem
                    label="Used"
                    value={storageMetrics.used_gb ? `${storageMetrics.used_gb.toFixed(1)} GB` : '-'}
                />
                <MetricItem
                    label="Free"
                    value={storageMetrics.free_gb ? `${storageMetrics.free_gb.toFixed(1)} GB` : '-'}
                />
            </MetricCard>
        </div>
    )
})

PerformanceMetrics.displayName = 'PerformanceMetrics'
