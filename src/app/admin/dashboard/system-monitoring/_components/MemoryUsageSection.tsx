import React, { memo, useMemo } from 'react'
import { GiCpu } from 'react-icons/gi'
import { BsFire } from 'react-icons/bs'
import { MonitoringChart } from './MonitoringChart'
import { InsightBox } from './InsightBox'
import { ComparisonToggle } from './ComparisonToggle'
import type { MemoryUsageResponse } from '@/api/adminMonitoringApi'
import TimeTabs from '@/app/admin/_components/TimeTabs'
import { MetricCard } from './MetricCard'

interface MemoryUsageSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
    metrics: MemoryUsageResponse | null
}

export const MemoryUsageSection = memo(({
    activeTab,
    onTabChange,
    showComparison,
    onComparisonChange,
    metrics
}: MemoryUsageSectionProps) => {
    const chartData = useMemo(() => {
        if (!metrics?.time_series?.data_points) return []

        return metrics.time_series.data_points.map((point, index) => {
            const time = new Date(point.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
            const data: any = { time, memory: point.value }

            if (showComparison && metrics.comparison?.enabled && metrics.comparison.previous_period?.data_points[index]) {
                data.previous = metrics.comparison.previous_period.data_points[index].value
            }

            return data
        })
    }, [metrics, showComparison])

    return (
        <div className="bg-white rounded-lg p-6 mt-10">
            <div className='flex justify-between my-4'>
                <h1 className='font-semibold'>Memory Usage</h1>
                <TimeTabs active={activeTab} onChange={onTabChange} />
            </div>

            <ComparisonToggle
                id="memory-compare"
                checked={showComparison}
                onChange={onComparisonChange}
            />

            <div className="flex justify-self-end gap-4">
                <MetricCard
                    label="Memory Avg (7D)"
                    value={metrics?.period_average ? `${metrics.period_average.toFixed(0)}%` : '-'}
                    icon={GiCpu}
                />
                <MetricCard
                    label="Peak Memory"
                    value={metrics?.peak ? `${metrics.peak.toFixed(0)}%` : '-'}
                    icon={BsFire}
                />
            </div>

            <MonitoringChart
                data={chartData}
                dataKey="memory"
                strokeColor="#40B37C"
                showComparison={showComparison}
                domain={[0, 100]}
                yAxisFormatter={(value) => `${value}%`}
                tooltipFormatter={(value: number) => [`${value}%`, 'Memory']}
            />

            <InsightBox insight={metrics?.insight || 'Loading insights...'} />
        </div>
    )
})

MemoryUsageSection.displayName = 'MemoryUsageSection'