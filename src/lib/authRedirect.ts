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
