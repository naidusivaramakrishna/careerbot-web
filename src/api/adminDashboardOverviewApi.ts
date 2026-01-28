import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface DashboardMetric {
    value: number;
    growth: number;
    previous_value: number;
}

export interface RevenueMetric extends DashboardMetric {
    currency: string;
}

export interface DashboardMetrics {
    total_users: DashboardMetric;
    active_users: DashboardMetric;
    resumes_created: DashboardMetric;
    ats_scans: DashboardMetric;
    revenue: RevenueMetric;
    subscriptions: DashboardMetric;
}

export interface RealtimeStats {
    users_online: number;
    active_sessions: number;
    api_requests_per_minute: number;
    db_queries_per_second: number;
    cache_hit_rate: number;
}

export interface SubscriptionBreakdownItem {
    plan_name: string;
    count: number;
    percentage: number;
    revenue: number;
}

export interface RecentActivityItem {
    user_name: string;
    action: string;
    timestamp: string;
    user_initial: string;
}

export interface DashboardOverviewResponse {
    period: 'daily' | 'weekly' | 'monthly';
    metrics: DashboardMetrics;
    realtime_stats: RealtimeStats;
    subscription_breakdown: SubscriptionBreakdownItem[];
    recent_activity: RecentActivityItem[];
    timestamp: string;
}

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly';

// ==================== ADMIN DASHBOARD OVERVIEW API FUNCTIONS ====================

/**
 * Get dashboard overview with analytics
 * 
 * Provides comprehensive dashboard metrics including:
 * - User statistics (total users, active users)
 * - Content metrics (resumes created, ATS scans)
 * - Revenue and subscription data
 * - Real-time system statistics
 * - Subscription breakdown
 * - Recent user activity
 * 
 * Period Options:
 * - `daily`: Compare last 24h vs previous 24h
 * - `weekly`: Compare last 7d vs previous 7d
 * - `monthly`: Compare last 30d vs previous 30d (default)
 * 
 * @param period - Time period for metrics comparison (default: 'monthly')
 * @returns Dashboard overview with all metrics
 * 
 * Example:
 * ```typescript
 * const overview = await getDashboardOverview('weekly');
 * console.log(overview.metrics.total_users.growth); // Growth percentage
 * console.log(overview.realtime_stats.users_online); // Current online users
 * ```
 */
export const getDashboardOverview = async (
    period: DashboardPeriod = 'monthly'
): Promise<DashboardOverviewResponse> => {
    try {
        const response = await httpClient.get<DashboardOverviewResponse>(
            `/admin/analytics/dashboard/overview?period=${period}`
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching dashboard overview:', error);
        throw error;
    }
};

/**
 * Get total users metric
 * 
 * Helper function to get just the total users metric
 */
export const getTotalUsersMetric = async (
    period: DashboardPeriod = 'monthly'
): Promise<DashboardMetric> => {
    try {
        const overview = await getDashboardOverview(period);
        return overview.metrics.total_users;
    } catch (error) {
        logger.error('Error fetching total users metric:', error);
        throw error;
    }
};

/**
 * Get active users metric
 * 
 * Helper function to get just the active users metric
 */
export const getActiveUsersMetric = async (
    period: DashboardPeriod = 'monthly'
): Promise<DashboardMetric> => {
    try {
        const overview = await getDashboardOverview(period);
        return overview.metrics.active_users;
    } catch (error) {
        logger.error('Error fetching active users metric:', error);
        throw error;
    }
};

/**
 * Get revenue metric
 * 
 * Helper function to get just the revenue metric
 */
export const getRevenueMetric = async (
    period: DashboardPeriod = 'monthly'
): Promise<RevenueMetric> => {
    try {
        const overview = await getDashboardOverview(period);
        return overview.metrics.revenue;
    } catch (error) {
        logger.error('Error fetching revenue metric:', error);
        throw error;
    }
};

/**
 * Get real-time statistics
 * 
 * Helper function to get just the real-time stats
 */
export const getRealtimeStats = async (): Promise<RealtimeStats> => {
    try {
        const overview = await getDashboardOverview('daily'); // Use daily for real-time
        return overview.realtime_stats;
    } catch (error) {
        logger.error('Error fetching realtime stats:', error);
        throw error;
    }
};

/**
 * Get subscription breakdown
 * 
 * Helper function to get subscription breakdown by plan
 */
export const getSubscriptionBreakdown = async (
    period: DashboardPeriod = 'monthly'
): Promise<SubscriptionBreakdownItem[]> => {
    try {
        const overview = await getDashboardOverview(period);
        return overview.subscription_breakdown;
    } catch (error) {
        logger.error('Error fetching subscription breakdown:', error);
        throw error;
    }
};

/**
 * Get recent activity
 * 
 * Helper function to get recent user activity
 */
export const getRecentActivity = async (): Promise<RecentActivityItem[]> => {
    try {
        const overview = await getDashboardOverview('daily'); // Use daily for recent activity
        return overview.recent_activity;
    } catch (error) {
        logger.error('Error fetching recent activity:', error);
        throw error;
    }
};

/**
 * Calculate growth percentage
 * 
 * Utility function to calculate growth percentage
 */
export const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

/**
 * Format metric value
 * 
 * Utility function to format metric values with appropriate suffixes
 */
export const formatMetricValue = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

/**
 * Format currency
 * 
 * Utility function to format currency values
 */
export const formatCurrency = (
    value: number,
    currency: string = 'INR'
): string => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${formatMetricValue(value)}`;
};

/**
 * Get growth trend indicator
 * 
 * Returns the trend direction based on growth percentage
 */
export const getGrowthTrend = (
    growth: number
): 'up' | 'down' | 'neutral' => {
    if (growth > 0) return 'up';
    if (growth < 0) return 'down';
    return 'neutral';
};

/**
 * Get growth color
 * 
 * Returns the appropriate color for growth indicators
 */
export const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
};