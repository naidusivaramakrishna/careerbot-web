// import { useState } from "react";

// const OPENAI_ROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENAI_ROUTER_API_KEY || "";

// export function useAISuggestions() {
//   const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
//   const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
//   const [activePopup, setActivePopup] = useState<number | null>(null);

//   const generateSuggestions = async (
//     index: number,
//     prompt: string
//   ) => {
//     if (!prompt) return;
//     setLoadingIndex(index);

//     try {
//       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${OPENAI_ROUTER_API_KEY}`,
//         },
//         body: JSON.stringify({
//           // model: "meta-llama/Meta-Llama-3-70B-Instruct:free", // ✅ LLaMA model on OpenRouter
//           model: "meta-llama/llama-3.3-70b-instruct:free",
//           messages: [
//             { role: "system", content: "You are an expert resume writing assistant." },
//             { role: "user", content: prompt },
//           ],
//           max_tokens: 200,
//           temperature: 0,
//         }),
//       });

//       const data = await response.json();
//       const text =
//         data?.choices?.[0]?.message?.content?.trim() ||
//         "Generated text unavailable.";

//       const options = text
//         .split(/\n+/) // split numbered/bulleted list
//         .map((s: string) => s.trim())
//         .filter((s: string) => s.length > 0)
//         .slice(0, 3);

//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: options.length > 0 ? options : [text],
//       }));
//       setActivePopup(index);
//     } catch (err) {
//       console.error("Error generating AI suggestions:", err);
//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: ["⚠️ Error generating suggestions. Try again."],
//       }));
//       setActivePopup(index);
//     } finally {
//       setLoadingIndex(null);
//     }
//   };

//   return {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   };
// }


// import { useState } from "react";

// const OPENAI_ROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENAI_ROUTER_API_KEY || "";

// export function useAISuggestions() {
//   const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
//   const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
//   const [activePopup, setActivePopup] = useState<number | null>(null);

//   const generateSuggestions = async (
//     index: number,
//     prompt: string
//   ) => {
//     if (!prompt) return;
//     setLoadingIndex(index);

//     try {
//       const response = await fetch("https://veliv-mgtcnqad-uaenorth.services.ai.azure.com/openai/v1/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${OPENAI_ROUTER_API_KEY}`,
//         },
//         body: JSON.stringify({
//           // model: "meta-llama/Meta-Llama-3-70B-Instruct:free", // ✅ LLaMA model on OpenRouter
//           model: "Llama-3.3-70B-Instruct",
//           messages: [
//             { role: "system", content: "You are an expert resume writing assistant." },
//             { role: "user", content: prompt },
//           ],
//           max_tokens: 200,
//           temperature: 0,
//         }),
//       });

//       const data = await response.json();
//       const text =
//         data?.choices?.[0]?.message?.content?.trim() ||
//         "Generated text unavailable.";

//       const options = text
//         .split(/\n+/) // split numbered/bulleted list
//         .map((s: string) => s.trim())
//         .filter((s: string) => s.length > 0)
//         .slice(0, 3);

//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: options.length > 0 ? options : [text],
//       }));
//       setActivePopup(index);
//     } catch (err) {
//       console.error("Error generating AI suggestions:", err);
//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: ["⚠️ Error generating suggestions. Try again."],
//       }));
//       setActivePopup(index);
//     } finally {
//       setLoadingIndex(null);
//     }
//   };

//   return {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   };
// }


// import { useState } from "react";

// // ✅ Keep only API key in .env
// const AZURE_OPENAI_API_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "";

// // ✅ Hardcode your Azure details here (NO API version)
// const AZURE_ENDPOINT = "https://veliv-mgtcnqad-uaenorth.services.ai.azure.com";
// const DEPLOYMENT_NAME = "Llama-3.3-70B-Instruct";

// export function useAISuggestions() {
//   const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
//   const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
//   const [activePopup, setActivePopup] = useState<number | null>(null);

//   const generateSuggestions = async (index: number, prompt: string) => {
//     if (!prompt) return;
//     setLoadingIndex(index);

//     try {
//       // ✅ Proper Azure Chat Completions endpoint (no API version)
//       const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions`;

//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "api-key": AZURE_OPENAI_API_KEY,
//         },
//         body: JSON.stringify({
//           model: DEPLOYMENT_NAME, // ✅ optional, some endpoints need this
//           messages: [
//             {
//               role: "system",
//               content: "You are an expert resume writing assistant.",
//             },
//             { role: "user", content: prompt },
//           ],
//           max_tokens: 200,
//           temperature: 0.7,
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Azure API Error:", errorText);
//         throw new Error("Azure OpenAI API returned an error");
//       }

//       const data = await response.json();
//       console.log("✅ Azure API Response:", data);

//       const text =
//         data?.choices?.[0]?.message?.content?.trim() ||
//         "Generated text unavailable.";

//       const options = text
//         .split(/\n+/)
//         .map((s: string) => s.trim())
//         .filter((s: string) => s.length > 0)
//         .slice(0, 3);

//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: options.length > 0 ? options : [text],
//       }));

//       setActivePopup(index);
//     } catch (err) {
//       console.error("❌ Error generating AI suggestions:", err);
//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: ["⚠️ Error generating suggestions. Try again."],
//       }));
//       setActivePopup(index);
//     } finally {
//       setLoadingIndex(null);
//     }
//   };

//   return {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   };
// }



// import { useState } from "react";

// // ✅ Only the API key in .env
// const AZURE_OPENAI_API_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "";

// // ✅ Hardcode your Azure details here
// const AZURE_ENDPOINT = "https://veliv-mgtcnqad-uaenorth.services.ai.azure.com"; // No trailing slash
// const DEPLOYMENT_NAME = "Llama-3.3-70B-Instruct"; // Your deployed model name
// const API_VERSION = "2024-02-15-preview"; // ✅ Required by Azure

// export function useAISuggestions() {
//   const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
//   const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
//   const [activePopup, setActivePopup] = useState<number | null>(null);

//   const generateSuggestions = async (index: number, prompt: string) => {
//     if (!prompt) return;
//     setLoadingIndex(index);

//     try {
//       const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;

//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "api-key": AZURE_OPENAI_API_KEY,
//         },
//         body: JSON.stringify({
//           messages: [
//             {
//               role: "system",
//               content: "You are an expert resume writing assistant.",
//             },
//             { role: "user", content: prompt },
//           ],
//           max_tokens: 200,
//           temperature: 0.7,
//         }),
//       });

//       if (!response.ok) {
//         const errText = await response.text();
//         console.error("Azure API Error:", errText);
//         throw new Error("Azure OpenAI API returned an error");
//       }

//       const data = await response.json();

//       const text =
//         data?.choices?.[0]?.message?.content?.trim() ||
//         "Generated text unavailable.";

//       const options = text
//         .split(/\n+/)
//         .map((s: string) => s.trim())
//         .filter((s: string) => s.length > 0)
//         .slice(0, 3);

//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: options.length > 0 ? options : [text],
//       }));

//       setActivePopup(index);
//     } catch (err) {
//       console.error("Error generating AI suggestions:", err);
//       setSuggestions((prev) => ({
//         ...prev,
//         [index]: ["⚠️ Error generating suggestions. Try again."],
//       }));
//       setActivePopup(index);
//     } finally {
//       setLoadingIndex(null);
//     }
//   };

//   return {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   };
// }

import { useState } from "react";

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