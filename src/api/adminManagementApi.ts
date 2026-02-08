import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';
// ==================== INTERFACES ====================

export interface AdminListQueryParams {
    page?: number;
    page_size?: number;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
    status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    search?: string;
    created_from?: string; // ISO format date
    created_to?: string; // ISO format date
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface AdminListItem {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    status: string;
    last_login: string | null;
    created_at: string;
    totp_enabled: boolean;
}

export interface AdminListResponse {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    admins: AdminListItem[];
}

export interface AdminDetailsResponse {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    status: string;
    totp_enabled: boolean;
    last_login: string | null;
    created_at: string;
    updated_at?: string;
}

export interface UpdateAdminRoleRequest {
    role: string;
    reason: string;
}

export interface UpdateAdminRoleResponse {
    success: boolean;
    message: string;
    admin_id: string;
    new_role: string;
}

export interface UpdateAdminStatusRequest {
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    reason: string;
}

export interface UpdateAdminStatusResponse {
    success: boolean;
    message: string;
    admin_id: string;
    new_status: string;
}

// ==================== ADMIN MANAGEMENT API FUNCTIONS ====================

/**
 * Get list of all admins with filtering, pagination, and sorting
 * 
 * Displays:
 * - Admin name
 * - Email
 * - Current role
 * - Status
 * - Last login
 * - Created date
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Items per page, 1-100 (default: 50)
 * - role: Filter by role (SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT)
 * - status: Filter by status (ACTIVE, SUSPENDED, INACTIVE)
 * - search: Search by name, email, or username
 * - created_from: Filter from date (ISO format)
 * - created_to: Filter to date (ISO format)
 * - sort_by: Field to sort by (default: created_at)
 * - sort_order: Sort order asc/desc (default: desc)
 */
export const getAdminList = async (
    params?: AdminListQueryParams
): Promise<AdminListResponse> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params?.role) queryParams.append('role', params.role);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.created_from) queryParams.append('created_from', params.created_from);
        if (params?.created_to) queryParams.append('created_to', params.created_to);
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

        const url = `/admin/auth/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get<AdminListResponse>(url);
        return response.data;
    } catch (error) {
        logger.error('Error fetching admin list:', error);
        throw error;
    }
};

/**
 * Get detailed information about a specific admin
 * 
 * Returns:
 * - Admin ID
 * - Email
 * - Username
 * - Full name
 * - Role
 * - Status
 * - 2FA enabled status
 * - Last login timestamp
 * - Created timestamp
 */
export const getAdminDetails = async (
    adminId: string
): Promise<AdminDetailsResponse> => {
    try {
        const response = await httpClient.get<AdminDetailsResponse>(
            `/admin/auth/${adminId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error fetching admin details for ${adminId}:`, error);
        throw error;
    }
};

/**
 * Update admin role
 * 
 * Roles:
 * - SUPER_ADMIN: Full system access
 * - ADMIN: Administrative access
 * - MODERATOR: Content moderation access
 * - SUPPORT: Customer support access
 * 
 * Requires:
 * - role: New role to assign
 * - reason: Reason for role change (audit trail)
 * 
 * Only accessible by SUPER_ADMIN
 */
export const updateAdminRole = async (
    adminId: string,
    data: UpdateAdminRoleRequest
): Promise<UpdateAdminRoleResponse> => {
    try {
        const response = await httpClient.patch<UpdateAdminRoleResponse>(
            `/admin/auth/${adminId}/role`,
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error updating admin role for ${adminId}:`, error);
        throw error;
    }
};

/**
 * Update admin account status
 * 
 * Only accessible by SUPER_ADMIN
 * 
 * Statuses:
 * - ACTIVE: Normal account access
 * - SUSPENDED: Account temporarily disabled
 * - INACTIVE: Account disabled (can be reactivated)
 * 
 * ⚠️ Cannot change your own status
 * 
 * Requires:
 * - status: New status to set
 * - reason: Reason for status change (audit trail)
 */
export const updateAdminStatus = async (
    adminId: string,
    data: UpdateAdminStatusRequest
): Promise<UpdateAdminStatusResponse> => {
    try {
        const response = await httpClient.patch<UpdateAdminStatusResponse>(
            `/admin/auth/${adminId}/status`,
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error updating admin status for ${adminId}:`, error);
        throw error;
    }
};

/**
 * Delete admin account
 * 
 * Only accessible by SUPER_ADMIN
 * ⚠️ Cannot delete your own account
 * ⚠️ Cannot delete the last SUPER_ADMIN
 */
export const deleteAdmin = async (
    adminId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await httpClient.delete<{ success: boolean; message: string }>(
            `/admin/auth/${adminId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error deleting admin ${adminId}:`, error);
        throw error;
    }
};
