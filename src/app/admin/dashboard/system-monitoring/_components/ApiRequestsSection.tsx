import React, { memo, useMemo } from 'react'
import { Calendar, ChartLine } from 'lucide-react'
import { MdOutlineCalendarMonth } from 'react-icons/md'
import { BsFire } from 'react-icons/bs'
import { MetricCard } from './MetricCard'
import { MonitoringChart } from './MonitoringChart'
import { InsightBox } from './InsightBox'
import { ComparisonToggle } from './ComparisonToggle'
import type { ApiRequestMetricsResponse } from '@/api/adminMonitoringApi'
import TimeTabs from '@/app/admin/_components/TimeTabs'

interface ApiRequestsSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
    metrics: ApiRequestMetricsResponse | null
}

const formatNumber = (num: number): string => {
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
}

export const ApiRequestsSection = memo(({
    activeTab,
    onTabChange,
    showComparison,
    onComparisonChange,
    metrics
}: ApiRequestsSectionProps) => {
    const chartData = useMemo(() => {
        if (!metrics?.time_series?.data_points) return []

        return metrics.time_series.data_points.map((point, index) => {
            const time = new Date(point.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
            const data: any = { time, value: point.value }

            if (showComparison && metrics.comparison?.enabled && metrics.comparison.previous_period?.data_points[index]) {
                data.previous = metrics.comparison.previous_period.data_points[index].value
            }

            return data
        })
    }, [metrics, showComparison])

    return (
        <div className='bg-white rounded-lg p-6'>
            <div className='flex justify-between my-4'>
                <h1 className='font-semibold'>API Requests</h1>
                <TimeTabs active={activeTab} onChange={onTabChange} />
            </div>

            <ComparisonToggle
                id="api-requests-compare"
                checked={showComparison}
                onChange={onComparisonChange}
            />

            <div className="flex justify-between">
                <div className="grid grid-cols-4 gap-4 w-full">
                    <MetricCard
                        label="Today"
                        value={metrics?.today ? formatNumber(metrics.today.count) : '-'}
                        icon={Calendar}
                    />
                    <MetricCard
                        label="Yesterday"
                        value={metrics?.yesterday ? formatNumber(metrics.yesterday.count) : '-'}
                        icon={ChartLine}
                        growth={metrics?.yesterday?.growth}
                    />
                    <MetricCard
                        label="Last 7 days"
                        value={metrics?.last_7_days ? formatNumber(metrics.last_7_days.count) : '-'}
                        icon={MdOutlineCalendarMonth}
                    />
                    <MetricCard
                        label="Peak Load"
                        value={metrics?.peak_load ? `${metrics.peak_load} req/min` : '-'}
                        icon={BsFire}
                    />
                </div>
            </div>

            <MonitoringChart
                data={chartData}
                dataKey="value"
                strokeColor="#4A8CFF"
                showComparison={showComparison}
                fillGradient={true}
                tooltipFormatter={(value: number) => [`${value} requests`, 'API Calls']}
            />

            <InsightBox insight={metrics?.insight || 'Loading insights...'} />
        </div>
    )
})

ApiRequestsSection.displayName = 'ApiRequestsSection'
