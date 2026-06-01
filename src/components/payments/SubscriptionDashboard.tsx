'use client';

import React, { useEffect, useState } from 'react';
import { SubscriptionManagement } from './SubscriptionManagement';
import { BillingHistory } from './BillingHistory';
import { PlanUpgradeDowngrade } from './PlanUpgradeDowngrade';
import {
  getCurrentSubscription,
  CurrentSubscription,
} from '@/api/paymentApi';
import { CreditCard, History, RefreshCw } from 'lucide-react';

type TabType = 'overview' | 'billing' | 'upgrade';

interface SubscriptionDashboardProps {
  initialTab?: TabType;
}

export function SubscriptionDashboard({ initialTab = 'overview' }: SubscriptionDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [sub] = await Promise.allSettled([getCurrentSubscription()]);
        if (sub.status === 'fulfilled') setSubscription(sub.value);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  const currentPlanId = subscription?.plan_id ?? 'free';

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing History', icon: <History className="w-4 h-4" /> },
    { id: 'upgrade', label: 'Change Plan', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your subscription and view billing history</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="grid grid-cols-3 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 font-semibold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <SubscriptionManagement onUpgrade={() => setActiveTab('upgrade')} />
          )}

          {activeTab === 'billing' && <BillingHistory />}

          {activeTab === 'upgrade' && (
            <PlanUpgradeDowngrade
              currentPlanId={loadingMeta ? 'free' : currentPlanId}
              onUpgradeComplete={() => setActiveTab('overview')}
            />
          )}

        </div>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Contact <a href={`mailto:${COMPANY_CONFIG.supportEmail}`} className="underline font-medium">{COMPANY_CONFIG.supportEmail}</a> for any subscription issues</li>
          <li>• Plan changes take effect immediately</li>
          <li>• You can download invoices from your billing history</li>
        </ul>
      </div>
    </div>
  );
}