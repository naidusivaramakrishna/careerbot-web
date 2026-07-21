import { NextRequest, NextResponse } from 'next/server';

// Node.js process-level cache — persists across requests within the same server instance
let cache: { enabled: boolean; updatedAt: number } = { enabled: false, updatedAt: 0 };

export async function GET() {
    return NextResponse.json({ maintenance: cache.enabled });
}

// Called by the admin settings page after a successful system config save
export async function POST(req: NextRequest) {
    const adminToken =
        req.cookies.get('admin_access_token')?.value ||
        req.cookies.get('access_token')?.value;

    if (!adminToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        cache = { enabled: Boolean(body.enabled), updatedAt: Date.now() };
        return NextResponse.json({ success: true, maintenance: cache.enabled });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
