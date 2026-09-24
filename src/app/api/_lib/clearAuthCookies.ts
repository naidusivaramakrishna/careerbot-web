import { NextResponse } from 'next/server';

/**
 * Clear all authentication cookies across all paths.
 * A cookie's identity is (name, domain, path), so one Set-Cookie per pair is required
 * to ensure no stale session survives logout.
 *
 * Paths covered:
 *   Path=/                       access tokens and refresh tokens
 *   Path=/api                    refresh tokens
 *   Path=/api/v1/auth/refresh    backend-set refresh tokens
 *   Path=/api/v1/admin/auth/refresh   backend-set admin refresh tokens
 *
 * Names covered:
 *   - access_token, admin_access_token (access)
 *   - refresh_token, admin_refresh_token (refresh)
 */
export function clearAuthCookies(response: NextResponse): void {
  const expire = (name: string, path: string) =>
    response.headers.append(
      'Set-Cookie',
      `${name}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0`,
    );

  for (const name of ['access_token', 'admin_access_token']) {
    expire(name, '/');
  }
  for (const name of ['refresh_token', 'admin_refresh_token']) {
    expire(name, '/');
    expire(name, '/api');
    expire(name, '/api/v1/auth/refresh');
    expire(name, '/api/v1/admin/auth/refresh');
  }
}
