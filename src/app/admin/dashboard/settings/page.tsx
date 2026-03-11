"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';

// Components
import TabNavigation from './_components/TabNavigation';
import AddPlanModal from './_components/AddPlanModal';
import SubscriptionPlansTab from './_components/SubscriptionPlansTab';
import FeatureFlagsTab from './_components/FeatureFlagsTab';
import SecurityTab from './_components/SecurityTab';
import ConfirmDeleteModal from '@/app/(user)/profile/_components/ConfirmDeleteModal';
import { logger } from '@/lib/logger';

// Hooks
import { usePlans } from './hooks/usePlans';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { useTwoFactorAuth } from './hooks/useTwoFactorAuth';
import { TabType } from './types';
import { SystemConfigTab } from './_components/SystemConfigTab';

// Types
import { useAdminAccess } from '../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../_components/LockedPageOverlay';


const AdminSettings: React.FC = () => {
    const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('settings');
    const [activeTab, setActiveTab] = useState<TabType>('Subscription Plans');

    // Plans hook
    const {
        plans,
        loading: plansLoading,
        modalOpen,
        modalMode,
        selectedPlanId,
        formData,
        setFormData,
        fetchPlans,
        handleCreatePlan,
        handleUpdatePlan,
        handleDeletePlan,
        handleSetPopular,
        handleEditPlan,
        handleAddPlan,
        closeModal,
        getSelectedPlan,
    } = usePlans();

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

    const handleTabChange = useCallback((tab: TabType) => {
        logger.debug(`Switched to ${tab} tab`)
        setActiveTab(tab);
    }, []);

    const handleModalDelete = useCallback(() => {
        const plan = getSelectedPlan();
        if (plan) {
            logger.warn(`Deleting subscription plan: ${plan.name}`)
            handleDeletePlan(plan.id, plan.name);
        }
    }, [getSelectedPlan, handleDeletePlan]);

    const handleModalSetPopular = useCallback(() => {
        if (selectedPlanId) {
            handleSetPopular(selectedPlanId);
        }
    }, [selectedPlanId, handleSetPopular]);

    // Memoized header action button
    const headerAction = useMemo(() => {
        if (activeTab !== 'Subscription Plans') return null;

        return (
            <button
                onClick={handleAddPlan}
                className="bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#4E4EEF] transition"
            >
                <Plus className="w-4 h-4" />
                Create new plan
            </button>
        );
    }, [activeTab, handleAddPlan]);

    // Get selected plan for modal props
    const selectedPlan = getSelectedPlan();

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
                        Manage Subscription Plans, Feature Flags and system configuration.
                    </p>
                </div>
                {headerAction}
            </div>

            {/* Tab Navigation */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* Tab Content */}
            <SubscriptionPlansTab
                isActive={activeTab === 'Subscription Plans'}
                plans={plans}
                loading={plansLoading}
                onFetch={fetchPlans}
                onEdit={handleEditPlan}
            />

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

            {/* Plan Modal */}
            <AddPlanModal
                open={modalOpen}
                onClose={closeModal}
                onApply={modalMode === 'add' ? handleCreatePlan : handleUpdatePlan}
                onDelete={modalMode === 'edit' && selectedPlanId ? handleModalDelete : undefined}
                onSetPopular={modalMode === 'edit' && selectedPlanId ? handleModalSetPopular : undefined}
                mode={modalMode}
                formData={formData}
                setFormData={setFormData}
                isPopular={selectedPlan?.is_popular}
            />

            {/* 2FA Disable Confirmation Modal */}
            <ConfirmDeleteModal
                open={showDisableConfirmModal}
                title="Disable Two-Factor Authentication"
                description="Are you sure you want to disable 2FA? This will make your account less secure."
                loading={twoFALoading}
                onCancel={cancelDisable2FA}
                onConfirm={confirmDisable2FA}
            />
        </div>
    );
};

export default AdminSettings;
