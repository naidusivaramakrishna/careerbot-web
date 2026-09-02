import httpClient from "@/lib/http";

// ─── Response types ───────────────────────────────────────────────────────────

export interface ExtensionSession {
  session_id: string;
  user_id: string;
  job_title: string | null;
  company: string | null;
  job_description: string | null;
  job_url: string | null;
  resume_id: string | null;
  jd_id: string | null;
  profile: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface ExtensionVerifyResponse {
  authenticated: boolean;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  status: string | null;
  is_verified: boolean;
  has_active_resume: boolean;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch the pre-fill session created by the Chrome extension.
 * Called on portal load when ?session=<id> is present in the URL.
 */
export const getExtensionSession = async (
  sessionId: string
): Promise<ExtensionSession> => {
  const response = await httpClient.get<ExtensionSession>(
    `/extension/session/${sessionId}`
  );
  return response.data;
};

/**
 * Verify the current user is authenticated (used by the extension popup).
 * Returns 401 automatically if not logged in.
 */
export const verifyExtensionAuth = async (): Promise<ExtensionVerifyResponse> => {
  const response = await httpClient.get<ExtensionVerifyResponse>(
    "/extension/verify"
  );
  return response.data;
};
