import { useState } from "react";
import { generateAIDescription } from "@/api/suggestionGenerationApi";
import type { AIContentType } from "@/api/suggestionGenerationApi";
import logger from "@/lib/logger";
import { toast } from "sonner";

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
      const options = await generateAIDescription(type, prompt);

      setSuggestions((prev) => ({
        ...prev,
        [index]: options,
      }));
      setActivePopup(index);
    } catch (err) {
      logger.error("Error generating AI suggestions:", err);
      toast.error("Error generating suggestions. Please try again.");
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
