import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
}

export interface FeatureFlagsResponse {
    flags: FeatureFlag[];
    updated_at: string;
}

export interface UpdateFeatureFlagsRequest {
    flags: {
        [key: string]: boolean;
    };
}

export interface UpdateFeatureFlagsResponse {
    flags: FeatureFlag[];
    updated_at: string;
}

// Feature flag keys enum for type safety
export enum FeatureFlagKey {
    RESUME_BUILDER = 'resume_builder',
    JOB_MATCH = 'job_match',
    ATS_SCAN = 'ats_scan',
    JOB_ALERTS = 'job_alerts',
    LINKEDIN_IMPORT = 'linkedin_import',
    EMAIL_NOTIFICATIONS = 'email_notifications',
    BETA_FEATURES = 'beta_features',
    DARK_MODE = 'dark_mode',
}

// ==================== ADMIN FEATURE FLAGS API FUNCTIONS ====================

/**
 * Get all feature flags
 * 
 * Returns list of all features with their enabled/disabled status
 * 
 * Each feature includes:
 * - key: Unique identifier
 * - name: Display name
 * - description: Feature description
 * - enabled: Current state (true/false)
 * 
 * @returns All feature flags with their current state
 * 
 * Example:
 * ```typescript
 * const flags = await getFeatureFlags();
 * const atsScanEnabled = flags.flags.find(f => f.key === 'ats_scan')?.enabled;
 * // // console.log(`ATS Scan is ${atsScanEnabled ? 'enabled' : 'disabled'}`);
 * ```
 */
export const getFeatureFlags = async (): Promise<FeatureFlagsResponse> => {
    try {
        const response = await httpClient.get<FeatureFlagsResponse>(
            '/admin/settings/feature-flags'
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching feature flags:', error);
        throw error;
    }
};

/**
 * Update feature flags
 * 
 * Update one or more feature flags at once
 * Only the flags provided in the request will be updated
 * 
 * @param flags - Object with feature keys and their new enabled state
 * @returns Updated feature flags list
 * 
 * Example:
 * ```typescript
 * // Enable beta features and dark mode
 * const updated = await updateFeatureFlags({
 *   flags: {
 *     beta_features: true,
 *     dark_mode: true,
 *     ats_scan: false
 *   }
 * });
 * 
 * // // console.log('Flags updated:', updated.updated_at);
 * ```
 */
export const updateFeatureFlags = async (
    data: UpdateFeatureFlagsRequest
): Promise<UpdateFeatureFlagsResponse> => {
    try {
        const response = await httpClient.put<UpdateFeatureFlagsResponse>(
            '/admin/settings/feature-flags',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error: unknown) {
        logger.error('Error updating feature flags:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get specific feature flag status
 * 
 * Helper to check if a specific feature is enabled
 * 
 * @param flagKey - The feature flag key
 * @returns Boolean indicating if feature is enabled
 * 
 * Example:
 * ```typescript
 * const isEnabled = await isFeatureEnabled('ats_scan');
 * if (isEnabled) {
 *   // Show ATS scan feature
 * }
 * ```
 */
export const isFeatureEnabled = async (
    flagKey: string | FeatureFlagKey
): Promise<boolean> => {
    try {
        const flags = await getFeatureFlags();
        const flag = flags.flags.find(f => f.key === flagKey);
        return flag?.enabled ?? false;
    } catch (error) {
        logger.error(`Error checking feature flag ${flagKey}:`, error);
        return false;
    }
};

/**
 * Toggle a single feature flag
 * 
 * Helper to toggle a single feature on/off
 * 
 * @param flagKey - The feature flag key to toggle
 * @param enabled - New enabled state
 * @returns Updated feature flags
 * 
 * Example:
 * ```typescript
 * // Enable dark mode
 * await toggleFeature('dark_mode', true);
 * 
 * // Disable beta features
 * await toggleFeature('beta_features', false);
 * ```
 */
export const toggleFeature = async (
    flagKey: string | FeatureFlagKey,
    enabled: boolean
): Promise<UpdateFeatureFlagsResponse> => {
    return updateFeatureFlags({
        flags: {
            [flagKey]: enabled,
        },
    });
};

/**
 * Enable a feature
 * 
 * Helper to enable a specific feature
 */
export const enableFeature = async (
    flagKey: string | FeatureFlagKey
): Promise<UpdateFeatureFlagsResponse> => {
    return toggleFeature(flagKey, true);
};

/**
 * Disable a feature
 * 
 * Helper to disable a specific feature
 */
export const disableFeature = async (
    flagKey: string | FeatureFlagKey
): Promise<UpdateFeatureFlagsResponse> => {
    return toggleFeature(flagKey, false);
};

/**
 * Get enabled features
 * 
 * Helper to get list of all enabled features
 * 
 * @returns Array of enabled feature flags
 */
export const getEnabledFeatures = async (): Promise<FeatureFlag[]> => {
    try {
        const flags = await getFeatureFlags();
        return flags.flags.filter(f => f.enabled);
    } catch (error) {
        logger.error('Error fetching enabled features:', error);
        throw error;
    }
};

/**
 * Get disabled features
 * 
 * Helper to get list of all disabled features
 * 
 * @returns Array of disabled feature flags
 */
export const getDisabledFeatures = async (): Promise<FeatureFlag[]> => {
    try {
        const flags = await getFeatureFlags();
        return flags.flags.filter(f => !f.enabled);
    } catch (error) {
        logger.error('Error fetching disabled features:', error);
        throw error;
    }
};

/**
 * Enable multiple features at once
 * 
 * Helper to enable multiple features in a single request
 * 
 * @param flagKeys - Array of feature flag keys to enable
 * @returns Updated feature flags
 * 
 * Example:
 * ```typescript
 * await enableMultipleFeatures([
 *   'beta_features',
 *   'dark_mode',
 *   'email_notifications'
 * ]);
 * ```
 */
export const enableMultipleFeatures = async (
    flagKeys: (string | FeatureFlagKey)[]
): Promise<UpdateFeatureFlagsResponse> => {
    const flags: { [key: string]: boolean } = {};
    flagKeys.forEach(key => {
        flags[key] = true;
    });
    return updateFeatureFlags({ flags });
};

/**
 * Disable multiple features at once
 * 
 * Helper to disable multiple features in a single request
 * 
 * @param flagKeys - Array of feature flag keys to disable
 * @returns Updated feature flags
 * 
 * Example:
 * ```typescript
 * await disableMultipleFeatures([
 *   'beta_features',
 *   'dark_mode'
 * ]);
 * ```
 */
export const disableMultipleFeatures = async (
    flagKeys: (string | FeatureFlagKey)[]
): Promise<UpdateFeatureFlagsResponse> => {
    const flags: { [key: string]: boolean } = {};
    flagKeys.forEach(key => {
        flags[key] = false;
    });
    return updateFeatureFlags({ flags });
};

/**
 * Get feature flag by key
 * 
 * Helper to get a specific feature flag details
 * 
 * @param flagKey - The feature flag key
 * @returns Feature flag details or undefined
 */
export const getFeatureFlagByKey = async (
    flagKey: string | FeatureFlagKey
): Promise<FeatureFlag | undefined> => {
    try {
        const flags = await getFeatureFlags();
        return flags.flags.find(f => f.key === flagKey);
    } catch (error) {
        logger.error(`Error fetching feature flag ${flagKey}:`, error);
        throw error;
    }
};

/**
 * Get feature flags count
 * 
 * Helper to get count of enabled/disabled features
 * 
 * @returns Object with enabled and disabled counts
 */
export const getFeatureFlagsCount = async (): Promise<{
    total: number;
    enabled: number;
    disabled: number;
}> => {
    try {
        const flags = await getFeatureFlags();
        const enabled = flags.flags.filter(f => f.enabled).length;
        return {
            total: flags.flags.length,
            enabled,
            disabled: flags.flags.length - enabled,
        };
    } catch (error) {
        logger.error('Error getting feature flags count:', error);
        throw error;
    }
};

/**
 * Search feature flags
 * 
 * Helper to search features by name or description
 * 
 * @param query - Search query
 * @returns Filtered feature flags
 */
export const searchFeatureFlags = async (
    query: string
): Promise<FeatureFlag[]> => {
    try {
        const flags = await getFeatureFlags();
        const lowerQuery = query.toLowerCase();
        return flags.flags.filter(
            f =>
                f.name.toLowerCase().includes(lowerQuery) ||
                f.description.toLowerCase().includes(lowerQuery) ||
                f.key.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        logger.error('Error searching feature flags:', error);
        throw error;
    }
};

/**
 * Reset all features to default state
 * 
 * Helper to set commonly used features to enabled
 * and experimental features to disabled
 * 
 * @returns Updated feature flags
 */
export const resetFeaturesToDefault = async (): Promise<UpdateFeatureFlagsResponse> => {
    return updateFeatureFlags({
        flags: {
            resume_builder: true,
            job_match: true,
            ats_scan: true,
            job_alerts: true,
            linkedin_import: true,
            email_notifications: true,
            beta_features: false,
            dark_mode: false,
        },
    });
};

/**
 * Format last updated time
 * 
 * Utility to format the updated_at timestamp
 */
export const formatLastUpdated = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
