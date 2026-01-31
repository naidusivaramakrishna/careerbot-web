import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // // console.log('📤 Sending to Rasa:', body);
    
    const response = await fetch('http://localhost:8001/webhooks/rest/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // // console.error('❌ Rasa error:', response.status);
      throw new Error(`Rasa returned ${response.status}`);
    }

    const data = await response.json();
    // // console.log('📥 Rasa response:', data);
    
    return NextResponse.json(data);
  } catch (error: any) {
    // // console.error('❌ Proxy error:', error.message);
    return NextResponse.json(
      { error: 'Failed to connect to Rasa', details: error.message },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
