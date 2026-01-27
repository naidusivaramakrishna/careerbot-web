import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/parser/service-health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error' },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'ok',
      backend: data
    });
  } catch {
    return NextResponse.json({
      status: 'error'
    }, { status: 503 });
  }
}
