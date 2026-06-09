import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { logger } from "@/lib/logger";

const AZURE_ENDPOINT = "https://veliv-mgtcnqad-uaenorth.services.ai.azure.com";
const DEPLOYMENT = "Llama-3.3-70B-Instruct";
const MAX_BODY_BYTES = 256 * 1024; // 256 KB — generate-description bodies are small

// Read the request body incrementally, returning null the moment the
// accumulated byte count exceeds `limit` (the reader is cancelled so the
// rest of the stream is never buffered). Returns the decoded UTF-8 string
// when the body fits.
async function readBodyCapped(req: Request, limit: number): Promise<string | null> {
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}

export async function POST(req: Request) {
  // Require a VERIFIED session — this route spends the server-side Azure API
  // key, so cookie presence is not enough: the JWT signature must check out.
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fast-reject an honestly-declared oversized body before reading anything.
    const declaredLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    // Stream the body and abort as soon as the running UTF-8 byte count
    // exceeds the cap, so a chunked/Content-Length-less payload can never
    // buffer unbounded memory before the check (counting bytes, not UTF-16
    // string length, which would undercount multibyte input).
    const rawBody = await readBodyCapped(req, MAX_BODY_BYTES);
    if (rawBody === null) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    const body = JSON.parse(rawBody);
    const { type } = body;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Azure OpenAI Key" },
        { status: 500 }
      );
    }

    let prompt: string;
    let systemMessage: string;

    if (type === 'experience') {
      const { job_title, company, job_type, location, start_date, end_date } = body;

      // Build context from available fields
      const contextParts = [];
      if (job_title) contextParts.push(`Position: ${job_title}`);
      if (company) contextParts.push(`Company: ${company}`);
      if (job_type) contextParts.push(`Job Type: ${job_type}`);
      if (location) contextParts.push(`Location: ${location}`);

      const context = contextParts.length > 0
        ? contextParts.join('\n')
        : 'Professional work experience';

      prompt = `
Generate a professional job description for a resume based on this information:
${context}

IMPORTANT:
- Write 3-5 bullet points describing key responsibilities and achievements
- Use action verbs (Led, Developed, Managed, Implemented, etc.)
- Be specific and quantifiable where possible
- Do NOT add any introductory text or headings
- Do NOT add bullet points, dashes, or any markers
- Output ONLY the text, one point per line
- Each line should start directly with the action verb
`;

      systemMessage = "You are an expert resume writer. Generate professional, concise job descriptions with bullet points. Respond ONLY with the bullet points, no extra text.";

    } else if (type === 'project') {
      const { project_name, project_type, technologies, role, start_date, end_date } = body;

      // Build context from available fields
      const contextParts = [];
      if (project_name) contextParts.push(`Project: ${project_name}`);
      if (project_type) contextParts.push(`Type: ${project_type}`);
      if (technologies) contextParts.push(`Technologies: ${technologies}`);
      if (role) contextParts.push(`Role: ${role}`);

      const context = contextParts.length > 0
        ? contextParts.join('\n')
        : 'Software project';

      prompt = `
Generate a professional project description for a resume based on this information:
${context}

IMPORTANT:
- Write 3-5 points describing the project, your contributions, and impact
- Use action verbs (Built, Developed, Designed, Implemented, Created, etc.)
- Highlight technical skills and technologies used
- Include measurable outcomes or impact where relevant
- Do NOT add bullet points, dashes, or any markers
- Output ONLY the text, one point per line
- Each line should start directly with the action verb
`;

      systemMessage = "You are an expert resume writer. Generate professional, concise project descriptions with bullet points. Respond ONLY with the bullet points, no extra text.";

    }
    else if (type === "summary") {
      const { fullName, headline, location, skills } = body;

      // Build context from available fields
      const contextParts = [];
      if (fullName) contextParts.push(`Name: ${fullName}`);
      if (headline) contextParts.push(`Headline: ${headline}`);
      if (location) contextParts.push(`Location: ${location}`);
      if (skills && skills.length > 0) contextParts.push(`Skills: ${skills.join(", ")}`);

      const context = contextParts.length > 0
        ? contextParts.join('\n')
        : 'Professional profile';

      prompt = `
Generate a professional 3–4 line resume summary based on this information:
${context}

IMPORTANT:
- Do NOT add any introductory lines.
- Do NOT say "Here is a summary".
- Output ONLY the summary content.
`;

      systemMessage = "You are an expert resume assistant. Respond ONLY with the summary text, no extra headings or explanations.";
    }
    else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'experience' or 'project'" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: type === 'summary' ? 200 : 300,
          temperature: type === 'summary' ? 0.6 : 0.7,
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Log the upstream error server-side; never echo it to the client —
      // it can carry Azure account/deployment details.
      logger.error("generate-description: Azure request failed", data);
      return NextResponse.json(
        { error: "Azure request failed" },
        { status: 500 }
      );
    }

    const description = data?.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "AI returned no description" },
        { status: 400 }
      );
    }

    // Return appropriate field name based on type
    if (type === 'summary') {
      return NextResponse.json({ summary: description });
    } else {
      return NextResponse.json({ description });
    }
  } catch (error) {
    // Log the raw error server-side; the client gets a generic message so we
    // never leak stack traces / internal paths.
    logger.error("generate-description: unexpected server error", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
