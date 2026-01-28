import React, { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
    time: string
    [key: string]: string | number
}

interface MonitoringChartProps {
    data: ChartDataPoint[]
    dataKey: string
    strokeColor: string
    showComparison?: boolean
    yAxisFormatter?: (value: number) => string
    tooltipFormatter?: (value: number) => [string, string]
    fillGradient?: boolean
    domain?: [number, number]
}

export const MonitoringChart = memo(({
    data,
    dataKey,
    strokeColor,
    showComparison = false,
    yAxisFormatter,
    tooltipFormatter,
    fillGradient = false,
    domain
}: MonitoringChartProps) => {
    const gradientId = `color${dataKey}`

    return (
        <div className="h-64 max-w-3xl mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    {fillGradient && (
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                    )}
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        domain={domain}
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={yAxisFormatter}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px'
                        }}
                        formatter={tooltipFormatter}
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={strokeColor}
                        fill={fillGradient ? `url(#${gradientId})` : undefined}
                        strokeWidth={3}
                        dot={false}
                        name="Current Period"
                    />
                    {showComparison && (
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="#9ca3af"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            name="Previous Period"
                            dot={false}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
})

MonitoringChart.displayName = 'MonitoringChart'