import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Google OAuth Callback API Route
 * 
 * Place this file at: app/api/auth/callback/google/route.ts
 * 
 * This handles the redirect from Google OAuth and redirects to a client page
 * that will process the authentication.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      logger.debug('OAuth callback received error param');
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // No code received
    if (!code) {
      return NextResponse.redirect(
        new URL('/signup?error=no_code', request.url)
      );
    }

    // Exchange authorization code with backend
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
    const backendUrl = `${baseUrl}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logger.debug('Backend callback failed with status:', { status: response.status });
      return NextResponse.redirect(
        new URL('/signup?error=auth_failed', request.url)
      );
    }

    // Backend sets httpOnly cookies automatically
    // Redirect to success page
    const successUrl = new URL('/auth/google/success', request.url);

    // Copy cookies from backend response to client response
    const redirectResponse = NextResponse.redirect(successUrl);

    // Forward Set-Cookie headers from backend response
    const setCookieHeaders = response.headers.getSetCookie();
    for (const cookie of setCookieHeaders) {
      redirectResponse.headers.append('Set-Cookie', cookie);
    }

    return redirectResponse;

  } catch (error) {
    logger.debug('Google OAuth callback failed');
    return NextResponse.redirect(
      new URL('/signup?error=callback_failed', request.url)
    );
  }
}