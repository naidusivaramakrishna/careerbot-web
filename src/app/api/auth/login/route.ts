import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // Proxy login call to actual backend /auth/signin
    const signinUrl = `${BACKEND_URL}/api/v1/auth/signin`;

    let response = await fetch(signinUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: formData.toString(),
    });

    // Fallback to /login if signin fails
    if (!response.ok) {
      const loginUrl = `${BACKEND_URL}/api/v1/auth/login`;
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: formData.toString(),
      });
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorPayload = contentType.includes('application/json') ? await response.json() : await response.text();
      return NextResponse.json(typeof errorPayload === 'string' ? { error: errorPayload } : errorPayload, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
