import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================

export interface UserListQueryParams {
    page?: number;
    page_size?: number;
    role?: 'user' | 'admin' | 'moderator';
    status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
    subscription?: 'free' | 'basic' | 'premium' | 'pro' | 'enterprise';
    search?: string;
    created_from?: string; // ISO format date
    created_to?: string; // ISO format date
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface UserListItem {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    status: string;
    subscription: string;
    created_at: string;
    last_login: string | null;
}

export interface UserListResponse {
    users: UserListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface UserDetailsResponse {
    id: string;
    email: string;
    username: string;
    full_name: string;
    phone: string | null;
    location: string | null;
    role: string;
    status: string;
    joined_at: string;
    last_login: string | null;
    subscription: string | null;
    resumes: Resume[];
    payments: Payment[];
    activity: UserActivityLog[];
}

export interface UpdateUserRequest {
    email?: string;
    full_name?: string;
    role?: 'user' | 'admin' | 'moderator';
    subscription_plan?: 'free' | 'basic' | 'premium' | 'pro' | 'enterprise';
}

export interface UpdateUserResponse {
    success: boolean;
    message: string;
    user: UserDetailsResponse;
}

export interface DeleteUserRequest {
    reason: string;
    confirm: boolean;
}

export interface DeleteUserResponse {
    success: boolean;
    message: string;
    user_id: string;
    deleted_permanently: boolean;
}

export interface SuspendUserRequest {
    reason: string;
    notify_user?: boolean;
}

export interface SuspendUserResponse {
    success: boolean;
    message: string;
    user_id: string;
    status: string;
}

export interface UnsuspendUserResponse {
    success: boolean;
    message: string;
    user_id: string;
    status: string;
}

export interface Resume {
    id: string;
    title: string;
    updated_at: string;
    download_url: string;
}

export interface Payment {
    id: string;
    amount: number;
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
}

export interface UserActivityQueryParams {
    page?: number;
    page_size?: number;
    start_date?: string; // ISO format
    end_date?: string; // ISO format
    event_type?: 'login' | 'logout' | 'feature_used' | 'api_call';
}

export interface UserActivityLog {
    event: string;
    description: string;
    timestamp: number;
    ip: string;
    user_agent: string;
    method: string;
    status_code: number;
}

export interface UserActivityResponse {
    user_id: string;
    total_events: number;
    page: number;
    limit: number;
    total_pages: number;
    events: UserActivityLog[];
    statistics: {
        total_logins: number;
        total_logouts: number;
        total_api_calls: number;
        features_used: number;
        last_login: string | null;
        active_days: number;
    };
}

export interface ExportUsersRequest {
    page?: number;
    page_size?: number;
    role?: string;
    status?: string;
    subscription?: string;
    search?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    format?: 'csv' | 'xlsx';
}

// ==================== USER MANAGEMENT API FUNCTIONS ====================

/**
 * Get paginated user list with filters and sorting
 * 
 * Permissions Required: users:read
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Items per page, 1-100 (default: 50)
 * - role: Filter by user role (user, admin, moderator)
 * - status: Filter by account status (active, inactive, suspended, pending_verification)
 * - subscription: Filter by subscription plan (free, basic, premium, pro, enterprise)
 * - search: Search email, username, or name
 * - created_from: Filter from date (ISO format)
 * - created_to: Filter to date (ISO format)
 * - sort_by: Field to sort by (default: created_at)
 * - sort_order: asc or desc (default: desc)
 */
export const getUserList = async (
    params?: UserListQueryParams
): Promise<UserListResponse> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params?.role) queryParams.append('role', params.role);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.subscription) queryParams.append('subscription', params.subscription);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.created_from) queryParams.append('created_from', params.created_from);
        if (params?.created_to) queryParams.append('created_to', params.created_to);
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

        const url = `/admin/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get<UserListResponse>(url);
        return response.data;
    } catch (error) {
        logger.error('Error fetching user list:', error);
        throw error;
    }
};

/**
 * Get detailed information about a specific user
 * 
 * Returns:
 * - User ID
 * - Email
 * - Username
 * - Full name
 * - Phone
 * - Location
 * - Role
 * - Status
 * - Joined date
 * - Last login
 * - Subscription details
 * - Resumes
 * - Payments
 * - Activity logs
 */
export const getUserDetails = async (
    userId: string
): Promise<UserDetailsResponse> => {
    try {
        const response = await httpClient.get<UserDetailsResponse>(
            `/admin/users/${userId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error fetching user details for ${userId}:`, error);
        throw error;
    }
};

/**
 * Update user information
 * 
 * Permissions Required: Only SUPER_ADMIN can update user
 * 
 * Allowed Updates:
 * - email: Change user email (must be unique)
 * - full_name: Update user's full name
 * - role: Change user role (user, admin, moderator)
 * - subscription_plan: Modify subscription (free, pro, enterprise)
 */
export const updateUser = async (
    userId: string,
    data: UpdateUserRequest
): Promise<UpdateUserResponse> => {
    try {
        const response = await httpClient.put<UpdateUserResponse>(
            `/admin/users/${userId}`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

/**
 * Delete user account
 * 
 * Permissions Required: users:delete
 * 
 * Query Parameters:
 * - permanent: true/false (true = permanent deletion, false = soft delete)
 * 
 * Request Body:
 * - delete_type: Type of deletion
 * - reason: Reason for deletion (required)
 * - confirm: Confirmation flag (must be true)
 * 
 * Effects:
 * - Permanent: User data permanently removed from database
 * - Soft: User status changed to 'deleted', data retained
 */
export const deleteUser = async (
    userId: string,
    data: DeleteUserRequest,
    permanent: boolean = false
): Promise<DeleteUserResponse> => {
    try {
        const response = await httpClient.delete<DeleteUserResponse>(
            `/admin/users/${userId}?permanent=${permanent}`,
            {
                data,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
};

/**
 * Suspend user account
 * 
 * Permissions Required: users:suspend
 * 
 * Parameters:
 * - reason: Reason for suspension (required, 10-500 characters)
 * - notify_user: Send email notification to user (default: true)
 * 
 * Effects:
 * - User status changed to 'suspended'
 * - User cannot login until unsuspended
 * - Active sessions are terminated
 * - Suspension reason stored with account
 * - Optional email notification sent to user
 * - Action logged in audit trail
 */
export const suspendUser = async (
    userId: string,
    data: SuspendUserRequest
): Promise<SuspendUserResponse> => {
    try {
        const response = await httpClient.post<SuspendUserResponse>(
            `/admin/users/${userId}/suspend`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error suspending user ${userId}:`, error);
        throw error;
    }
};

/**
 * Unsuspend (restore) user account
 * 
 * Permissions Required: users:suspend
 * 
 * Effects:
 * - User status changed to 'active'
 * - User can login again
 * - Suspension reason removed from account
 * - Action logged in audit trail
 * - User receives email notification of restoration
 */
export const unsuspendUser = async (
    userId: string
): Promise<UnsuspendUserResponse> => {
    try {
        const response = await httpClient.post<UnsuspendUserResponse>(
            `/admin/users/${userId}/unsuspend`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error unsuspending user ${userId}:`, error);
        throw error;
    }
};

/**
 * Get user activity logs
 * 
 * Tracks USER actions only:
 * - User login/logout
 * - User profile updates
 * - User creating resumes
 * - User making job applications
 * - User API calls
 * - User feature usage
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Items per page, 1-100 (default: 50)
 * - start_date: Filter from date (ISO format)
 * - end_date: Filter to date (ISO format)
 * - event_type: Filter by event type (login, logout, feature_used, api_call)
 */
export const getUserActivity = async (
    userId: string,
    params?: UserActivityQueryParams
): Promise<UserActivityResponse> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        if (params?.event_type) queryParams.append('event_type', params.event_type);

        const url = `/admin/users/${userId}/activity${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get<UserActivityResponse>(url);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching user activity for ${userId}:`, error);
        throw error;
    }
};

/**
 * Export user list to CSV or Excel format with immediate download
 * 
 * Permissions Required: users:read
 * 
 * Filter Behavior:
 * - ✅ No filters provided → Exports ALL users
 * - ✅ Filters provided → Exports filtered subset
 * - ✅ Swagger placeholders → Automatically ignored
 * 
 * Supported Formats:
 * - csv: Comma-separated values
 * - xlsx: Microsoft Excel
 * 
 * Example Requests:
 * 1. Export all users:
 *    { page: 1, page_size: 50 }
 * 
 * 2. Export with filters:
 *    { page: 1, page_size: 50, role: "user", status: "active" }
 */
export const exportUsers = async (
    data: ExportUsersRequest,
    format: 'csv' | 'xlsx' = 'csv'
): Promise<Blob> => {
    try {
        const response = await httpClient.post(
            `/admin/users/export`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'blob', // Important for file download
                params: {
                    format: format
                }
            }
        );

        return response.data as Blob;
    } catch (error) {
        logger.error('Error exporting users:', error);
        throw error;
    }
};

/**
 * Helper function to download exported file
 * 
 * Usage:
 * const blob = await exportUsers(params, 'csv');
 * downloadExportedFile(blob, 'csv');
 */
export const downloadExportedFile = (blob: Blob, format: 'csv' | 'xlsx', filename?: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    link.download = filename || `users_export_${timestamp}.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
