import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-Id') || 'public';

  try {
    // Call backend logout to invalidate tokens on server
    await fetch(`${BACKEND_URL}/api/v1/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
        'Cookie': request.headers.get('cookie') || '',
      },
    }).catch(() => {
      // Ignore backend errors - we still need to clear cookies on frontend
    });

    // Create response that clears all auth cookies
    const response = NextResponse.json({ success: true });

    // Clear all auth cookies by setting them to expire immediately
    // The Max-Age=0 approach works even for httpOnly cookies because we're setting from the server
    response.headers.append('Set-Cookie', 'admin_access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    response.headers.append('Set-Cookie', 'admin_refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    response.headers.append('Set-Cookie', 'access_token=; Path=/; Max-Age=0; SameSite=Lax');
    response.headers.append('Set-Cookie', 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax');

    return response;
  } catch (error) {
    // Even if backend call fails, return response to clear cookies
    const response = NextResponse.json({ success: true });
    response.headers.append('Set-Cookie', 'admin_access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    response.headers.append('Set-Cookie', 'admin_refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    response.headers.append('Set-Cookie', 'access_token=; Path=/; Max-Age=0; SameSite=Lax');
    response.headers.append('Set-Cookie', 'refresh_token=; Path=/; Max-Age=0; SameSite=Lax');
    return response;
  }
}
