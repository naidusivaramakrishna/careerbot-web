import { httpClient } from "@/lib/http";

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

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignUpResponse {
  success: boolean;
  message?: string;
}

// ✅ Tokens are now httpOnly cookies - never accessible to JavaScript
// ❌ Removed getAccessToken() - browser manages cookies automatically

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await httpClient.get("/auth/profile");
    return true;
  } catch {
    return false;
  }
};

export const signIn = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>(
    "/auth/signin",
    new URLSearchParams({
      username: data.email,
      password: data.password,
    }) as unknown as Record<string, unknown>,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  // ✅ Backend sets httpOnly cookies automatically
  // ❌ No need to manually store tokens - browser handles this
  return response.data;
};

export const signOut = async () => {
  await httpClient.post("/auth/signout").catch(() => {});
  // ✅ Backend clears httpOnly cookies automatically
  // ❌ No manual cleanup needed
  window.location.href = "/";
};

export const getGoogleLoginUrl = (): string => "https://accounts.google.com/o/oauth2/auth?...";

export const getLinkedInLoginUrl = (): string => "https://www.linkedin.com/oauth/v2/authorization?...";

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    const response = await httpClient.post<SignUpResponse>(
      "/auth/signup",
      data as unknown as Record<string, unknown>
    );
    // ✅ Backend sets httpOnly cookies automatically after signup
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Sign up failed";
    return { success: false, message: errorMessage };
  }
};