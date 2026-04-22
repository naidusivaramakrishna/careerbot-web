"use client";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getSystemConfig, updateSystemConfig, resetSystemConfig } from '@/api/adminSystemConfigApi';
import { SystemConfig } from '../types';
import { logger } from '@/lib/logger';

interface UseSystemConfigReturn {
    systemConfig: SystemConfig | null;
    loading: boolean;
    fetchSystemConfig: () => Promise<void>;
    handleUpdateSystemConfig: () => Promise<void>;
    handleResetSystemConfig: () => Promise<void>;
    updateConfigField: <K extends keyof SystemConfig>(
        field: K,
        value: SystemConfig[K]
    ) => void;
    toggleLoginMethod: (method: string) => void;
    toggleFileType: (type: string) => void;
}

export const useSystemConfig = (): UseSystemConfigReturn => {
    const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSystemConfig = useCallback(async () => {
        try {
            setLoading(true);
            const config = await getSystemConfig();
            setSystemConfig(config);
        } catch (error: unknown) {
            logger.error('Error fetching system config:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleUpdateSystemConfig = useCallback(async () => {
        if (!systemConfig) return;

        try {
            setLoading(true);
            const updatedConfig = await updateSystemConfig({
                maintenance_mode: systemConfig.maintenance_mode,
                platform_name: systemConfig.platform_name,
                support_email: systemConfig.support_email,
                maximum_users: systemConfig.maximum_users,
                max_file_size_mb: systemConfig.max_file_size_mb,
                api_requests_per_hour: systemConfig.api_requests_per_hour,
                file_uploads_per_hour: systemConfig.file_uploads_per_hour,
                allowed_login_methods: systemConfig.allowed_login_methods,
                allowed_file_types: systemConfig.allowed_file_types,
            });

            setSystemConfig(updatedConfig);
            toast.success('System configuration updated successfully');
        } catch (error: unknown) {
            logger.error('Error updating system config:', error);
            toast.error('Failed to update system configuration');
        } finally {
            setLoading(false);
        }
    }, [systemConfig]);

    const handleResetSystemConfig = useCallback(async () => {
        if (!confirm('Are you sure you want to reset all settings to default values?')) {
            return;
        }

        try {
            setLoading(true);
            const defaultConfig = await resetSystemConfig();
            setSystemConfig(defaultConfig);
            toast.success('System configuration reset to defaults');
        } catch (error: unknown) {
            logger.error('Error resetting system config:', error);
            toast.error('Failed to reset system configuration');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateConfigField = useCallback(<K extends keyof SystemConfig>(
        field: K,
        value: SystemConfig[K]
    ) => {
        setSystemConfig(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const toggleLoginMethod = useCallback((method: string) => {
        if (!systemConfig) return;

        const exists = systemConfig.allowed_login_methods.includes(method);
        setSystemConfig({
            ...systemConfig,
            allowed_login_methods: exists
                ? systemConfig.allowed_login_methods.filter(m => m !== method)
                : [...systemConfig.allowed_login_methods, method],
        });
    }, [systemConfig]);

    const toggleFileType = useCallback((type: string) => {
        if (!systemConfig) return;

        const exists = systemConfig.allowed_file_types.includes(type);
        setSystemConfig({
            ...systemConfig,
            allowed_file_types: exists
                ? systemConfig.allowed_file_types.filter(f => f !== type)
                : [...systemConfig.allowed_file_types, type],
        });
    }, [systemConfig]);

    return {
        systemConfig,
        loading,
        fetchSystemConfig,
        handleUpdateSystemConfig,
        handleResetSystemConfig,
        updateConfigField,
        toggleLoginMethod,
        toggleFileType,
    };
};
