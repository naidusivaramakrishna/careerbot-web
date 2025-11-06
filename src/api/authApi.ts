import { httpClient } from '@/lib/http';
import Cookies from 'js-cookie';

// ==================== INTERFACES ====================
export interface SignUpRequest {
  email: string;
  username: string;
  password: string;
}

export interface SignUpResponse {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface GoogleLoginUrlResponse {
  auth_url: string;
}

export interface GoogleCallbackRequest {
  code: string;
  redirect_uri?: string;
}

// ==================== AUTH API FUNCTIONS ====================

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    const response = await httpClient.post<SignUpResponse>('/auth/signup', data);
    return response.data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in a user
 */
export const signIn = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    // CLEAR EVERYTHING FIRST
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }

    const response = await httpClient.post<LoginResponse>(
      '/auth/signin',
      new URLSearchParams({
        username: data.email,
        password: data.password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      Cookies.set('refresh_token', refresh_token, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      window.dispatchEvent(new Event('tokenUpdated'));
    }

    return response.data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  try {
    // CLEAR OLD DATA FIRST
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }

    const response = await httpClient.post<LoginResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );

    const { access_token, refresh_token } = response.data;

    // Update tokens in both storage locations
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      Cookies.set('refresh_token', refresh_token, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

    }
    // Dispatch event to notify other tabs
    window.dispatchEvent(new Event('tokenUpdated'));
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Sign out user
 */

export const signOut = async (): Promise<void> => {
  try {
    await httpClient.post('/auth/signout');
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    if (typeof window !== 'undefined') {
      // Clear EVERYTHING
      localStorage.clear();
      sessionStorage.clear();
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');

      // Force redirect
      window.location.href = '/';
    }
  }
};
// ==================== GOOGLE OAUTH FUNCTIONS ====================


/**
 * Get Google OAuth login URL
 * Returns the URL that frontend should redirect user to for Google authentication
 */
export const getGoogleLoginUrl = async (): Promise<string> => {
  try {
    const response = await httpClient.get<GoogleLoginUrlResponse>('/auth/google/login-url');
    return response.data.auth_url;
  } catch (error) {
    console.error('Error getting Google login URL:', error);
    throw error;
  }
};

// ==================== LINKEDIN OAUTH FUNCTIONS ====================

/**
 * Get LinkedIn OAuth login URL
 * Returns the URL that frontend should redirect user to for LinkedIn authentication
 */
export const getLinkedInLoginUrl = async (): Promise<string> => {
  try {
    const response = await httpClient.get<GoogleLoginUrlResponse>('/auth/linkedin/login-url');
    return response.data.auth_url;
  } catch (error) {
    console.error('Error getting LinkedIn login URL:', error);
    throw error;
  }
};