import { NextRequest, NextResponse } from 'next/server';

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
      // // console.error('OAuth error:', error);
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

    // Redirect to a client page that will handle the token exchange
    // Pass the code as a query parameter
    return NextResponse.redirect(
      new URL(`/auth/google/process?code=${encodeURIComponent(code)}`, request.url)
    );

  } catch (error) {
    // // console.error('Callback route error:', error);
    return NextResponse.redirect(
      new URL('/signup?error=callback_failed', request.url)
    );
  }
}
