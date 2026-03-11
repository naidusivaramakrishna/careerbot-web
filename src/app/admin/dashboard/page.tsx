"use client"
import React, { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react'
import { CreditCard, FileText, IndianRupee, ScanLine, TrendingUp, Users } from 'lucide-react'
import dynamic from 'next/dynamic';
import Dropdown from '@/components/common/CustomDropdown';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  getDashboardOverview,
  getRealtimeStats,
  DashboardPeriod,
  formatMetricValue,
  DashboardOverviewResponse,
  RealtimeStats
} from '@/api/adminDashboardOverviewApi';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Lazy load heavy components
const MetricsGrid = dynamic(() => import('./_components/MetricsGrid').then(mod => ({ default: mod.MetricsGrid })), {
  loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false
});

const RealtimeStatsSection = dynamic(() => import('./_components/RealtimeStats').then(mod => ({ default: mod.RealtimeStats })), {
  loading: () => <div className="h-48 animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false
});

const DashboardChart = dynamic(() => import('./_components/DashboardChart').then(mod => ({ default: mod.DashboardChart })), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false
});

const RecentActivityList = dynamic(() => import('./_components/RecentActivityList').then(mod => ({ default: mod.RecentActivityList })), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false
});

// Immediate loading components
import { ErrorState } from './_components/ErrorState';

// Import mock data and constants
import { userGrowthData, revenueData, CHART_COLORS, PERIOD_MAP } from './_constants/mockData';

// Import access control
import { useAdminAccess } from '../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../_components/LockedPageOverlay';

const DashboardContent = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('monthly');
  const [dashboardData, setDashboardData] = useState<DashboardOverviewResponse | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Optimized fetch with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      logger.info('Fetching dashboard data for period:', period);
      setLoading(true);
      setError(false);

      // Fetch overview and realtime stats in parallel
      const [data, stats] = await Promise.all([
        getDashboardOverview(period),
        getRealtimeStats()
      ]);

      logger.debug('Dashboard data received successfully');
      setDashboardData(data);
      setRealtimeStats(stats);
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Initial fetch - only run once
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch realtime stats more frequently (every 30 seconds) when auto-refresh is enabled
  useEffect(() => {
    if (!dashboardData || !autoRefresh) return; // Don't auto-refresh if no initial data or auto-refresh is disabled

    const interval = setInterval(async () => {
      try {
        const stats = await getRealtimeStats();
        setRealtimeStats(stats);
      } catch (error) {
        logger.error('Error fetching realtime stats:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dashboardData, autoRefresh]);

  // Memoized period change handler
  const handlePeriodChange = useCallback((value: string) => {
    const newPeriod = PERIOD_MAP[value] || 'monthly';
    logger.debug(`Dashboard period changed from ${period} to ${newPeriod}`);
    setPeriod(newPeriod);
  }, [period]);

  // Memoized period label
  const periodLabel = useMemo(() => {
    return period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';
  }, [period]);

  // Memoized metrics data with stable reference
  const metricsData = useMemo(() => {
    if (!dashboardData) return [];

    const { metrics } = dashboardData;

    return [
      {
        title: 'Total Users',
        value: formatMetricValue(metrics.total_users.value),
        growth: metrics.total_users.growth,
        icon: Users,
      },
      {
        title: 'Active Users',
        value: formatMetricValue(metrics.active_users.value),
        growth: metrics.active_users.growth,
        icon: TrendingUp,
      },
      {
        title: 'Resumes Created',
        value: formatMetricValue(metrics.resumes_created.value),
        growth: metrics.resumes_created.growth,
        icon: FileText,
      },
      {
        title: 'ATS Scans',
        value: formatMetricValue(metrics.ats_scans.value),
        growth: metrics.ats_scans.growth,
        icon: ScanLine,
      },
      {
        title: 'Revenue',
        value: formatMetricValue(metrics.revenue.value),
        growth: metrics.revenue.growth,
        icon: IndianRupee,
        prefix: metrics.revenue.currency === 'INR' ? '₹' : '$',
      },
      {
        title: 'Subscriptions',
        value: formatMetricValue(metrics.subscriptions.value),
        growth: metrics.subscriptions.growth,
        icon: CreditCard,
      },
    ];
  }, [dashboardData]);

  // Memoized subscription chart data
  const subscriptionChartData = useMemo(() => {
    if (!dashboardData?.subscription_breakdown?.length) {
      return [
        { name: "Free", value: 59 },
        { name: "Basic", value: 20 },
        { name: "Pro", value: 16 },
        { name: "Enterprise", value: 10 },
      ];
    }
    return dashboardData.subscription_breakdown.map(item => ({
      name: item.plan_name,
      value: item.percentage,
      count: item.count
    })) as Array<{ name: string; value: number; count?: number }>;
  }, [dashboardData?.subscription_breakdown]);

  // Show skeleton loading on first load
  if (loading && !dashboardData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <ErrorState
        fullScreen
        message="Failed to load dashboard data"
        onRetry={fetchDashboardData}
      />
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <ErrorState
        fullScreen
        message="No dashboard data available"
        onRetry={fetchDashboardData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Always visible, no lazy load */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='font-semibold text-xl'>Dashboard</h1>
          <p className='text-[#4A5565] text-xs'>Monitor key metrics and system performance</p>
        </div>
        <Dropdown
          options={["Period", "Today", "Last 7 Days", "Monthly"]}
          defaultValue="Monthly"
          onChange={handlePeriodChange}
          className="w-34"
        />
      </div>

      {/* Metrics Grid - Priority load */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-lg" />}>
        <MetricsGrid
          metrics={metricsData}
          periodLabel={periodLabel}
          columns={3}
        />
      </Suspense>

      {/* Real-time Statistics - Lazy load */}
      <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-lg" />}>
        <RealtimeStatsSection
          data={realtimeStats}
          autoRefresh={autoRefresh}
          refreshInterval={30}
          onAutoRefreshChange={setAutoRefresh}
        />
      </Suspense>

      {/* Charts and Activity Grid - Lazy load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
          <DashboardChart
            title="User Growth"
            data={userGrowthData}
            type="line"
            dataKeys={['users']}
            colors={['#3b82f6']}
            xAxisKey="month"
          />
        </Suspense>

        {/* Revenue & Subscriptions Chart */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
          <DashboardChart
            title="Revenue & Subscriptions"
            data={revenueData}
            type="bar"
            dataKeys={['revenue', 'subscriptions']}
            colors={['#3b82f6', '#f97316']}
            xAxisKey="month"
          />
        </Suspense>

        {/* Subscription Breakdown */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
          <div className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-shadow">
            <h2 className="font-semibold mb-4 text-lg">Subscription Breakdown</h2>
            <DashboardChart
              title=""
              data={subscriptionChartData}
              type="pie"
              dataKeys={['value']}
              colors={CHART_COLORS}
              height={250}
            />
            <div className="grid grid-cols-2 gap-2 mt-4 text-center text-sm">
              {subscriptionChartData.map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  ></span>
                  <span>
                    {item.value}% {item.name}
                    {item.count !== undefined && ` (${item.count})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Suspense>

        {/* Recent Activity */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-lg" />}>
          <div className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-shadow">
            <h2 className="font-semibold mb-4 text-lg">Recent Activity</h2>
            <RecentActivityList
              activities={dashboardData.recent_activity}
              maxHeight="300px"
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('dashboard');

  // Fallback component for error boundary
  const errorFallback = (_error: Error, reset: () => void) => (
    <ErrorState
      fullScreen
      message="An unexpected error occurred in the dashboard"
      onRetry={reset}
    />
  );

  // Block render until access check completes
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check access
  if (!hasAccess) {
    return <LockedPageOverlay requiredRoles={requiredRoles} pageName="Dashboard" />;
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <DashboardContent />
    </ErrorBoundary>
  );
};

export default AdminDashboard;
