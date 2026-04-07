import { cookies } from 'next/headers';

const RASA_URL = process.env.CAREERBOT_AI_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? '';
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export async function POST(req: Request) {
  if (!RASA_URL) {
    return Response.json({ error: 'AI service not configured' }, { status: 503 });
  }

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

  const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: raw,
  });

  const data = await response.json();
  return Response.json(data, {
    headers: { 'Access-Control-Allow-Origin': FRONTEND_URL },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': FRONTEND_URL,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
