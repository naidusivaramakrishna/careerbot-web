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
export type TabType = 'Feature Flags' | 'System configuration' | 'Security';

// ==================== MODAL TYPES ====================
export type ModalMode = 'add' | 'edit';
