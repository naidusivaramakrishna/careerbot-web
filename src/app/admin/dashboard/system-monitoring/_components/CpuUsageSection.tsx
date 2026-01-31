import React, { memo, useMemo } from 'react'
import { BsCpuFill, BsFire } from 'react-icons/bs'
import { MonitoringChart } from './MonitoringChart'
import { InsightBox } from './InsightBox'
import { ComparisonToggle } from './ComparisonToggle'
import type { CpuUsageResponse } from '@/api/adminMonitoringApi'
import TimeTabs from '@/app/admin/_components/TimeTabs'
import { MetricCard } from './MetricCard'

interface CpuUsageSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
    metrics: CpuUsageResponse | null
}

export const CpuUsageSection = memo(({
    activeTab,
    onTabChange,
    showComparison,
    onComparisonChange,
    metrics
}: CpuUsageSectionProps) => {
    const chartData = useMemo(() => {
        if (!metrics?.time_series?.data_points) return []

        return metrics.time_series.data_points.map((point, index) => {
            const time = new Date(point.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
            const data: any = { time, cpu: point.value }

            if (showComparison && metrics.comparison?.enabled && metrics.comparison.previous_period?.data_points[index]) {
                data.previous = metrics.comparison.previous_period.data_points[index].value
            }

            return data
        })
    }, [metrics, showComparison])

    return (
        <div className="bg-white rounded-lg p-6 mt-10">
            <div className='flex justify-between my-4'>
                <h1 className='font-semibold'>CPU Usage</h1>
                <TimeTabs active={activeTab} onChange={onTabChange} />
            </div>

            <ComparisonToggle
                id="cpu-compare"
                checked={showComparison}
                onChange={onComparisonChange}
            />

            <div className="flex justify-self-end gap-4">
                <MetricCard
                    label="CPU Avg (7D)"
                    value={metrics?.period_average ? `${metrics.period_average.toFixed(0)}%` : '-'}
                    icon={BsCpuFill}
                />
                <MetricCard
                    label="Peak CPU"
                    value={metrics?.peak ? `${metrics.peak.toFixed(0)}%` : '-'}
                    icon={BsFire}
                />
            </div>

            <MonitoringChart
                data={chartData}
                dataKey="cpu"
                strokeColor="#FF9D3A"
                showComparison={showComparison}
                domain={[0, 100]}
                yAxisFormatter={(value) => `${value}%`}
                tooltipFormatter={(value: number) => [`${value}%`, 'CPU']}
            />

            <InsightBox insight={metrics?.insight || 'Loading insights...'} />
        </div>
    )
})

CpuUsageSection.displayName = 'CpuUsageSection'
