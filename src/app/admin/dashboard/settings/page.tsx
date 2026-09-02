"use client";
import React, { useState } from 'react';

// Components
import TabNavigation from './_components/TabNavigation';
import FeatureFlagsTab from './_components/FeatureFlagsTab';
import SecurityTab from './_components/SecurityTab';
import ConfirmDeleteModal from '@/app/(user)/profile/_components/ConfirmDeleteModal';

// Hooks
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { useTwoFactorAuth } from './hooks/useTwoFactorAuth';
import { TabType } from './types';
import { SystemConfigTab } from './_components/SystemConfigTab';

// Types
import { useAdminAccess } from '../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../_components/LockedPageOverlay';


const AdminSettings: React.FC = () => {
    const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('settings');
    const [activeTab, setActiveTab] = useState<TabType>('Feature Flags');

    // Feature flags hook
    const {
        featureFlags,
        loading: flagsLoading,
        fetchFeatureFlags,
        handleToggleFeature,
        handleSaveAllFeatures,
    } = useFeatureFlags();

    // 2FA hook
    const {
        twoFAEnabled,
        twoFASetupData,
        showQRCode,
        totpCode,
        disablePassword,
        loading: twoFALoading,
        showDisableConfirmModal,
        setTotpCode,
        setDisablePassword,
        fetchAdminData,
        handleSetup2FA,
        handleEnable2FA,
        handleDisable2FA,
        confirmDisable2FA,
        cancelDisable2FA,
        handleCancelSetup,
    } = useTwoFactorAuth();

    // Block render until access check completes
    if (accessLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Check access
    if (!hasAccess) {
        return <LockedPageOverlay requiredRoles={requiredRoles} pageName="Settings" />;
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-semibold text-xl">Settings</h1>
                    <p className="text-[#4A5565] text-xs">
                        Manage Feature Flags and system configuration.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <FeatureFlagsTab
                isActive={activeTab === 'Feature Flags'}
                featureFlags={featureFlags}
                loading={flagsLoading}
                onFetch={fetchFeatureFlags}
                onToggle={handleToggleFeature}
                onSaveAll={handleSaveAllFeatures}
            />

            <SystemConfigTab
                isActive={activeTab === 'System configuration'}
            />

            <SecurityTab
                isActive={activeTab === 'Security'}
                twoFAEnabled={twoFAEnabled}
                twoFASetupData={twoFASetupData}
                showQRCode={showQRCode}
                totpCode={totpCode}
                disablePassword={disablePassword}
                loading={twoFALoading}
                onFetch={fetchAdminData}
                onSetTotpCode={setTotpCode}
                onSetDisablePassword={setDisablePassword}
                onSetup2FA={handleSetup2FA}
                onEnable2FA={handleEnable2FA}
                onDisable2FA={handleDisable2FA}
                onCancelSetup={handleCancelSetup}
            />

            {/* 2FA Disable Confirmation Modal */}
            <ConfirmDeleteModal
                open={showDisableConfirmModal}
                title="Disable Two-Factor Authentication"
                description="Are you sure you want to disable 2FA? Disabling 2FA removes an important layer of protection and makes your admin account significantly more vulnerable to unauthorized access."
                loading={twoFALoading}
                onCancel={cancelDisable2FA}
                onConfirm={confirmDisable2FA}
            />
        </div>
    );
};

export default AdminSettings;
