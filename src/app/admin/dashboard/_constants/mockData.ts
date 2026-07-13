import { DashboardPeriod } from '@/api/adminDashboardOverviewApi';

export const CHART_COLORS = ["#3b82f6", "#facc15", "#f97316", "#ef4444"];

export const PERIOD_MAP: Record<string, DashboardPeriod> = {
  'Today': 'daily',
  'Last 7 Days': 'weekly',
  'Monthly': 'monthly'
};
