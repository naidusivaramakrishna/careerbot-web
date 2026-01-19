import { httpClient } from '@/lib/http';
import Cookies from 'js-cookie';
// ==================== INTERFACES ====================

export interface AdminBootstrapRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface AdminBootstrapResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AdminSignUpRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface AdminSignUpResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
  totp_code?: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  admin_id?: string;
  role?: string;
}

export interface CurrentAdminResponse {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  last_login: string | null;
  created_at: string;
}


export interface CreateAdminRequest {
  email: string;
  full_name: string;
  password: string;
  role: 'ADMIN' | 'MODERATOR' | 'SUPPORT';
}

export interface CreateAdminResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
}

export interface Setup2FAResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface Enable2FARequest {
  secret: string;
  totp_code: string;
  backup_codes: string[];
}

export interface Enable2FAResponse {
  success: boolean;
  message: string;
  totp_enabled: boolean;
}


/**
 * Get current authenticated admin's details
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
export const getCurrentAdmin = async (): Promise<CurrentAdminResponse> => {
  try {
    const response = await httpClient.get<CurrentAdminResponse>('/admin/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching current admin details:', error);
    throw error;
  }
};


// ==================== ADMIN AUTH API FUNCTIONS ====================

/**
 * Bootstrap endpoint - Creates first super admin only if no admins exist
 * This should be called only once during initial system setup
 */
export const bootstrapAdmin = async (
  data: AdminBootstrapRequest
): Promise<AdminBootstrapResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('email', data.email);
    formData.append('full_name', data.full_name);
    formData.append('password', data.password);

    const response = await httpClient.post<AdminBootstrapResponse>(
      '/admin/auth/bootstrap',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error bootstrapping admin:', error);
    throw error;
  }
};

/**
 * Admin signup endpoint
 * Super admin assigns default role during signup
 */
export const adminSignUp = async (
  data: AdminSignUpRequest
): Promise<AdminSignUpResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('email', data.email);
    formData.append('full_name', data.full_name);
    formData.append('password', data.password);

    const response = await httpClient.post<AdminSignUpResponse>(
      '/admin/auth/signup',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error signing up admin:', error);
    throw error;
  }
};

/**
 * Admin login endpoint
 * Supports 2FA authentication with TOTP codes
 */
export const adminLogin = async (
  data: AdminLoginRequest
): Promise<AdminLoginResponse> => {
  try {
    // CLEAR EVERYTHING FIRST
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('admin_role');
      sessionStorage.clear();
      Cookies.remove('admin_access_token');
      Cookies.remove('admin_refresh_token');
    }

    // Create form data - backend expects 'username' field (OAuth2 standard)
    const formData = new URLSearchParams();
    formData.append('username', data.email);  // OAuth2 uses 'username' field
    formData.append('password', data.password);

    // Add TOTP code if provided (for 2FA)
    if (data.totp_code) {
      formData.append('totp_code', data.totp_code);
    }

    console.log('🔐 Attempting admin login for:', data.email);

    const response = await httpClient.post<AdminLoginResponse>(
      '/admin/auth/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Login successful');

    const { access_token, token_type } = response.data;

    if (typeof window !== 'undefined') {
      // Store tokens with 'admin_' prefix to differentiate from user tokens
      localStorage.setItem('admin_access_token', access_token);

      // Backend might not return these fields in response, store what we have
      if (response.data.refresh_token) {
        localStorage.setItem('admin_refresh_token', response.data.refresh_token);
      }
      if (response.data.admin_id) {
        localStorage.setItem('admin_id', response.data.admin_id);
      }
      if (response.data.role) {
        localStorage.setItem('admin_role', response.data.role);
      }

      Cookies.set('admin_access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      if (response.data.refresh_token) {
        Cookies.set('admin_refresh_token', response.data.refresh_token, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      }

      window.dispatchEvent(new Event('adminTokenUpdated'));
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Admin login error:', error);

    // Provide more detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    throw error;
  }
};

/**
 * Create a new admin user (protected - requires super admin authentication)
 * This endpoint is for existing super admins to create additional admin accounts
 */
export const createAdmin = async (
  data: CreateAdminRequest
): Promise<CreateAdminResponse> => {
  try {
    const response = await httpClient.post<CreateAdminResponse>(
      '/admin/auth/admins',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

/**
 * Admin logout endpoint
 * Clears all admin tokens and sessions
 */
export const adminLogout = async (): Promise<void> => {
  try {
    await httpClient.post('/admin/auth/logout');
  } catch (error) {
    console.error('Error logging out admin:', error);
  } finally {
    if (typeof window !== 'undefined') {
      // Clear admin-specific tokens
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('admin_role');

      sessionStorage.clear();
      Cookies.remove('admin_access_token');
      Cookies.remove('admin_refresh_token');

      // Force redirect to admin login
      window.location.href = '/admin/login';
    }
  }
};

// ==================== 2FA FUNCTIONS ====================

/**
 * Setup 2FA for admin account
 * Returns secret, QR code URL, and backup codes
 */
export const setup2FA = async (): Promise<Setup2FAResponse> => {
  try {
    const response = await httpClient.post<Setup2FAResponse>(
      '/admin/auth/2fa/setup'
    );
    return response.data;
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw error;
  }
};

/**
 * Enable 2FA for admin account
 * Requires secret, TOTP code, and backup codes
 * Returns authenticator app link for OTP generation
 */
export const enable2FA = async (
  data: Enable2FARequest
): Promise<Enable2FAResponse> => {
  try {
    const response = await httpClient.post<Enable2FAResponse>(
      '/admin/auth/2fa/enable',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw error;
  }
};

/**
 * Disable 2FA for admin account
 */
export const disable2FA = async (totp_code: string): Promise<{ success: boolean }> => {
  try {
    const response = await httpClient.post<{ success: boolean }>(
      '/admin/auth/2fa/disable',
      { totp_code },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw error;
  }
};

/**
 * Verify 2FA backup code
 */
export const verify2FABackupCode = async (
  email: string,
  backup_code: string
): Promise<AdminLoginResponse> => {
  try {
    const response = await httpClient.post<AdminLoginResponse>(
      '/admin/auth/2fa/verify-backup',
      { email, backup_code },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { access_token } = response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_access_token', access_token);

      if (response.data.refresh_token) {
        localStorage.setItem('admin_refresh_token', response.data.refresh_token);
      }
      if (response.data.admin_id) {
        localStorage.setItem('admin_id', response.data.admin_id);
      }
      if (response.data.role) {
        localStorage.setItem('admin_role', response.data.role);
      }

      Cookies.set('admin_access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      if (response.data.refresh_token) {
        Cookies.set('admin_refresh_token', response.data.refresh_token, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      }

      window.dispatchEvent(new Event('adminTokenUpdated'));
    }

    return response.data;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    throw error;
  }
};

/**
 * Refresh admin access token using refresh token
 */
export const refreshAdminToken = async (
  refreshToken: string
): Promise<AdminLoginResponse> => {
  try {
    // CLEAR OLD DATA FIRST
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
      Cookies.remove('admin_access_token');
    }

    const response = await httpClient.post<AdminLoginResponse>(
      '/admin/auth/refresh',
      { refresh_token: refreshToken }
    );

    const { access_token } = response.data;

    // Update tokens in both storage locations
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_access_token', access_token);

      if (response.data.refresh_token) {
        localStorage.setItem('admin_refresh_token', response.data.refresh_token);
      }

      Cookies.set('admin_access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      if (response.data.refresh_token) {
        Cookies.set('admin_refresh_token', response.data.refresh_token, {
          expires: 30,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      }

      // Dispatch event to notify other tabs
      window.dispatchEvent(new Event('adminTokenUpdated'));
    }

    return response.data;
  } catch (error) {
    console.error('Error refreshing admin token:', error);
    throw error;
  }
};