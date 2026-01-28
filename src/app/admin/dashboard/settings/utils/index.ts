import { PlanFormData } from '../types';

// ==================== CONSTANTS ====================
export const TABS = [
    'Subscription Plans',
    'Feature Flags',
    'System configuration',
    'Security'
] as const;

export const TEMPLATE_OPTIONS = [
    'Limited Templates',
    'Basic Templates',
    'Premium Templates',
    'Unlimited Templates'
] as const;

export const LOGIN_METHODS = ['email', 'google', 'linkedin'] as const;
export const FILE_TYPES = ['jpg', 'png', 'pdf', 'docx'] as const;
export const FILE_SIZE_OPTIONS = [1, 2, 5, 10] as const;

export const INITIAL_FORM_DATA: PlanFormData = {
    planName: '',
    price: '',
    resumeLimit: '',
    jobLimit: '',
    aiCredits: '',
    templates: '',
    features: []
};

// ==================== HELPER FUNCTIONS ====================
export const formatTemplateForDisplay = (template: string): string => {
    const templateMap: Record<string, string> = {
        limited: 'Limited Templates',
        premium: 'Premium Templates',
        unlimited: 'Unlimited Templates',
        basic: 'Basic Templates'
    };
    return templateMap[template.toLowerCase()] || 'Limited Templates';
};

export const formatTemplateForApi = (template: string): 'limited' | 'premium' | 'unlimited' => {
    return (template.toLowerCase().replace(/\s+/g, '_').replace('_templates', '') || 'limited') as 'limited' | 'premium' | 'unlimited';
};

export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
};

export const sanitizeNumericInput = (value: string, maxLength = 6): string => {
    return value.replace(/\D/g, '').slice(0, maxLength);
};