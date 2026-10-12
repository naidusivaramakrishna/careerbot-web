import { NextRequest, NextResponse } from 'next/server';
import { withApiMetrics } from '@/lib/observability/withApiMetrics';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  try {
    const { resumeId } = await params;

    if (!resumeId) {
      return NextResponse.json({ error: 'resume_id required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = `${BACKEND_URL}/api/v1/parser/enhance-keywords/${resumeId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to enhance keywords' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export const POST = withApiMetrics('/api/backend/enhance-keywords/[resumeId]', 'POST', handlePOST);
