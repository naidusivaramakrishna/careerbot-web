"use client";
import React, { memo, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import SectionHeader from './SectionHeader';
import PlanCard from './PlanCard';
import { PlanItem } from '../types';

interface SubscriptionPlansTabProps {
    isActive: boolean;
    plans: PlanItem[];
    loading: boolean;
    onFetch: () => void;
    onEdit: (plan: PlanItem) => void;
}

const SubscriptionPlansTab = memo<SubscriptionPlansTabProps>(({
    isActive,
    plans,
    loading,
    onFetch,
    onEdit
}) => {
    useEffect(() => {
        if (isActive) {
            onFetch();
        }
    }, [isActive, onFetch]);

    if (!isActive) return null;

    return (
        <div>
            <SectionHeader
                title="Manage Subscription plans"
                description="Configure pricing and features for each plan"
            />

            {loading ? (
                <LoadingSpinner message="Loading plans..." />
            ) : plans.length === 0 ? (
                <EmptyState message="No plans found. Create your first plan to get started." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

SubscriptionPlansTab.displayName = 'SubscriptionPlansTab';

export default SubscriptionPlansTab;
