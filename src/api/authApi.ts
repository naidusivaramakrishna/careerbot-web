import { httpClient } from '@/lib/http';

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

export interface ApiErrorResponse {
  detail: string | ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// ==================== AUTH API FUNCTIONS ====================

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    const response = await httpClient.post<SignUpResponse>('/auth/signup', data);
    return response.data;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in a user
 */
export const signIn = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
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
    return response.data;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  try {
    const response = await httpClient.post<LoginResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Sign out user (optional - if your backend has a logout endpoint)
 */
export const signOut = async (): Promise<void> => {
  try {
    await httpClient.post('/auth/signout');
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
    }
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};

