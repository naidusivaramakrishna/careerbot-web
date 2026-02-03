import React, { memo, useMemo } from 'react';
import { Users, Zap, Database, Gauge } from 'lucide-react';
import RealtimeStatsCard from './RealtimestatsCard';

interface RealtimeStatsData {
    users_online: number;
    active_sessions: number;
    api_requests_per_minute: number;
    db_queries_per_second: number;
    cache_hit_rate: number;
}

interface RealtimeStatsProps {
    data: RealtimeStatsData;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

const RealtimeStatsComponent: React.FC<RealtimeStatsProps> = ({
    data,
    autoRefresh = true,
    refreshInterval = 30
}) => {
    // Memoize stats configuration to prevent recreation on every render
    const stats = useMemo(() => [
        {
            icon: Users,
            value: data.users_online,
            label: 'Users Online',
            bgColor: 'bg-[#DBEAFE]',
            iconColor: 'text-[#155DFC]'
        },
        {
            icon: Zap,
            value: data.api_requests_per_minute,
            label: 'API Requests/min',
            bgColor: 'bg-[#F3E8FF]',
            iconColor: 'text-[#9810FA]'
        },
        {
            icon: Database,
            value: data.db_queries_per_second.toFixed(2),
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
    ], [
        data.users_online,
        data.api_requests_per_minute,
        data.db_queries_per_second,
        data.cache_hit_rate
    ]);

    return (
        <div className='bg-white p-6 my-4 rounded-lg shadow-sm border border-gray-100'>
            <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
                <div>
                    <h1 className='font-semibold text-lg text-gray-900'>Real-Time Statistics</h1>
                    <p className='text-[#6A7282] text-sm mt-0.5'>Live system metrics</p>
                </div>

                <div className='flex items-center gap-4'>
                    <div className='rounded-lg border border-[#00C950] bg-green-50 px-3 py-1.5 flex items-center gap-2'>
                        <span className='relative flex h-2 w-2'>
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C950] opacity-75'></span>
                            <span className='relative inline-flex rounded-full h-2 w-2 bg-[#00C950]'></span>
                        </span>
                        <span className='text-[#00A63E] font-semibold text-sm'>Live</span>
                    </div>

                    {autoRefresh && (
                        <div className='text-sm font-medium text-[#4A5565] hidden sm:block'>
                            <span className='text-gray-400'>Auto-refresh:</span> {refreshInterval}s
                        </div>
                    )}
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
