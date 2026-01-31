import React, { memo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";

interface ChartData {
    [key: string]: string | number;
}

interface DashboardChartProps {
    title: string;
    data: ChartData[];
    type: 'line' | 'bar' | 'pie';
    height?: number;
    dataKeys?: string[];
    colors?: string[];
    xAxisKey?: string;
}

const DashboardChartComponent: React.FC<DashboardChartProps> = ({
    title,
    data,
    type,
    height = 250,
    dataKeys = [],
    colors = ['#3b82f6', '#f97316'],
    xAxisKey = 'month'
}) => {
    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#d1d5db"
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#d1d5db"
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        {dataKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                animationDuration={300}
                            />
                        ))}
                    </LineChart>
                );

            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#d1d5db"
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#d1d5db"
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="circle"
                        />
                        {dataKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                                animationDuration={300}
                            />
                        ))}
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={dataKeys[0] || 'value'}
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            animationDuration={300}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    </PieChart>
                );

            default:
                return <div className="text-gray-500 text-center py-8">Unsupported chart type</div>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow will-change-transform">
            {title && <h2 className="font-semibold mb-4 text-lg text-gray-800">{title}</h2>}
            {type === 'line' || type === 'bar' || type === 'pie' ? (
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            ) : (
                renderChart()
            )}
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders
export const DashboardChart = memo(DashboardChartComponent);
DashboardChart.displayName = 'DashboardChart';

export default DashboardChart;
