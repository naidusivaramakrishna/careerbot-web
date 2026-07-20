import { NextRequest, NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('[newsletter/subscribe] NEXT_PUBLIC_BASE_URL is not configured.');
    return NextResponse.json(
      { success: false, message: 'Newsletter signup is temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    // NOTE: assumes the backend exposes POST /newsletter/subscribe. Confirm the
    // real path with the backend team — no blog/newsletter endpoint exists there
    // yet as of this writing, so this call will 502 until it's added.
    const backendResponse = await fetch(`${baseUrl}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'blog' }),
    });

    if (!backendResponse.ok) {
      const text = await backendResponse.text().catch(() => '');
      console.error('[newsletter/subscribe] backend rejected subscription', backendResponse.status, text);
      return NextResponse.json(
        { success: false, message: 'We could not save your subscription. Please try again shortly.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, message: 'Subscribed! Check your inbox to confirm.' });
  } catch (error) {
    console.error('[newsletter/subscribe] request to backend failed', error);
    return NextResponse.json(
      { success: false, message: 'We could not reach the newsletter service. Please try again shortly.' },
      { status: 502 },
    );
  }
}
