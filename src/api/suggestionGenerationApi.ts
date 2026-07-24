import { httpClient } from "@/lib/http";

export type AIContentType = "experience" | "project" | "summary";

interface AIGenerateResponse {
  description?: string;
  summary?: string;
  content?: string;
}

export const generateAIDescription = async (
  type: AIContentType,
  prompt: string
): Promise<string> => {
  const response = await httpClient.post<AIGenerateResponse>(
    "/ai/generate-description",
    { type, prompt }
  );

  const data = response.data;
  const text =
    data?.summary?.trim() ||
    data?.description?.trim() ||
    data?.content?.trim() ||
    "";

  if (!text) throw new Error("No content returned from AI");
  return text;
};
