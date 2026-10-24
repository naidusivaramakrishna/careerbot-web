export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const AUTH_REDIRECT_STORAGE_KEY = "careerbot_auth_redirect";

export function sanitizeAuthRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://careerbot.local");
    // Never send a signed-in user back into the sign-in flow. The 401 handler
    // stores the current page as `next`; when that page was
    // /auth/google/success, the success page redirected to itself forever.
    if (parsed.pathname === "/auth" || parsed.pathname.startsWith("/auth/")) {
      return fallback;
    }
    // URL normalisation can turn "/..//evil.com" into "//evil.com", which a
    // navigation reads as another host (same class as src/lib/internalPath.ts).
    if (parsed.pathname.startsWith("//")) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export function getStoredAuthRedirect(): string {
  if (typeof window === "undefined") return DEFAULT_AUTH_REDIRECT;

  return sanitizeAuthRedirect(
    sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY)
  );
}
