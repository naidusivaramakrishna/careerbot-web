import React, { memo } from 'react';
import { type LucideIcon } from 'lucide-react';

interface RealtimeStatsCardProps {
    icon: LucideIcon;
    value: number | string;
    label: string;
    bgColor: string;
    iconColor: string;
}

const RealtimeStatsCardComponent: React.FC<RealtimeStatsCardProps> = ({
    icon: Icon,
    value,
    label,
    bgColor,
    iconColor
}) => {
    return (
        <div
            className={`${bgColor} p-4 flex flex-col gap-2 items-center rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer will-change-transform`}
        >
            <div className='p-2 bg-white/50 rounded-lg backdrop-blur-sm'>
                <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
            </div>
            <p className='text-2xl font-bold text-gray-900 tracking-tight'>
                {value}
            </p>
            <p className='text-[#4A5565] text-xs font-medium text-center leading-tight'>
                {label}
            </p>
        </div>
    );
};

// Memoize component with custom comparison
export const RealtimeStatsCard = memo(RealtimeStatsCardComponent, (prevProps, nextProps) => {
    return (
        prevProps.value === nextProps.value &&
        prevProps.label === nextProps.label &&
        prevProps.bgColor === nextProps.bgColor &&
        prevProps.iconColor === nextProps.iconColor
        // Icon doesn't need comparison
    );
});
RealtimeStatsCard.displayName = 'RealtimeStatsCard';

export default RealtimeStatsCard;