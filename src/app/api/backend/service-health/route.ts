import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Require authenticated session — prevents unauthenticated info disclosure
  const cookieStore = await cookies();
  const session = cookieStore.get('access_token') ?? cookieStore.get('session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/parser/service-health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ status: 'error' }, { status: 503 });
    }

    // Strip upstream details — return only the boolean status
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
