"use client";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {getAllPlans,createPlan,updatePlan,deletePlan,setPopularPlan} from '@/api/adminPlansApi';
import { formatTemplateForApi, formatTemplateForDisplay, INITIAL_FORM_DATA } from '../utils';
import { ModalMode, PlanFormData, PlanItem } from '../types';
import { logger } from '@/lib/logger';

// Helper function to convert form value to API value
const convertLimitValue = (value: string): string | number => {
    if (!value) return 0;
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'unlimited') return 'unlimited';
    const num = parseInt(trimmed);
    return isNaN(num) ? 0 : num;
};

interface UsePlansReturn {
    plans: PlanItem[];
    loading: boolean;
    modalOpen: boolean;
    modalMode: ModalMode;
    selectedPlanId: string | null;
    formData: PlanFormData;
    setFormData: (data: PlanFormData) => void;
    fetchPlans: () => Promise<void>;
    handleCreatePlan: () => Promise<void>;
    handleUpdatePlan: () => Promise<void>;
    handleDeletePlan: (planId: string, planName: string) => Promise<void>;
    handleSetPopular: (planId: string) => Promise<void>;
    handleEditPlan: (plan: PlanItem) => void;
    handleAddPlan: () => void;
    closeModal: () => void;
    resetForm: () => void;
    getSelectedPlan: () => PlanItem | undefined;
}

export const usePlans = (): UsePlansReturn => {
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('add');
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [formData, setFormData] = useState<PlanFormData>(INITIAL_FORM_DATA);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_DATA);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        resetForm();
    }, [resetForm]);

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllPlans();
            setPlans(response.plans);
        } catch (error: unknown) {
            logger.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreatePlan = useCallback(async () => {
        logger.debug('handleCreatePlan called', { planName: formData.planName, price: formData.price });

        try {
            const planData = {
                name: formData.planName,
                price: parseFloat(formData.price),
                resume_scan_limit: convertLimitValue(formData.resumeLimit),
                job_application_limit: convertLimitValue(formData.jobLimit),
                ai_credits: convertLimitValue(formData.aiCredits),
                templates: formatTemplateForApi(formData.templates),
                features: formData.features,
                is_active: true,
            };

            logger.debug('Creating plan with data:', planData);
            await createPlan(planData);
            logger.debug('Plan created successfully');
            toast.success('Plan created successfully');
            closeModal();
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error creating plan:', error);
            // Re-throw error so modal can display inline validation errors
            throw error;
        }
    }, [formData, closeModal, fetchPlans]);

    const handleUpdatePlan = useCallback(async () => {
        logger.debug('handleUpdatePlan called', { planId: selectedPlanId, planName: formData.planName, price: formData.price });

        if (!selectedPlanId) {
            logger.warn('Update plan failed - no plan selected');
            return;
        }

        try {
            const planData = {
                name: formData.planName,
                price: parseFloat(formData.price),
                resume_scan_limit: convertLimitValue(formData.resumeLimit),
                job_application_limit: convertLimitValue(formData.jobLimit),
                ai_credits: convertLimitValue(formData.aiCredits),
                templates: formatTemplateForApi(formData.templates),
                features: formData.features,
            };

            logger.debug('Updating plan with data:', { planId: selectedPlanId, planData });
            await updatePlan(selectedPlanId, planData);
            logger.debug('Plan updated successfully');
            toast.success('Plan updated successfully');
            closeModal();
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error updating plan:', error);
            // Re-throw error so modal can display inline validation errors
            throw error;
        }
    }, [selectedPlanId, formData, closeModal, fetchPlans]);

    const handleDeletePlan = useCallback(async (planId: string, planName: string) => {
        if (!confirm(`Are you sure you want to delete the "${planName}" plan? This action cannot be undone.`)) {
            return;
        }

        try {
            await deletePlan(planId);
            toast.success('Plan deleted successfully');
            closeModal();
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error deleting plan:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete plan. It may have active subscribers.';
            toast.error(errorMessage);
        }
    }, [closeModal, fetchPlans]);

    const handleSetPopular = useCallback(async (planId: string) => {
        try {
            await setPopularPlan(planId);
            toast.success('Popular plan updated');
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error setting popular plan:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to set popular plan';
            toast.error(errorMessage);
        }
    }, [fetchPlans]);

    const handleEditPlan = useCallback((plan: PlanItem) => {
        setModalMode('edit');
        setSelectedPlanId(plan.id);
        setFormData({
            planName: plan.name,
            price: plan.price.toString(),
            resumeLimit: plan.resume_scan_limit.toString(),
            jobLimit: plan.job_application_limit.toString(),
            aiCredits: plan.ai_credits.toString(),
            templates: formatTemplateForDisplay(plan.templates),
            features: plan.features,
        });
        setModalOpen(true);
    }, []);

    const handleAddPlan = useCallback(() => {
        setModalMode('add');
        setSelectedPlanId(null);
        resetForm();
        setModalOpen(true);
    }, [resetForm]);

    const getSelectedPlan = useCallback(() => {
        return plans.find(p => p.id === selectedPlanId);
    }, [plans, selectedPlanId]);

    return {
        plans,
        loading,
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
        resetForm,
        getSelectedPlan,
    };
};
