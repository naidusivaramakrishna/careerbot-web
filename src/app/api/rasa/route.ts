import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const RASA_URL = process.env.CAREERBOT_AI_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? '';
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read body as text — check size before parsing to prevent large payload attacks
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: raw,
    });

    if (!response.ok) {
      throw new Error(`Rasa returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': FRONTEND_URL },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to connect to Rasa', details: errorMessage },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': FRONTEND_URL,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
