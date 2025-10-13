import { useState } from "react";

const OPENAI_ROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENAI_ROUTER_API_KEY || "";

export function useAISuggestions() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
  const [activePopup, setActivePopup] = useState<number | null>(null);

  const generateSuggestions = async (
    index: number,
    prompt: string
  ) => {
    if (!prompt) return;
    setLoadingIndex(index);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_ROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          // model: "meta-llama/Meta-Llama-3-70B-Instruct:free", // ✅ LLaMA model on OpenRouter
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: "You are an expert resume writing assistant." },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
          temperature: 0,
        }),
      });

      const data = await response.json();
      const text =
        data?.choices?.[0]?.message?.content?.trim() ||
        "Generated text unavailable.";

      const options = text
        .split(/\n+/) // split numbered/bulleted list
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .slice(0, 3);

      setSuggestions((prev) => ({
        ...prev,
        [index]: options.length > 0 ? options : [text],
      }));
      setActivePopup(index);
    } catch (err) {
      console.error("Error generating AI suggestions:", err);
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


