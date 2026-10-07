import { NextRequest, NextResponse } from 'next/server';
import { withApiMetrics } from '@/lib/observability/withApiMetrics';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

async function handlePOST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const token = formData.get('token');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/v1/parser/parse_resume/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json',
      },
      body: backendFormData,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Parse failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export const POST = withApiMetrics('/api/backend/extract', 'POST', handlePOST);
