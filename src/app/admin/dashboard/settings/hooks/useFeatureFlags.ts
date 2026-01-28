"use client";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getFeatureFlags, updateFeatureFlags } from '@/api/adminFeatureFlagsApi';
import { FeatureFlag } from '../types';
import { logger } from '@/lib/logger';

interface UseFeatureFlagsReturn {
    featureFlags: FeatureFlag[];
    loading: boolean;
    fetchFeatureFlags: () => Promise<void>;
    handleToggleFeature: (flagKey: string, currentValue: boolean) => Promise<void>;
    handleSaveAllFeatures: () => Promise<void>;
}

export const useFeatureFlags = (): UseFeatureFlagsReturn => {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFeatureFlags = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getFeatureFlags();
            setFeatureFlags(response.flags);
        } catch (error: unknown) {
            logger.error('Error fetching feature flags:', error);
            toast.error('Failed to fetch feature flags');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleToggleFeature = useCallback(async (flagKey: string, currentValue: boolean) => {
        // Optimistic update
        setFeatureFlags(prev =>
            prev.map(flag =>
                flag.key === flagKey ? { ...flag, enabled: !currentValue } : flag
            )
        );

        try {
            await updateFeatureFlags({
                flags: { [flagKey]: !currentValue }
            });

            const formattedKey = flagKey.replace(/_/g, ' ');
            toast.success(`${formattedKey} ${!currentValue ? 'enabled' : 'disabled'}`);
        } catch (error: unknown) {
            logger.error('Error updating feature flag:', error);
            toast.error('Failed to update feature flag');
            // Revert on error
            fetchFeatureFlags();
        }
    }, [fetchFeatureFlags]);

    const handleSaveAllFeatures = useCallback(async () => {
        try {
            const flagsObject: Record<string, boolean> = {};
            featureFlags.forEach(flag => {
                flagsObject[flag.key] = flag.enabled;
            });

            await updateFeatureFlags({ flags: flagsObject });
            toast.success('All feature flags saved successfully');
        } catch (error: unknown) {
            logger.error('Error saving feature flags:', error);
            toast.error('Failed to save feature flags');
        }
    }, [featureFlags]);

    return {
        featureFlags,
        loading,
        fetchFeatureFlags,
        handleToggleFeature,
        handleSaveAllFeatures,
    };
};