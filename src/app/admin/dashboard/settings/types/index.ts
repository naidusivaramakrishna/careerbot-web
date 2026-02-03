// ==================== PLAN TYPES ====================
// Import PlanItem from API to ensure type consistency
export type { PlanItem } from '@/api/adminPlansApi';

export interface PlanFormData {
    planName: string;
    price: string;
    resumeLimit: string;
    jobLimit: string;
    aiCredits: string;
    templates: string;
    features: string[];
}

export interface CreatePlanPayload {
    name: string;
    price: number;
    resume_scan_limit: number;
    job_application_limit: number;
    ai_credits: number;
    templates: 'limited' | 'premium' | 'unlimited';
    features: string[];
    is_active: boolean;
}

export interface UpdatePlanPayload {
    name: string;
    price: number;
    resume_scan_limit: number;
    job_application_limit: number;
    ai_credits: number;
    templates: 'limited' | 'premium' | 'unlimited';
    features: string[];
}

// ==================== FEATURE FLAGS TYPES ====================
export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
}

// ==================== SYSTEM CONFIG TYPES ====================
export interface SystemConfig {
    maintenance_mode: boolean;
    platform_name: string;
    support_email: string;
    maximum_users: number;
    max_file_size_mb: number;
    api_requests_per_hour: number;
    file_uploads_per_hour: number;
    allowed_login_methods: string[];
    allowed_file_types: string[];
}

export interface UpdateSystemConfigPayload {
    maintenance_mode?: boolean;
    platform_name?: string;
    support_email?: string;
    maximum_users?: number;
    max_file_size_mb?: number;
    api_requests_per_hour?: number;
    file_uploads_per_hour?: number;
    allowed_login_methods?: string[];
    allowed_file_types?: string[];
}

// ==================== 2FA TYPES ====================
export interface Setup2FAResponse {
    secret: string;
    qr_code_url: string;
    backup_codes: string[];
}

export interface Enable2FAPayload {
    secret: string;
    totp_code: string;
    backup_codes: string[];
}

export interface AdminData {
    id: string;
    email: string;
    totp_enabled: boolean;
}

// ==================== TAB TYPES ====================
export type TabType = 'Subscription Plans' | 'Feature Flags' | 'System configuration' | 'Security';

// ==================== MODAL TYPES ====================
export type ModalMode = 'add' | 'edit';

export interface AddPlanModalProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    onDelete?: () => void;
    onSetPopular?: () => void;
    mode?: ModalMode;
    formData: PlanFormData;
    setFormData: (data: PlanFormData) => void;
    isPopular?: boolean;
}
