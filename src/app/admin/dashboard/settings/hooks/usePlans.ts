"use client";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {getAllPlans,createPlan,updatePlan,deletePlan,setPopularPlan} from '@/api/adminPlansApi';
import { formatTemplateForApi, formatTemplateForDisplay, INITIAL_FORM_DATA } from '../utils';
import { ModalMode, PlanFormData, PlanItem } from '../types';
import { logger } from '@/lib/logger';

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
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to fetch plans';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreatePlan = useCallback(async () => {
        if (!formData.planName || !formData.price) {
            toast.error('Plan name and price are required');
            return;
        }

        try {
            const planData = {
                name: formData.planName,
                price: parseFloat(formData.price),
                resume_scan_limit: parseInt(formData.resumeLimit) || 0,
                job_application_limit: parseInt(formData.jobLimit) || 0,
                ai_credits: parseInt(formData.aiCredits) || 0,
                templates: formatTemplateForApi(formData.templates),
                features: formData.features,
                is_active: true,
            };

            await createPlan(planData);
            toast.success('Plan created successfully');
            closeModal();
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error creating plan:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create plan';
            toast.error(errorMessage);
        }
    }, [formData, closeModal, fetchPlans]);

    const handleUpdatePlan = useCallback(async () => {
        if (!selectedPlanId) return;

        if (!formData.planName || !formData.price) {
            toast.error('Plan name and price are required');
            return;
        }

        try {
            const planData = {
                name: formData.planName,
                price: parseFloat(formData.price),
                resume_scan_limit: parseInt(formData.resumeLimit) || 0,
                job_application_limit: parseInt(formData.jobLimit) || 0,
                ai_credits: parseInt(formData.aiCredits) || 0,
                templates: formatTemplateForApi(formData.templates),
                features: formData.features,
            };

            await updatePlan(selectedPlanId, planData);
            toast.success('Plan updated successfully');
            closeModal();
            fetchPlans();
        } catch (error: unknown) {
            logger.error('Error updating plan:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update plan';
            toast.error(errorMessage);
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
