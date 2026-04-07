import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface CreatePlanRequest {
    name: string;
    price: number;
    resume_scan_limit: number | string;
    job_application_limit: number | string;
    ai_credits: number | string;
    templates: 'limited' | 'premium' | 'unlimited';
    features: string[];
    is_popular?: boolean;
    is_active?: boolean;
}

export interface CreatePlanResponse {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    created_at: string;
    message: string;
}

export interface PlanItem {
    id: string;
    name: string;
    price: number;
    resume_scan_limit: number | string;
    job_application_limit: number | string;
    ai_credits: number | string;
    templates: string;
    features: string[];
    is_popular: boolean;
    is_active: boolean;
    active_users: number;
    created_at: string;
    updated_at: string;
}

export interface GetAllPlansResponse {
    plans: PlanItem[];
    total: number;
}

export interface PlanDetailsResponse {
    id: string;
    name: string;
    price: number;
    resume_scan_limit: number | string;
    job_application_limit: number | string;
    ai_credits: number | string;
    templates: string;
    features: string[];
    is_popular: boolean;
    is_active: boolean;
    active_users: number;
    created_at: string;
    updated_at: string;
}

export interface UpdatePlanRequest {
    name?: string;
    price?: number;
    resume_scan_limit?: number | string;
    job_application_limit?: number | string;
    ai_credits?: number | string;
    templates?: 'limited' | 'premium' | 'unlimited';
    features?: string[];
    is_popular?: boolean;
    is_active?: boolean;
}

export interface UpdatePlanResponse {
    id: string;
    message: string;
    updated_at: string;
}

export interface DeletePlanResponse {
    success: boolean;
    message: string;
    plan_id: string;
}

export interface SetPopularPlanResponse {
    success: boolean;
    message: string;
    plan_id: string;
}

export interface SeedDefaultPlansResponse {
    success: boolean;
    message: string;
    plans_created: number;
    plan_ids: string[];
}

// ==================== ADMIN PLANS API FUNCTIONS ====================

/**
 * Create a new subscription plan
 * 
 * Required fields:
 * - name: Plan name (e.g., "Basic", "Pro", "Enterprise")
 * - price: Plan price (in cents or smallest currency unit)
 * - resume_scan_limit: Maximum number of resume scans
 * - job_application_limit: Maximum number of job applications
 * - ai_credits: AI credits allocation
 * - templates: Template access level (limited/premium/unlimited)
 * - features: List of features included in the plan
 * 
 * Optional fields:
 * - is_popular: Mark as popular/recommended plan (default: false)
 * - is_active: Plan is active and available (default: true)
 */
export const createPlan = async (
    data: CreatePlanRequest
): Promise<CreatePlanResponse> => {
    try {
        const response = await httpClient.post<CreatePlanResponse>(
            '/admin/settings/plans',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error creating plan:', error);
        throw error;
    }
};

/**
 * Get all subscription plans
 * 
 * Returns:
 * - List of all subscription plans (active and inactive)
 * - Active users count for each plan
 * - Plan details including features and limits
 * 
 * Plans are returned with complete information about:
 * - Pricing and billing
 * - Feature access levels
 * - Usage limits (resume scans, job applications)
 * - AI credits allocation
 * - Template access level
 * - Active user count
 */
export const getAllPlans = async (): Promise<GetAllPlansResponse> => {
    try {
        const response = await httpClient.get<GetAllPlansResponse>(
            '/admin/settings/plans'
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching plans:', error);
        throw error;
    }
};

/**
 * Get detailed information about a specific subscription plan
 * 
 * Returns complete plan details including:
 * - All plan features and limits
 * - Active users count
 * - Template access level
 * - AI credits allocation
 * - Created and updated timestamps
 * - Active status
 * - Popular flag
 */
export const getPlanDetails = async (
    planId: string
): Promise<PlanDetailsResponse> => {
    try {
        const response = await httpClient.get<PlanDetailsResponse>(
            `/admin/settings/plans/${planId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error fetching plan details for ${planId}:`, error);
        throw error;
    }
};

/**
 * Update an existing subscription plan
 * 
 * All fields are optional - only provided fields will be updated
 * 
 * Updatable fields:
 * - name: Plan name
 * - price: Plan pricing
 * - resume_scan_limit: Resume scan quota
 * - job_application_limit: Job application quota
 * - ai_credits: AI credits allocation
 * - templates: Template access level
 * - features: Feature list
 * - is_popular: Popular plan flag
 * - is_active: Active status
 * 
 * ⚠️ Note: Changing plan limits or features will not affect existing subscribers
 * unless they renew their subscription or the changes are applied retroactively
 */
export const updatePlan = async (
    planId: string,
    data: UpdatePlanRequest
): Promise<UpdatePlanResponse> => {
    try {
        const response = await httpClient.put<UpdatePlanResponse>(
            `/admin/settings/plans/${planId}`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error updating plan ${planId}:`, error);
        throw error;
    }
};

/**
 * Delete a subscription plan
 * 
 * Permanently removes the plan from the system
 * 
 * ⚠️ Important considerations:
 * - Plans with active subscribers cannot be deleted
 * - Consider deactivating the plan instead if users are subscribed
 * - This action cannot be undone
 * - Existing subscriptions must be migrated or expired first
 */
export const deletePlan = async (
    planId: string
): Promise<DeletePlanResponse> => {
    try {
        const response = await httpClient.delete<DeletePlanResponse>(
            `/admin/settings/plans/${planId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error deleting plan ${planId}:`, error);
        throw error;
    }
};

/**
 * Set a plan as 'Most Popular'
 * 
 * Marks the specified plan as popular/recommended
 * Automatically removes the popular flag from all other plans
 * 
 * Use this to highlight the recommended or best-value plan to users
 * Only one plan can be marked as popular at a time
 */
export const setPopularPlan = async (
    planId: string
): Promise<SetPopularPlanResponse> => {
    try {
        const response = await httpClient.post<SetPopularPlanResponse>(
            `/admin/settings/plans/${planId}/set-popular`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error setting plan ${planId} as popular:`, error);
        throw error;
    }
};

/**
 * Seed default subscription plans
 * 
 * Creates a set of predefined default plans for quick setup
 * 
 * Typically includes:
 * - Free/Basic plan with limited features
 * - Pro/Premium plan with enhanced features
 * - Enterprise plan with full access
 * 
 * This is useful for:
 * - Initial system setup
 * - Testing environments
 * - Resetting to default plans
 * 
 * ⚠️ Will skip creation if plans already exist to avoid duplicates
 */
export const seedDefaultPlans = async (): Promise<SeedDefaultPlansResponse> => {
    try {
        const response = await httpClient.post<SeedDefaultPlansResponse>(
            '/admin/settings/seed-default-plans',
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error seeding default plans:', error);
        throw error;
    }
};

/**
 * Toggle plan active status
 * 
 * Convenience method to activate or deactivate a plan
 */
export const togglePlanStatus = async (
    planId: string,
    isActive: boolean
): Promise<UpdatePlanResponse> => {
    return updatePlan(planId, { is_active: isActive });
};

/**
 * Activate a plan (make it available for subscription)
 */
export const activatePlan = async (
    planId: string
): Promise<UpdatePlanResponse> => {
    return togglePlanStatus(planId, true);
};

/**
 * Deactivate a plan (hide from subscription options)
 */
export const deactivatePlan = async (
    planId: string
): Promise<UpdatePlanResponse> => {
    return togglePlanStatus(planId, false);
};

/**
 * Get only active plans
 * 
 * Filters the plan list to return only active/available plans
 */
export const getActivePlans = async (): Promise<PlanItem[]> => {
    try {
        const response = await getAllPlans();
        return response.plans.filter((plan) => plan.is_active);
    } catch (error) {
        logger.error('Error fetching active plans:', error);
        throw error;
    }
};

/**
 * Get the popular plan
 * 
 * Returns the plan marked as popular/recommended
 */
export const getPopularPlan = async (): Promise<PlanItem | null> => {
    try {
        const response = await getAllPlans();
        const popularPlan = response.plans.find((plan) => plan.is_popular);
        return popularPlan || null;
    } catch (error) {
        logger.error('Error fetching popular plan:', error);
        throw error;
    }
};

/**
 * Get plans sorted by price
 */
export const getPlansSortedByPrice = async (
    ascending: boolean = true
): Promise<PlanItem[]> => {
    try {
        const response = await getAllPlans();
        return response.plans.sort((a, b) => {
            return ascending ? a.price - b.price : b.price - a.price;
        });
    } catch (error) {
        logger.error('Error fetching plans sorted by price:', error);
        throw error;
    }
};

/**
 * Get plan statistics
 * 
 * Returns summary statistics about all plans
 */
export const getPlanStatistics = async (): Promise<{
    total_plans: number;
    active_plans: number;
    inactive_plans: number;
    total_active_users: number;
    most_popular_plan: PlanItem | null;
    highest_priced_plan: PlanItem | null;
    lowest_priced_plan: PlanItem | null;
}> => {
    try {
        const response = await getAllPlans();
        const { plans } = response;

        const activePlans = plans.filter((p) => p.is_active);
        const inactivePlans = plans.filter((p) => !p.is_active);
        const totalActiveUsers = plans.reduce((sum, plan) => sum + plan.active_users, 0);
        const popularPlan = plans.find((p) => p.is_popular) || null;

        // Sort by price to find highest and lowest
        const sortedByPrice = [...plans].sort((a, b) => a.price - b.price);
        const lowestPricedPlan = sortedByPrice[0] || null;
        const highestPricedPlan = sortedByPrice[sortedByPrice.length - 1] || null;

        return {
            total_plans: plans.length,
            active_plans: activePlans.length,
            inactive_plans: inactivePlans.length,
            total_active_users: totalActiveUsers,
            most_popular_plan: popularPlan,
            highest_priced_plan: highestPricedPlan,
            lowest_priced_plan: lowestPricedPlan,
        };
    } catch (error) {
        logger.error('Error fetching plan statistics:', error);
        throw error;
    }
};

/**
 * Duplicate a plan
 * 
 * Creates a copy of an existing plan with a new name
 * Useful for creating similar plans with minor variations
 */
export const duplicatePlan = async (
    planId: string,
    newName: string
): Promise<CreatePlanResponse> => {
    try {
        // Get the existing plan details
        const existingPlan = await getPlanDetails(planId);

        // Create a new plan with the same settings but different name
        const newPlanData: CreatePlanRequest = {
            name: newName,
            price: existingPlan.price,
            resume_scan_limit: existingPlan.resume_scan_limit,
            job_application_limit: existingPlan.job_application_limit,
            ai_credits: existingPlan.ai_credits,
            templates: existingPlan.templates as 'limited' | 'premium' | 'unlimited',
            features: [...existingPlan.features],
            is_popular: false, // New plan shouldn't be popular by default
            is_active: false, // New plan should be inactive by default
        };

        return await createPlan(newPlanData);
    } catch (error) {
        logger.error(`Error duplicating plan ${planId}:`, error);
        throw error;
    }
};
