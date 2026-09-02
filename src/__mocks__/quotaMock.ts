// Mock Quota/Credit Data for Development

import { QuotaBalance, UsageHistory, UsageLogItem } from '@/types/quota.types';

export const mockQuotaBalance: QuotaBalance = {
  credits_remaining: 45,
  credits_total: 50,
  plan_id: 'FREE',
  plan_name: 'Free Plan',
};

export const mockQuotaBalanceStarter: QuotaBalance = {
  credits_remaining: 85,
  credits_total: 100,
  plan_id: 'STARTER',
  plan_name: 'Starter Plan',
  plan_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
};

export const mockQuotaBalancePro: QuotaBalance = {
  credits_remaining: 425,
  credits_total: 500,
  plan_id: 'PRO',
  plan_name: 'Pro Plan',
  plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
};

export const mockQuotaBalanceLow: QuotaBalance = {
  credits_remaining: 8,
  credits_total: 50,
  plan_id: 'FREE',
  plan_name: 'Free Plan',
};

// Generate mock usage log items
function generateMockUsageLogItem(
  index: number,
  daysAgo: number,
  feature: string
): UsageLogItem {
  const featureData: Record<
    string,
    { label: string; credits: number; tokens: number; cost: number }
  > = {
    resume_parse: {
      label: 'Resume Parsed',
      credits: 5,
      tokens: 450,
      cost: 0.32,
    },
    ats_scan: {
      label: 'ATS Scan',
      credits: 5,
      tokens: 350,
      cost: 0.25,
    },
    enhancement: {
      label: 'Resume Enhanced',
      credits: 10,
      tokens: 1200,
      cost: 0.85,
    },
    job_match: {
      label: 'Job Match Analysis',
      credits: 8,
      tokens: 1200,
      cost: 0.85,
    },
    jd_parse: {
      label: 'Job Description Parsed',
      credits: 3,
      tokens: 300,
      cost: 0.21,
    },
    ai_review: {
      label: 'AI Resume Review',
      credits: 5,
      tokens: 500,
      cost: 0.35,
    },
    english_assessment: {
      label: 'English Assessment',
      credits: 15,
      tokens: 2000,
      cost: 1.42,
    },
  };

  const data = featureData[feature] || featureData.resume_parse;

  return {
    id: `log_${index}`,
    user_id: 'user_123',
    feature,
    feature_label: data.label,
    credits_used: data.credits,
    tokens_used: data.tokens,
    cost_inr: data.cost,
    timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    from_cache: Math.random() > 0.7, // 30% from cache
  };
}

export const mockUsageHistory: UsageHistory = {
  total: 45,
  items: [
    generateMockUsageLogItem(1, 0, 'resume_parse'), // Today
    generateMockUsageLogItem(2, 0, 'ats_scan'), // Today
    generateMockUsageLogItem(3, 1, 'enhancement'), // Yesterday
    generateMockUsageLogItem(4, 1, 'job_match'), // Yesterday
    generateMockUsageLogItem(5, 2, 'ats_scan'), // 2 days ago
    generateMockUsageLogItem(6, 2, 'jd_parse'), // 2 days ago
    generateMockUsageLogItem(7, 3, 'ai_review'), // 3 days ago
    generateMockUsageLogItem(8, 4, 'resume_parse'), // 4 days ago
    generateMockUsageLogItem(9, 5, 'ats_scan'), // 5 days ago
    generateMockUsageLogItem(10, 6, 'enhancement'), // 6 days ago
    generateMockUsageLogItem(11, 7, 'job_match'), // 1 week ago
    generateMockUsageLogItem(12, 8, 'ats_scan'), // 8 days ago
    generateMockUsageLogItem(13, 10, 'resume_parse'), // 10 days ago
    generateMockUsageLogItem(14, 12, 'jd_parse'), // 12 days ago
    generateMockUsageLogItem(15, 14, 'english_assessment'), // 2 weeks ago
    generateMockUsageLogItem(16, 15, 'ats_scan'), // 15 days ago
    generateMockUsageLogItem(17, 18, 'enhancement'), // 18 days ago
    generateMockUsageLogItem(18, 20, 'job_match'), // 20 days ago
    generateMockUsageLogItem(19, 22, 'resume_parse'), // 22 days ago
    generateMockUsageLogItem(20, 25, 'ats_scan'), // 25 days ago
  ],
  pagination: {
    page: 1,
    limit: 20,
    total_pages: 3,
    has_next: true,
    has_prev: false,
  },
};

// Mock for empty usage history (new user)
export const mockUsageHistoryEmpty: UsageHistory = {
  total: 0,
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  },
};

// Mock for power user with lots of activity
export const mockUsageHistoryPowerUser: UsageHistory = {
  total: 120,
  items: Array.from({ length: 20 }, (_, i) => {
    const features = ['resume_parse', 'ats_scan', 'enhancement', 'job_match', 'ai_review'];
    const randomFeature = features[Math.floor(Math.random() * features.length)];
    const daysAgo = Math.floor(i / 3); // Multiple actions per day
    return generateMockUsageLogItem(i + 1, daysAgo, randomFeature);
  }),
  pagination: {
    page: 1,
    limit: 20,
    total_pages: 6,
    has_next: true,
    has_prev: false,
  },
};

// Helper function to get mock quota data
export function getMockQuotaBalance(state: 'default' | 'starter' | 'pro' | 'low' = 'default'): QuotaBalance {
  switch (state) {
    case 'starter':
      return mockQuotaBalanceStarter;
    case 'pro':
      return mockQuotaBalancePro;
    case 'low':
      return mockQuotaBalanceLow;
    default:
      return mockQuotaBalance;
  }
}

// Helper function to get mock usage history
export function getMockUsageHistory(
  state: 'default' | 'empty' | 'power' = 'default',
  page: number = 1,
  limit: number = 20
): UsageHistory {
  let baseHistory: UsageHistory;

  switch (state) {
    case 'empty':
      baseHistory = mockUsageHistoryEmpty;
      break;
    case 'power':
      baseHistory = mockUsageHistoryPowerUser;
      break;
    default:
      baseHistory = mockUsageHistory;
      break;
  }

  // Simulate pagination
  if (page > 1) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      ...baseHistory,
      items: baseHistory.items.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(baseHistory.total / limit),
        has_next: endIndex < baseHistory.total,
        has_prev: page > 1,
      },
    };
  }

  return baseHistory;
}
