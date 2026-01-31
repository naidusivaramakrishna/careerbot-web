import React, { memo } from 'react';
import { Clock } from 'lucide-react';

export interface ActivityItem {
    user_name: string;
    action: string;
    timestamp: string;
    user_initial: string;
}

interface RecentActivityListProps {
    activities: ActivityItem[];
    maxHeight?: string;
}

// Individual activity item component for better memoization
const ActivityItemComponent: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
    // Generate consistent color based on initial
    const colorClasses = {
        'A-E': 'bg-blue-100 text-blue-600',
        'F-J': 'bg-purple-100 text-purple-600',
        'K-O': 'bg-green-100 text-green-600',
        'P-T': 'bg-orange-100 text-orange-600',
        'U-Z': 'bg-pink-100 text-pink-600'
    };

    const getColorClass = (initial: string) => {
        const charCode = initial.toUpperCase().charCodeAt(0);
        if (charCode >= 65 && charCode <= 69) return colorClasses['A-E'];
        if (charCode >= 70 && charCode <= 74) return colorClasses['F-J'];
        if (charCode >= 75 && charCode <= 79) return colorClasses['K-O'];
        if (charCode >= 80 && charCode <= 84) return colorClasses['P-T'];
        return colorClasses['U-Z'];
    };

    return (
        <li className="flex justify-between items-center py-3 px-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors rounded-lg group">
            <div className='flex gap-3 items-center flex-1 min-w-0'>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0 ${getColorClass(activity.user_initial)}`}>
                    {activity.user_initial}
                </div>
                <div className='flex-1 min-w-0'>
                    <p className="font-semibold text-sm text-gray-900 truncate">
                        {activity.user_name}
                    </p>
                    <p className="text-[#4A5565] text-xs truncate">
                        {activity.action}
                    </p>
                </div>
            </div>
            <div className='flex items-center gap-1.5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2'>
                <Clock className='w-3.5 h-3.5' />
                <span className="text-xs font-medium whitespace-nowrap">
                    {activity.timestamp}
                </span>
            </div>
        </li>
    );
};

const ActivityItem = memo(ActivityItemComponent);
ActivityItem.displayName = 'ActivityItem';

const RecentActivityListComponent: React.FC<RecentActivityListProps> = ({
    activities,
    maxHeight = '300px'
}) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-12">
                <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3'>
                    <Clock className='w-8 h-8 text-gray-400' />
                </div>
                <p className="text-gray-500 font-medium">No recent activity</p>
                <p className="text-gray-400 text-sm mt-1">Activity will appear here when users interact with the platform</p>
            </div>
        );
    }

    return (
        <ul
            className='overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400'
            style={{ maxHeight }}
        >
            {activities.map((activity, index) => (
                <ActivityItem
                    key={`${activity.user_name}-${activity.timestamp}-${index}`}
                    activity={activity}
                />
            ))}
        </ul>
    );
};

// Memoize component with shallow comparison
export const RecentActivityList = memo(RecentActivityListComponent);
RecentActivityList.displayName = 'RecentActivityList';

export default RecentActivityList;
