import { useState } from "react";
import { generateAIDescription } from "@/api/suggestionGenerationApi";
import type { AIContentType } from "@/api/suggestionGenerationApi";
import logger from "@/lib/logger";

export function useAISuggestions() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
  const [activePopup, setActivePopup] = useState<number | null>(null);

  const generateSuggestions = async (
    index: number,
    prompt: string,
    type: AIContentType = "experience"
  ) => {
    if (!prompt) return;
    setLoadingIndex(index);

    try {
      const text = await generateAIDescription(type, prompt);

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
