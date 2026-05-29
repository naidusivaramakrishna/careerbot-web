// Subscription and Pricing Type Definitions
// Based on CAREERBOT_USER_DASHBOARD_DESIGN_V3.txt Section 9

export type PlanId = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface SubscriptionPlan {
  plan_id: PlanId;
  plan_name: string;
  price_inr: number; // Monthly price in INR
  price_display: string; // "Rs.0", "Rs.199/mo"
  credits: number;
  features: PlanFeatures;
  popular?: boolean; // Show "POPULAR" badge
  recommended?: boolean; // Show "RECOMMENDED" badge
  is_current?: boolean; // User's current plan
}

export interface PlanFeatures {
  resumes_limit: number | 'unlimited';
  exports_limit: number | 'unlimited';
  ats_scans_limit: number | 'unlimited';
  job_matches_limit: number | 'unlimited';
  assessments_limit: number | 'unlimited';
  ai_features: 'limited' | 'basic' | 'full' | 'full+api';
  support: 'community' | 'email' | 'priority' | 'dedicated';
  additional?: string[]; // Extra features like "Priority support", "API access"
}

// Static plan configuration — must stay in sync with backend plans.py
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    plan_id: 'FREE',
    plan_name: 'Free',
    price_inr: 0,
    price_display: 'Rs.0',
    credits: 50,
    features: {
      resumes_limit: 3,
      exports_limit: 1,
      ats_scans_limit: 5,
      job_matches_limit: 3,
      assessments_limit: 1,
      ai_features: 'limited',
      support: 'community',
    },
  },
  {
    plan_id: 'BASIC',
    plan_name: 'Basic',
    price_inr: 499,
    price_display: 'Rs.499/mo',
    credits: 200,
    features: {
      resumes_limit: 'unlimited',
      exports_limit: 'unlimited',
      ats_scans_limit: 50,
      job_matches_limit: 30,
      assessments_limit: 10,
      ai_features: 'basic',
      support: 'email',
    },
  },
  {
    plan_id: 'PRO',
    plan_name: 'Pro',
    price_inr: 899,
    price_display: 'Rs.899/mo',
    credits: 1000,
    popular: true,
    recommended: true,
    features: {
      resumes_limit: 'unlimited',
      exports_limit: 'unlimited',
      ats_scans_limit: 'unlimited',
      job_matches_limit: 'unlimited',
      assessments_limit: 'unlimited',
      ai_features: 'full',
      support: 'priority',
      additional: ['Priority queue', 'Advanced analytics', 'Interview scheduling'],
    },
  },
  {
    plan_id: 'ENTERPRISE',
    plan_name: 'Enterprise',
    price_inr: 4999,
    price_display: 'Rs.4,999/mo',
    credits: 999999,
    features: {
      resumes_limit: 'unlimited',
      exports_limit: 'unlimited',
      ats_scans_limit: 'unlimited',
      job_matches_limit: 'unlimited',
      assessments_limit: 'unlimited',
      ai_features: 'full+api',
      support: 'dedicated',
      additional: [
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'White-label option',
      ],
    },
  },
];

export interface BillingHistory {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  plan_name: string;
  amount_inr: number;
  status: 'paid' | 'pending' | 'failed';
  payment_date: string; // ISO date
  payment_method?: string; // "Razorpay", "Card ending in 1234"
  invoice_pdf_url?: string;
}

export interface UpgradeRequest {
  plan_id: PlanId;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface UpgradeResponse {
  success: boolean;
  checkout_url?: string; // Razorpay checkout URL
  order_id?: string;
  message?: string;
}

// Helper functions
export function getPlanById(planId: PlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.plan_id === planId);
}

export function getFeatureLimit(
  plan: SubscriptionPlan,
  feature: keyof PlanFeatures
): string {
  const limit = plan.features[feature];
  if (limit === 'unlimited') return 'Unlimited';
  if (typeof limit === 'number') return limit.toString();
  return limit as string;
}

export function isUpgrade(currentPlanId: PlanId, targetPlanId: PlanId): boolean {
  const planOrder: PlanId[] = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlanId);
  const targetIndex = planOrder.indexOf(targetPlanId);
  return targetIndex > currentIndex;
}
