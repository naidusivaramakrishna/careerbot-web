import { NextResponse } from "next/server";

const AZURE_ENDPOINT = "https://veliv-mgtcnqad-uaenorth.services.ai.azure.com";
const DEPLOYMENT = "Llama-3.3-70B-Instruct";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
- Do NOT say “Here is a summary”.
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
          max_tokens: type === 'summary' ? 200 : 300, // ✅ Shorter for summaries
          temperature: type === 'summary' ? 0.6 : 0.7, // ✅ Less creative for summaries
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // // console.error("Azure Error:", data);
      return NextResponse.json(
        { error: "Azure request failed", details: data },
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

    // ✅ Return appropriate field name based on type
    if (type === 'summary') {
      return NextResponse.json({ summary: description });
    } else {
      return NextResponse.json({ description });
    }
  } catch (error) {
    // // console.error("AI ERROR:", error);
    return NextResponse.json(
      { error: "Unexpected server error", details: error },
      { status: 500 }
    );
  }
}
