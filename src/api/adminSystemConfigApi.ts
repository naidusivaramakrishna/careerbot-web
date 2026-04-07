import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface SystemConfig {
    maintenance_mode: boolean;
    maintenance_message: string;
    platform_name: string;
    support_email: string;
    maximum_users: number;
    max_file_size_mb: number;
    api_requests_per_hour: number;
    file_uploads_per_hour: number;
    allowed_login_methods: string[];
    allowed_file_types: string[];
    updated_at: string;
    updated_by?: string;
}

export interface UpdateSystemConfigRequest {
    maintenance_mode?: boolean;
    maintenance_message?: string;
    platform_name?: string;
    support_email?: string;
    maximum_users?: number;
    max_file_size_mb?: number;
    api_requests_per_hour?: number;
    file_uploads_per_hour?: number;
    allowed_login_methods?: string[];
    allowed_file_types?: string[];
}

export interface SystemConfigResponse extends SystemConfig { }

export interface ResetSystemConfigResponse extends SystemConfig { }

// Login methods enum for type safety
export enum LoginMethod {
    EMAIL = 'email',
    GOOGLE = 'google',
    LINKEDIN = 'linkedin',
    FACEBOOK = 'facebook',
    APPLE = 'apple',
}

// File types enum for type safety
export enum AllowedFileType {
    PDF = 'pdf',
    DOCX = 'docx',
    DOC = 'doc',
    JPG = 'jpg',
    JPEG = 'jpeg',
    PNG = 'png',
    TXT = 'txt',
    RTF = 'rtf',
}

// ==================== ADMIN SYSTEM CONFIG API FUNCTIONS ====================

/**
 * Get system configuration
 * 
 * Returns current system configuration including:
 * - Maintenance mode status and message
 * - Platform settings (name, support email)
 * - System limits (max users, file sizes, rate limits)
 * - Authentication settings (allowed login methods)
 * - File handling settings (allowed file types)
 * - Last update information
 * 
 * @returns Current system configuration
 * 
 * Example:
 * ```typescript
 * const config = await getSystemConfig();
 * // // console.log(`Platform: ${config.platform_name}`);
 * // // console.log(`Maintenance: ${config.maintenance_mode ? 'ON' : 'OFF'}`);
 * // // console.log(`Max users: ${config.maximum_users}`);
 * ```
 */
export const getSystemConfig = async (): Promise<SystemConfigResponse> => {
    try {
        const response = await httpClient.get<SystemConfigResponse>(
            '/admin/settings/system-config'
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching system configuration:', error);
        throw error;
    }
};

/**
 * Update system configuration
 * 
 * Update one or more system configuration settings
 * All fields are optional - only provided fields will be updated
 * 
 * @param data - Configuration fields to update
 * @returns Updated system configuration
 * 
 * Example:
 * ```typescript
 * // Enable maintenance mode
 * await updateSystemConfig({
 *   maintenance_mode: true,
 *   maintenance_message: 'System upgrade in progress. Back soon!'
 * });
 * 
 * // Update rate limits
 * await updateSystemConfig({
 *   api_requests_per_hour: 2000,
 *   file_uploads_per_hour: 500
 * });
 * 
 * // Update allowed login methods
 * await updateSystemConfig({
 *   allowed_login_methods: ['email', 'google', 'linkedin']
 * });
 * ```
 */
export const updateSystemConfig = async (
    data: UpdateSystemConfigRequest
): Promise<SystemConfigResponse> => {
    try {
        const response = await httpClient.put<SystemConfigResponse>(
            '/admin/settings/system-config',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error updating system configuration:', error);
        throw error;
    }
};

/**
 * Reset system configuration to default values
 * 
 * Resets all configuration settings to their default values:
 * - Maintenance mode: OFF
 * - Platform name: CareerBot
 * - Support email: support@careerbot.com
 * - Maximum users: 20000
 * - Max file size: 2 MB
 * - API requests per hour: 1000
 * - File uploads per hour: 200
 * - Allowed login methods: email, google
 * - Allowed file types: pdf, docx
 * 
 * ⚠️ Warning: This will override all current settings
 * 
 * @returns Reset system configuration
 * 
 * Example:
 * ```typescript
 * const defaultConfig = await resetSystemConfig();
 * // // console.log('Configuration reset to defaults');
 * ```
 */
export const resetSystemConfig = async (): Promise<ResetSystemConfigResponse> => {
    try {
        const response = await httpClient.post<ResetSystemConfigResponse>(
            '/admin/settings/system-config/reset',
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error resetting system configuration:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Enable maintenance mode
 * 
 * Helper to quickly enable maintenance mode
 * 
 * @param message - Optional custom maintenance message
 * @returns Updated configuration
 * 
 * Example:
 * ```typescript
 * await enableMaintenanceMode('Scheduled maintenance. Back at 10 PM.');
 * ```
 */
export const enableMaintenanceMode = async (
    message?: string
): Promise<SystemConfigResponse> => {
    const data: UpdateSystemConfigRequest = {
        maintenance_mode: true,
    };
    if (message) {
        data.maintenance_message = message;
    }
    return updateSystemConfig(data);
};

/**
 * Disable maintenance mode
 * 
 * Helper to quickly disable maintenance mode
 * 
 * @returns Updated configuration
 */
export const disableMaintenanceMode = async (): Promise<SystemConfigResponse> => {
    return updateSystemConfig({
        maintenance_mode: false,
    });
};

/**
 * Check if maintenance mode is active
 * 
 * Helper to check maintenance status
 * 
 * @returns Boolean indicating if maintenance mode is active
 */
export const isMaintenanceModeActive = async (): Promise<boolean> => {
    try {
        const config = await getSystemConfig();
        return config.maintenance_mode;
    } catch (error) {
        logger.error('Error checking maintenance mode:', error);
        return false;
    }
};

/**
 * Update platform information
 * 
 * Helper to update platform name and support email
 * 
 * @param name - Platform name
 * @param email - Support email
 * @returns Updated configuration
 */
export const updatePlatformInfo = async (
    name: string,
    email: string
): Promise<SystemConfigResponse> => {
    return updateSystemConfig({
        platform_name: name,
        support_email: email,
    });
};

/**
 * Update system limits
 * 
 * Helper to update all system limits at once
 * 
 * @param limits - System limits configuration
 * @returns Updated configuration
 * 
 * Example:
 * ```typescript
 * await updateSystemLimits({
 *   maximum_users: 50000,
 *   max_file_size_mb: 5,
 *   api_requests_per_hour: 5000,
 *   file_uploads_per_hour: 1000
 * });
 * ```
 */
export const updateSystemLimits = async (limits: {
    maximum_users?: number;
    max_file_size_mb?: number;
    api_requests_per_hour?: number;
    file_uploads_per_hour?: number;
}): Promise<SystemConfigResponse> => {
    return updateSystemConfig(limits);
};

/**
 * Add login method
 * 
 * Helper to add a new login method to allowed methods
 * 
 * @param method - Login method to add
 * @returns Updated configuration
 */
export const addLoginMethod = async (
    method: string | LoginMethod
): Promise<SystemConfigResponse> => {
    const config = await getSystemConfig();
    const currentMethods = config.allowed_login_methods;

    if (!currentMethods.includes(method)) {
        currentMethods.push(method);
    }

    return updateSystemConfig({
        allowed_login_methods: currentMethods,
    });
};

/**
 * Remove login method
 * 
 * Helper to remove a login method from allowed methods
 * 
 * @param method - Login method to remove
 * @returns Updated configuration
 */
export const removeLoginMethod = async (
    method: string | LoginMethod
): Promise<SystemConfigResponse> => {
    const config = await getSystemConfig();
    const currentMethods = config.allowed_login_methods.filter(m => m !== method);

    return updateSystemConfig({
        allowed_login_methods: currentMethods,
    });
};

/**
 * Set allowed login methods
 * 
 * Helper to set the complete list of allowed login methods
 * 
 * @param methods - Array of allowed login methods
 * @returns Updated configuration
 */
export const setAllowedLoginMethods = async (
    methods: (string | LoginMethod)[]
): Promise<SystemConfigResponse> => {
    return updateSystemConfig({
        allowed_login_methods: methods,
    });
};

/**
 * Add file type
 * 
 * Helper to add a new file type to allowed types
 * 
 * @param fileType - File type to add (e.g., 'pdf', 'docx')
 * @returns Updated configuration
 */
export const addFileType = async (
    fileType: string | AllowedFileType
): Promise<SystemConfigResponse> => {
    const config = await getSystemConfig();
    const currentTypes = config.allowed_file_types;

    if (!currentTypes.includes(fileType)) {
        currentTypes.push(fileType);
    }

    return updateSystemConfig({
        allowed_file_types: currentTypes,
    });
};

/**
 * Remove file type
 * 
 * Helper to remove a file type from allowed types
 * 
 * @param fileType - File type to remove
 * @returns Updated configuration
 */
export const removeFileType = async (
    fileType: string | AllowedFileType
): Promise<SystemConfigResponse> => {
    const config = await getSystemConfig();
    const currentTypes = config.allowed_file_types.filter(t => t !== fileType);

    return updateSystemConfig({
        allowed_file_types: currentTypes,
    });
};

/**
 * Set allowed file types
 * 
 * Helper to set the complete list of allowed file types
 * 
 * @param fileTypes - Array of allowed file types
 * @returns Updated configuration
 */
export const setAllowedFileTypes = async (
    fileTypes: (string | AllowedFileType)[]
): Promise<SystemConfigResponse> => {
    return updateSystemConfig({
        allowed_file_types: fileTypes,
    });
};

/**
 * Check if login method is allowed
 * 
 * Helper to check if a specific login method is enabled
 * 
 * @param method - Login method to check
 * @returns Boolean indicating if method is allowed
 */
export const isLoginMethodAllowed = async (
    method: string | LoginMethod
): Promise<boolean> => {
    try {
        const config = await getSystemConfig();
        return config.allowed_login_methods.includes(method);
    } catch (error) {
        logger.error(`Error checking login method ${method}:`, error);
        return false;
    }
};

/**
 * Check if file type is allowed
 * 
 * Helper to check if a specific file type is allowed
 * 
 * @param fileType - File type to check
 * @returns Boolean indicating if file type is allowed
 */
export const isFileTypeAllowed = async (
    fileType: string | AllowedFileType
): Promise<boolean> => {
    try {
        const config = await getSystemConfig();
        return config.allowed_file_types.includes(fileType);
    } catch (error) {
        logger.error(`Error checking file type ${fileType}:`, error);
        return false;
    }
};

/**
 * Get system limits summary
 * 
 * Helper to get just the system limits
 * 
 * @returns System limits configuration
 */
export const getSystemLimits = async (): Promise<{
    maximum_users: number;
    max_file_size_mb: number;
    api_requests_per_hour: number;
    file_uploads_per_hour: number;
}> => {
    try {
        const config = await getSystemConfig();
        return {
            maximum_users: config.maximum_users,
            max_file_size_mb: config.max_file_size_mb,
            api_requests_per_hour: config.api_requests_per_hour,
            file_uploads_per_hour: config.file_uploads_per_hour,
        };
    } catch (error) {
        logger.error('Error fetching system limits:', error);
        throw error;
    }
};

/**
 * Validate email format
 * 
 * Utility to validate support email format before updating
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Format file size
 * 
 * Utility to format file size in MB
 */
export const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB >= 1024) {
        return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeInMB} MB`;
};

/**
 * Format rate limit
 * 
 * Utility to format rate limit values
 */
export const formatRateLimit = (limit: number, period: 'hour' | 'minute' = 'hour'): string => {
    if (limit >= 1000) {
        return `${(limit / 1000).toFixed(1)}K/${period}`;
    }
    return `${limit}/${period}`;
};

/**
 * Get configuration summary
 * 
 * Helper to get a summary of important configuration settings
 * 
 * @returns Configuration summary
 */
export const getConfigSummary = async (): Promise<{
    platform: string;
    maintenance: boolean;
    userLimit: number;
    loginMethods: number;
    fileTypes: number;
    apiRateLimit: number;
}> => {
    try {
        const config = await getSystemConfig();
        return {
            platform: config.platform_name,
            maintenance: config.maintenance_mode,
            userLimit: config.maximum_users,
            loginMethods: config.allowed_login_methods.length,
            fileTypes: config.allowed_file_types.length,
            apiRateLimit: config.api_requests_per_hour,
        };
    } catch (error) {
        logger.error('Error fetching config summary:', error);
        throw error;
    }
};
