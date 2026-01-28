import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface HealthCard {
    title: string;
    status: string;
    status_badge: 'healthy' | 'warning' | 'critical';
    metric_value: string;
    metric_label: string;
    icon: 'activity' | 'database' | 'cpu' | 'server' | 'disk';
}

export interface CachePerformance {
    hit_rate: number;
    miss_rate: number;
    evictions: number;
}

export interface DatabaseStats {
    active_connections: number;
    queries_per_second: number;
    slow_queries: number;
    avg_query_time_ms: number;
    total_collections: number;
    total_documents: number;
}

export interface StorageMetrics {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
}

export interface SystemOverviewResponse {
    health_cards: HealthCard[];
    cache_performance: CachePerformance;
    database_stats: DatabaseStats;
    storage_metrics: StorageMetrics;
    last_refreshed: string;
}

export interface TimeSeriesDataPoint {
    timestamp: string;
    value: number;
}

export interface TimeSeries {
    data_points: TimeSeriesDataPoint[];
}

export interface ComparisonData {
    enabled: boolean;
    previous_period: {
        data_points: TimeSeriesDataPoint[];
    };
}

export interface PeriodMetric {
    period: string;
    count: number;
    growth: number | null;
}

export interface ApiRequestMetricsResponse {
    today: PeriodMetric;
    yesterday: PeriodMetric;
    last_7_days: PeriodMetric;
    last_30_days: PeriodMetric;
    peak_load: number;
    time_series: TimeSeries;
    comparison: ComparisonData;
    insight: string;
    last_updated: string;
}

export interface CpuUsageResponse {
    current: number;
    period_average: number;
    peak: number;
    time_series: TimeSeries;
    comparison: ComparisonData;
    insight: string;
    last_updated: string;
}

export interface MemoryUsageResponse {
    current: number;
    period_average: number;
    peak: number;
    time_series: TimeSeries;
    comparison: ComparisonData;
    insight: string;
    last_updated: string;
}

export interface SystemLog {
    id: string;
    message: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    source: 'System' | 'Database' | 'API' | 'Cache' | 'Worker';
    timestamp: string;
    metadata: Record<string, unknown>;
}

export interface SystemLogsResponse {
    logs: SystemLog[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export type MonitoringPeriod = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type LogSource = 'System' | 'Database' | 'API' | 'Cache' | 'Worker';

export interface LogsQueryParams {
    level?: LogLevel;
    source?: LogSource;
    search?: string;
    start_date?: string; // ISO 8601 format
    end_date?: string; // ISO 8601 format
    page?: number;
    page_size?: number;
}

// ==================== ADMIN MONITORING API FUNCTIONS ====================

/**
 * Get system monitoring overview
 * 
 * Quick health snapshot including:
 * - Health status cards (API, Database, Server)
 * - Cache performance statistics
 * - Database performance metrics
 * - Storage usage metrics
 * 
 * Use this for the main system health dashboard
 * 
 * @returns System overview with health cards and metrics
 * 
 * Example:
 * ```typescript
 * const overview = await getSystemOverview();
 * console.log(overview.health_cards); // Array of health status cards
 * console.log(overview.database_stats.queries_per_second); // QPS
 * ```
 */
export const getSystemOverview = async (): Promise<SystemOverviewResponse> => {
    try {
        const response = await httpClient.get<SystemOverviewResponse>(
            '/admin/monitoring/system/overview'
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching system overview:', error);
        throw error;
    }
};

/**
 * Get API request metrics
 * 
 * Provides API request statistics with time series data
 * 
 * Query Parameters:
 * - period: Time period (today, yesterday, last_7_days, last_30_days)
 * - compare_to_previous: If true, includes previous period data (default: false)
 * 
 * Returns:
 * - Request counts for different periods
 * - Peak load information
 * - Time series data for visualization
 * - Optional comparison data
 * - AI-generated insights
 * 
 * @param period - Time period for metrics (default: 'today')
 * @param compareToPrevious - Include previous period comparison (default: false)
 * @returns API request metrics with time series
 * 
 * Example:
 * ```typescript
 * const metrics = await getApiRequestMetrics('last_7_days', true);
 * console.log(metrics.time_series.data_points); // Chart data
 * console.log(metrics.insight); // AI insight
 * ```
 */
export const getApiRequestMetrics = async (
    period: MonitoringPeriod = 'today',
    compareToPrevious: boolean = false
): Promise<ApiRequestMetricsResponse> => {
    try {
        const params = new URLSearchParams({
            period,
            compare_to_previous: compareToPrevious.toString(),
        });

        const response = await httpClient.get<ApiRequestMetricsResponse>(
            `/admin/monitoring/api-requests?${params.toString()}`
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching API request metrics:', error);
        throw error;
    }
};

/**
 * Get CPU usage metrics
 * 
 * Provides CPU usage statistics with historical trends
 * 
 * Query Parameters:
 * - period: Time period (today, yesterday, last_7_days, last_30_days)
 * - compare_to_previous: If true, includes previous period data (default: false)
 * 
 * Returns:
 * - Current CPU usage percentage
 * - Period average
 * - Peak usage
 * - Time series data for charts
 * - Optional comparison with previous period
 * - AI-generated insights
 * 
 * @param period - Time period for metrics (default: 'today')
 * @param compareToPrevious - Include previous period comparison (default: false)
 * @returns CPU usage metrics with time series
 * 
 * Example:
 * ```typescript
 * const cpu = await getCpuUsage('last_7_days', true);
 * console.log(`Current: ${cpu.current}%`);
 * console.log(`Average: ${cpu.period_average}%`);
 * console.log(`Peak: ${cpu.peak}%`);
 * ```
 */
export const getCpuUsage = async (
    period: MonitoringPeriod = 'today',
    compareToPrevious: boolean = false
): Promise<CpuUsageResponse> => {
    try {
        const params = new URLSearchParams({
            period,
            compare_to_previous: compareToPrevious.toString(),
        });

        const response = await httpClient.get<CpuUsageResponse>(
            `/admin/monitoring/cpu-usage?${params.toString()}`
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching CPU usage:', error);
        throw error;
    }
};

/**
 * Get memory usage metrics
 * 
 * Provides memory usage statistics with historical trends
 * 
 * Query Parameters:
 * - period: Time period (today, yesterday, last_7_days, last_30_days)
 * - compare_to_previous: If true, includes previous period data (default: false)
 * 
 * Returns:
 * - Current memory usage percentage
 * - Period average
 * - Peak usage
 * - Time series data for charts
 * - Optional comparison with previous period
 * - AI-generated insights
 * 
 * @param period - Time period for metrics (default: 'today')
 * @param compareToPrevious - Include previous period comparison (default: false)
 * @returns Memory usage metrics with time series
 * 
 * Example:
 * ```typescript
 * const memory = await getMemoryUsage('today', true);
 * console.log(`Current: ${memory.current}%`);
 * console.log(`Peak: ${memory.peak}%`);
 * ```
 */
export const getMemoryUsage = async (
    period: MonitoringPeriod = 'today',
    compareToPrevious: boolean = false
): Promise<MemoryUsageResponse> => {
    try {
        const params = new URLSearchParams({
            period,
            compare_to_previous: compareToPrevious.toString(),
        });

        const response = await httpClient.get<MemoryUsageResponse>(
            `/admin/monitoring/memory-usage?${params.toString()}`
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching memory usage:', error);
        throw error;
    }
};

/**
 * Get system logs
 * 
 * Retrieves system logs with advanced filtering options
 * 
 * Query Parameters:
 * - level: Filter by log level (INFO, WARNING, ERROR, CRITICAL)
 * - source: Filter by source (System, Database, API, Cache, Worker)
 * - search: Search in message text
 * - start_date: Filter from date (ISO 8601 format)
 * - end_date: Filter to date (ISO 8601 format)
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 50, max: 100)
 * 
 * @param params - Query parameters for filtering
 * @returns Paginated system logs
 * 
 * Example:
 * ```typescript
 * // Get ERROR logs from API source
 * const logs = await getSystemLogs({
 *   level: 'ERROR',
 *   source: 'API',
 *   page: 1,
 *   page_size: 50
 * });
 * 
 * // Search for specific errors
 * const searchLogs = await getSystemLogs({
 *   search: 'timeout',
 *   level: 'ERROR',
 *   start_date: '2024-01-01T00:00:00Z'
 * });
 * ```
 */
export const getSystemLogs = async (
    params?: LogsQueryParams
): Promise<SystemLogsResponse> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.level) queryParams.append('level', params.level);
        if (params?.source) queryParams.append('source', params.source);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const url = `/admin/monitoring/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get<SystemLogsResponse>(url);
        return response.data;
    } catch (error) {
        logger.error('Error fetching system logs:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get health status by component
 * 
 * Helper to get health status for a specific component
 */
export const getHealthStatusByComponent = async (
    component: 'API' | 'Database' | 'Server'
): Promise<HealthCard | undefined> => {
    try {
        const overview = await getSystemOverview();
        return overview.health_cards.find(card =>
            card.title.toLowerCase().includes(component.toLowerCase())
        );
    } catch (error) {
        logger.error(`Error fetching ${component} health status:`, error);
        throw error;
    }
};

/**
 * Get critical logs
 * 
 * Helper to get only CRITICAL level logs
 */
export const getCriticalLogs = async (
    page: number = 1,
    pageSize: number = 50
): Promise<SystemLogsResponse> => {
    return getSystemLogs({
        level: 'CRITICAL',
        page,
        page_size: pageSize,
    });
};

/**
 * Get error logs
 * 
 * Helper to get only ERROR level logs
 */
export const getErrorLogs = async (
    page: number = 1,
    pageSize: number = 50
): Promise<SystemLogsResponse> => {
    return getSystemLogs({
        level: 'ERROR',
        page,
        page_size: pageSize,
    });
};

/**
 * Get recent logs
 * 
 * Helper to get most recent logs (last 24 hours)
 */
export const getRecentLogs = async (
    page: number = 1,
    pageSize: number = 50
): Promise<SystemLogsResponse> => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    return getSystemLogs({
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
    });
};

/**
 * Check if system is healthy
 * 
 * Helper to determine overall system health
 */
export const isSystemHealthy = async (): Promise<boolean> => {
    try {
        const overview = await getSystemOverview();
        return overview.health_cards.every(card => card.status_badge === 'healthy');
    } catch (error) {
        logger.error('Error checking system health:', error);
        return false;
    }
};

/**
 * Get status badge color
 * 
 * Utility to get color class for status badges
 */
export const getStatusBadgeColor = (status: 'healthy' | 'warning' | 'critical'): string => {
    switch (status) {
        case 'healthy':
            return 'bg-green-100 text-green-800';
        case 'warning':
            return 'bg-yellow-100 text-yellow-800';
        case 'critical':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Get log level color
 * 
 * Utility to get color class for log levels
 */

export const getLogLevelColor = (level: LogLevel): string => {
    switch (level.toLowerCase()) {
        case 'warning':
            return 'text-white bg-[#AB8800]';
        case 'error':
            return 'text-white bg-[#FF0000]';
        case 'critical':
            return 'text-white bg-[#DC2626]';
        case 'info':
            return 'text-white bg-[#437DFF]';
        default:
            return 'text-white bg-[#437DFF]';
    }
};
/**
 * Format timestamp
 * 
 * Utility to format ISO timestamps to readable format
 */
export const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

/**
 * Get storage usage color
 * 
 * Utility to get color based on storage usage percentage
 */
export const getStorageUsageColor = (usagePercent: number): string => {
    if (usagePercent >= 90) return 'text-red-600';
    if (usagePercent >= 75) return 'text-yellow-600';
    return 'text-green-600';
};

/**
 * Format bytes to GB
 * 
 * Utility to format bytes to GB with decimal places
 */
export const formatBytesToGB = (bytes: number): string => {
    return (bytes / (1024 ** 3)).toFixed(2);
};