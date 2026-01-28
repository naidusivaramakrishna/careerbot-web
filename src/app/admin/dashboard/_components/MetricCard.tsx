import React, { memo } from 'react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: number | string;
    growth: number;
    icon: LucideIcon;
    prefix?: string;
    periodLabel?: string;
}

const MetricCardComponent: React.FC<MetricCardProps> = ({
    title,
    value,
    growth,
    icon: Icon,
    prefix = '',
    periodLabel = 'month'
}) => {
    const isPositive = growth >= 0;
    const GrowthIcon = isPositive ? TrendingUp : TrendingDown;
    const growthColor = isPositive ? 'text-[#00A63E]' : 'text-red-600';
    const growthBgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

    return (
        <div className='bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 will-change-transform border border-gray-100'>
            <div className='flex items-center justify-between mb-3'>
                <div className='flex-1'>
                    <h1 className='text-[#4A5565] text-sm font-medium mb-1'>{title}</h1>
                    <p className='text-2xl font-bold text-gray-900 tracking-tight'>
                        {prefix}{value}
                    </p>
                </div>
                <div className='p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm'>
                    <Icon className='w-6 h-6 text-gray-700' strokeWidth={2} />
                </div>
            </div>
            <div className='flex items-center gap-2 pt-2 border-t border-gray-100'>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${growthBgColor}`}>
                    <GrowthIcon className={`w-3.5 h-3.5 ${growthColor}`} strokeWidth={2.5} />
                    <span className={`text-xs font-semibold ${growthColor}`}>
                        {isPositive ? '+' : ''}{growth.toFixed(1)}%
                    </span>
                </div>
                <span className='text-xs text-gray-500'>
                    from last {periodLabel}
                </span>
            </div>
        </div>
    );
};

// Memoize component with custom comparison for better performance
export const MetricCard = memo(MetricCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.title === nextProps.title &&
        prevProps.value === nextProps.value &&
        prevProps.growth === nextProps.growth &&
        prevProps.prefix === nextProps.prefix &&
        prevProps.periodLabel === nextProps.periodLabel
        // Icon comparison not needed as it's unlikely to change
    );
});
MetricCard.displayName = 'MetricCard';

export default MetricCard;