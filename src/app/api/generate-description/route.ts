import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    // Auth check — reject unauthenticated requests
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, prompt } = body;

    // Field validation
    if (!type || !["experience", "project", "summary"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'experience', 'project', or 'summary'" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/ai/generate-description`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type, prompt }),
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: backendResponse.status === 401 ? 401 : 502 }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
