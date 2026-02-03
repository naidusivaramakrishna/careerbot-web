import React, { memo, useMemo } from 'react';
import { type LucideIcon } from 'lucide-react';
import MetricCard from './MetricCard';

export interface Metric {
    title: string;
    value: number | string;
    growth: number;
    icon: LucideIcon;
    prefix?: string;
}

interface MetricsGridProps {
    metrics: Metric[];
    periodLabel?: string;
    columns?: 2 | 3 | 4 | 6;
}

const MetricsGridComponent: React.FC<MetricsGridProps> = ({
    metrics,
    periodLabel = 'month',
    columns = 3
}) => {
    // Memoize grid class to prevent recalculation
    const gridClass = useMemo(() => {
        const columnClasses = {
            2: 'sm:grid-cols-2',
            3: 'sm:grid-cols-2 lg:grid-cols-3',
            4: 'sm:grid-cols-2 lg:grid-cols-4',
            6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
        };

        return `grid grid-cols-1 ${columnClasses[columns]} gap-4 my-8`;
    }, [columns]);

    return (
        <div className={gridClass}>
            {metrics.map((metric, index) => (
                <MetricCard
                    key={`${metric.title}-${index}`}
                    title={metric.title}
                    value={metric.value}
                    growth={metric.growth}
                    icon={metric.icon}
                    prefix={metric.prefix}
                    periodLabel={periodLabel}
                />
            ))}
        </div>
    );
};

// Memoize component with shallow comparison
export const MetricsGrid = memo(MetricsGridComponent);
MetricsGrid.displayName = 'MetricsGrid';

export default MetricsGrid;
