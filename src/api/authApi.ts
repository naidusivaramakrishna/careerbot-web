import { httpClient } from "@/lib/http";
import Cookies from "js-cookie";

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

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || Cookies.get("access_token") || null;
};

export const isAuthenticated = (): boolean => !!getAccessToken();

export const signIn = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>(
    "/auth/signin",
    new URLSearchParams({
      username: data.email,
      password: data.password,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const { access_token, refresh_token } = response.data;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  Cookies.set("access_token", access_token, { expires: 7 });
  Cookies.set("refresh_token", refresh_token, { expires: 30 });
  return response.data;
};

export const signOut = async () => {
  await httpClient.post("/auth/signout").catch(() => {});
  localStorage.clear();
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  window.location.href = "/";
};

export const getGoogleLoginUrl = (): string => "https://accounts.google.com/o/oauth2/auth?...";

export const getLinkedInLoginUrl = (): string => "https://www.linkedin.com/oauth/v2/authorization?...";

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
  try {
    const response = await httpClient.post<SignUpResponse>("/auth/signup", data);
    return response.data;
  } catch (error: any) {
    return { success: false, message: error?.message || "Sign up failed" };
  }
};