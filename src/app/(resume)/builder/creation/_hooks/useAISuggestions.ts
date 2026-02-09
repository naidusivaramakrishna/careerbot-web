import { useState } from "react";
import logger from "@/lib/logger";

// Replace these with your actual Azure OpenAI values
const AZURE_OPENAI_API_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "";
const AZURE_OPENAI_ENDPOINT = "https://veliv-mgtcnqad-uaenorth.services.ai.azure.com";
const AZURE_OPENAI_DEPLOYMENT_NAME = "Llama-3.3-70B-Instruct";

export function useAISuggestions() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
  const [activePopup, setActivePopup] = useState<number | null>(null);

  const generateSuggestions = async (index: number, prompt: string) => {
    if (!prompt) return;
    setLoadingIndex(index);

    try {
      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are an expert resume writing assistant." },
              { role: "user", content: prompt },
            ],
            max_tokens: 400,
            temperature: 0,
          }),
        }
      );

      const data = await response.json();
      const text =
        data?.choices?.[0]?.message?.content?.trim() || "Generated text unavailable.";

      const options = text
        .split(/\n+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .slice(0, 5);

      setSuggestions((prev) => ({
        ...prev,
        [index]: options.length > 0 ? options : [text],
      }));
      setActivePopup(index);
    } catch (err) {
      logger.error("Error generating AI suggestions:", err);
      setSuggestions((prev) => ({
        ...prev,
        [index]: ["⚠️ Error generating suggestions. Try again."],
      }));
      setActivePopup(index);
    } finally {
      setLoadingIndex(null);
    }
  };

  return {
    loadingIndex,
    suggestions,
    activePopup,
    setActivePopup,
    generateSuggestions,
  };
}
