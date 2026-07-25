import React, { memo, useMemo } from 'react'
import { LucideIcon } from 'lucide-react'
import { IconType } from 'react-icons'
import { BsFire } from 'react-icons/bs'
import { MonitoringChart } from './MonitoringChart'
import { InsightBox } from './InsightBox'
import { ComparisonToggle } from './ComparisonToggle'
import type { CpuUsageResponse } from '@/api/adminMonitoringApi'
import TimeTabs from '@/app/admin/_components/TimeTabs'
import { MetricCard } from './MetricCard'

// CpuUsageResponse and MemoryUsageResponse are structurally identical
export type ResourceMetrics = CpuUsageResponse

interface ResourceUsageSectionProps {
    title: string
    compareId: string
    avgLabel: string
    peakLabel: string
    avgIcon: LucideIcon | IconType
    peakIcon?: LucideIcon | IconType
    strokeColor: string
    tooltipLabel: string
    metrics: ResourceMetrics | null
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
}

export const ResourceUsageSection = memo(({
    title,
    compareId,
    avgLabel,
    peakLabel,
    avgIcon,
    peakIcon = BsFire,
    strokeColor,
    tooltipLabel,
    metrics,
    activeTab,
    onTabChange,
    showComparison,
    onComparisonChange,
}: ResourceUsageSectionProps) => {
    const chartData = useMemo(() => {
        if (!metrics?.time_series?.data_points) return []

        return metrics.time_series.data_points.map((point, index) => {
            const time = new Date(point.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
            const data: { time: string; value: number; previous?: number } = { time, value: point.value }

            if (showComparison && metrics.comparison?.enabled && metrics.comparison.previous_period?.data_points[index]) {
                data.previous = metrics.comparison.previous_period.data_points[index].value
            }

            return data
        })
    }, [metrics, showComparison])

    return (
        <div className="bg-white rounded-lg p-6 mt-10">
            <div className='flex justify-between my-4'>
                <h1 className='font-semibold'>{title}</h1>
                <TimeTabs active={activeTab} onChange={onTabChange} />
            </div>

            <ComparisonToggle
                id={compareId}
                checked={showComparison}
                onChange={onComparisonChange}
            />

            <div className="flex justify-self-end gap-4">
                <MetricCard
                    label={avgLabel}
                    value={metrics?.period_average ? `${metrics.period_average.toFixed(0)}%` : '-'}
                    icon={avgIcon}
                />
                <MetricCard
                    label={peakLabel}
                    value={metrics?.peak ? `${metrics.peak.toFixed(0)}%` : '-'}
                    icon={peakIcon}
                />
            </div>

            <MonitoringChart
                data={chartData}
                dataKey="value"
                strokeColor={strokeColor}
                showComparison={showComparison}
                domain={[0, 100]}
                yAxisFormatter={(value) => `${value}%`}
                tooltipFormatter={(value: number) => [`${value}%`, tooltipLabel]}
            />

            <InsightBox insight={metrics?.insight || 'Loading insights...'} />
        </div>
    )
})

ResourceUsageSection.displayName = 'ResourceUsageSection'
