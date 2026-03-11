import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeData } = body;

    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }

    // Calculate ATS score based on resume data
    // This is a simplified implementation - adjust based on your backend API
    const response = await fetch(`${BACKEND_URL}/api/v1/parser/calculate-ats-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(resumeData),
    });

    if (!response.ok) {
      console.error('Backend ATS score calculation failed:', response.status);
      // Return a default score if backend fails
      return NextResponse.json({
        score: 0,
        details: {
          keywords_score: 0,
          formatting_score: 0,
          grammar_score: 0,
          skills_match: 0,
          improvement_suggestions: ['Unable to calculate score. Please try again.'],
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ATS Score API error:', error);
    return NextResponse.json({
      score: 0,
      details: {
        keywords_score: 0,
        formatting_score: 0,
        grammar_score: 0,
        skills_match: 0,
        improvement_suggestions: ['Service temporarily unavailable.'],
      },
    });
  }
}
