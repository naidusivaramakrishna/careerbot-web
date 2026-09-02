import { httpClient } from "@/lib/http";

export type AIContentType = "experience" | "project" | "summary";

interface AISuggestion {
  id: string;
  text: string;
}

interface AIGenerateResponse {
  success?: boolean;
  data?: {
    type?: string;
    suggestions?: AISuggestion[];
    tokens?: Record<string, number>;
  };
  // Legacy flat fields (kept for backwards compat)
  description?: string;
  summary?: string;
  content?: string;
}

export const generateAIDescription = async (
  type: AIContentType,
  prompt: string
): Promise<string[]> => {
  const response = await httpClient.post<AIGenerateResponse>(
    "/ai/generate-description",
    { type, prompt }
  );

  const body = response.data;

  // New structured format: { success, data: { suggestions: [{id, text}] } }
  const structured = body?.data?.suggestions;
  if (Array.isArray(structured) && structured.length > 0) {
    return structured.map(s => s.text.trim()).filter(Boolean).slice(0, 5);
  }

  // Legacy fallback: single string in summary / description / content
  const flat =
    body?.summary?.trim() ||
    body?.description?.trim() ||
    body?.content?.trim() ||
    "";

  if (!flat) throw new Error("No content returned from AI");

  return flat
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 5);
};
