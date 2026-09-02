import React, { memo, useMemo } from 'react';
import { Users, Zap, Database, Gauge } from 'lucide-react';
import RealtimeStatsCard from './RealtimestatsCard';
import Switch from '@/components/common/Switch';
import { toggleAutoRefresh } from '@/api/adminDashboardOverviewApi';
import { logger } from '@/lib/logger';

interface RealtimeStatsData {
    active_users_now: number;
    api_requests_per_min: number;
    db_queries_per_sec: number;
    cache_hit_rate: number;
    error_rate: number;
    timestamp: string;
}

interface RealtimeStatsProps {
    data: RealtimeStatsData | null;
    autoRefresh?: boolean;
    refreshInterval?: number;
    onAutoRefreshChange?: (enabled: boolean) => void;
}

const RealtimeStatsComponent: React.FC<RealtimeStatsProps> = ({
    data,
    autoRefresh = false,
    refreshInterval = 30,
    onAutoRefreshChange
}) => {
    // Handle auto-refresh toggle
    const handleAutoRefreshToggle = async () => {
        try {
            await toggleAutoRefresh(!autoRefresh);
            onAutoRefreshChange?.(!autoRefresh);
            logger.debug(`Auto-refresh toggled to: ${!autoRefresh}`);
        } catch (error) {
            logger.error('Error toggling auto-refresh:', error);
        }
    };

    // Memoize stats configuration to prevent recreation on every render
    const stats = useMemo(() => {
        if (!data) {
            return [];
        }
        return [
        {
            icon: Users,
            value: data.active_users_now,
            label: 'Active Users',
            bgColor: 'bg-[#DBEAFE]',
            iconColor: 'text-[#155DFC]'
        },
        {
            icon: Zap,
            value: data.api_requests_per_min,
            label: 'API Requests/min',
            bgColor: 'bg-[#F3E8FF]',
            iconColor: 'text-[#9810FA]'
        },
        {
            icon: Database,
            value: data.db_queries_per_sec.toFixed(2),
            label: 'DB Queries/sec',
            bgColor: 'bg-[#FCE7F3]',
            iconColor: 'text-[#E60076]'
        },
        {
            icon: Gauge,
            value: `${data.cache_hit_rate.toFixed(1)}%`,
            label: 'Cache Hit Rate',
            bgColor: 'bg-[#DCFCE7]',
            iconColor: 'text-[#00A63E]'
        }
        ];
    }, [data]);

    // Show loading state when data is null
    if (!data) {
        return (
            <div className='bg-white p-6 my-4 rounded-lg shadow-sm border border-gray-100'>
                <div className='text-center py-8 text-gray-500'>
                    <p>Loading real-time statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-white p-6 my-4 rounded-lg shadow-sm border border-gray-100'>
            <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
                <div>
                    <h1 className='font-semibold text-lg text-gray-900'>Real-Time Statistics</h1>
                    <p className='text-[#6A7282] text-sm mt-0.5'>Live system metrics</p>
                </div>
                <div className='rounded-lg border border-[#00C950] bg-green-50 px-3 py-1.5 flex items-center gap-2'>
                    <span className='relative flex h-2 w-2'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C950] opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-2 w-2 bg-[#00C950]'></span>
                    </span>
                    <span className='text-[#00A63E] font-semibold text-sm'>Live</span>
                </div>
                <div className='flex items-center gap-3'>
                    <span className='text-sm font-medium text-gray-400 hidden sm:inline'>Auto-refresh ({refreshInterval}s)</span>
                    <Switch
                        checked={autoRefresh}
                        onChange={handleAutoRefreshToggle}
                    />
                </div>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                {stats.map((stat, index) => (
                    <RealtimeStatsCard
                        key={`stat-${index}-${stat.label}`}
                        {...stat}
                    />
                ))}
            </div>
        </div>
    );
};

// Memoize component
export const RealtimeStats = memo(RealtimeStatsComponent);
RealtimeStats.displayName = 'RealtimeStats';

export default RealtimeStats;
