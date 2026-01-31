"use client";
import React, { memo, useEffect, useCallback } from 'react';
import Switch from '@/components/common/Switch';
import LoadingSpinner from './LoadingSpinner';
import SectionHeader from './SectionHeader';
import { FeatureFlag } from '../types';

interface FeatureFlagItemProps {
    feature: FeatureFlag;
    onToggle: (key: string, enabled: boolean) => void;
}

const FeatureFlagItem = memo<FeatureFlagItemProps>(({ feature, onToggle }) => {
    const handleToggle = useCallback(() => {
        onToggle(feature.key, feature.enabled);
    }, [feature.key, feature.enabled, onToggle]);

    return (
        <div className="bg-white border border-gray-200 p-4 flex justify-between items-center">
            <div>
                <p className="font-semibold text-sm">{feature.name}</p>
                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
            </div>
            <Switch
                checked={feature.enabled}
                onChange={handleToggle}
            />
        </div>
    );
});
FeatureFlagItem.displayName = 'FeatureFlagItem';

interface FeatureFlagsTabProps {
    isActive: boolean;
    featureFlags: FeatureFlag[];
    loading: boolean;
    onFetch: () => void;
    onToggle: (key: string, enabled: boolean) => void;
    onSaveAll: () => void;
}

const FeatureFlagsTab = memo<FeatureFlagsTabProps>(({
    isActive,
    featureFlags,
    loading,
    onFetch,
    onToggle,
    onSaveAll
}) => {
    useEffect(() => {
        if (isActive) {
            onFetch();
        }
    }, [isActive, onFetch]);

    if (!isActive) return null;

    return (
        <div className="bg-white p-6 rounded-lg">
            <SectionHeader
                title="Manage Feature Flags"
                description="Enable or disable features across the platform"
                action={
                    <button
                        onClick={onSaveAll}
                        disabled={loading}
                        className="bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#4E4EEF] transition disabled:opacity-50"
                    >
                        Save All Changes
                    </button>
                }
            />

            {loading ? (
                <LoadingSpinner message="Loading feature flags..." />
            ) : (
                <div className="flex flex-col mt-6">
                    {featureFlags.map((feature) => (
                        <FeatureFlagItem
                            key={feature.key}
                            feature={feature}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

FeatureFlagsTab.displayName = 'FeatureFlagsTab';

export default FeatureFlagsTab;
