import { DashboardPeriod } from '@/api/adminDashboardOverviewApi';

// Mock chart data
export const userGrowthData = [
  { month: "Jan", users: 3500 },
  { month: "Feb", users: 4800 },
  { month: "Mar", users: 6200 },
  { month: "Apr", users: 7500 },
  { month: "May", users: 8900 },
  { month: "Jun", users: 10200 },
  { month: "Jul", users: 13000 },
];

export const revenueData = [
  { month: "Jan", revenue: 30000, subscriptions: 18000 },
  { month: "Feb", revenue: 32000, subscriptions: 28000 },
  { month: "Mar", revenue: 40000, subscriptions: 25000 },
  { month: "Apr", revenue: 42000, subscriptions: 27000 },
  { month: "May", revenue: 45000, subscriptions: 30000 },
  { month: "Jun", revenue: 50000, subscriptions: 32000 },
  { month: "Jul", revenue: 55000, subscriptions: 34000 },
];

export const CHART_COLORS = ["#3b82f6", "#facc15", "#f97316", "#ef4444"];

// Period mapping for dashboard filters
export const PERIOD_MAP: Record<string, DashboardPeriod> = {
  'Today': 'daily',
  'Last 7 Days': 'weekly',
  'Monthly': 'monthly'
};
