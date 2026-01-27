import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const resume_id = body.resume_id;

    if (!resume_id || typeof resume_id !== 'string') {
      return NextResponse.json({ error: 'resume_id required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/parser/calculate-ats/${resume_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'accept': 'application/json',
      },
      body: '{}',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Score calculation failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
