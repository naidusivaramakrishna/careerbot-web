"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search, Check } from "lucide-react";

interface SummaryVariant {
  role: string;
  summary: string;
}

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  summaryVariants?: SummaryVariant[]; // Backend suggestions
}

/* ================= EXAMPLE DATA ================= */

type ExampleItem = {
  id: string;
  title: string;
  text: string;
};

/**
 * Helper function to extract clean summary text from backend JSON format
 * Backend returns: { "summary": "Text here" }.
 * We need to extract just "Text here"
 */
function extractSummaryText(rawSummary: string): string {
  try {
    // Remove trailing period if present
    const cleaned = rawSummary.trim().replace(/\.$/, '');

    // Try to parse as JSON
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.summary) {
      return parsed.summary;
    }

    // If parsing fails or no summary field, return original
    return cleaned;
  } catch {
    // If JSON parsing fails, return as-is
    return rawSummary.trim();
  }
}

/* ================= COMPONENT ================= */

function SummaryEditor({ formData, setFormData, summaryVariants }: Props) {
  const [activeTab, setActiveTab] = useState<"tips" | "examples">("tips");
  const [search, setSearch] = useState("");
  // this set controls PLUS vs TICK
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const summaryValue = formData.summary || "";

  /* ---------- CONVERT BACKEND VARIANTS TO EXAMPLES ---------- */
  const backendExamples = useMemo((): ExampleItem[] => {
    if (!summaryVariants || summaryVariants.length === 0) {
      return [];
    }

    return summaryVariants.map((variant, index) => ({
      id: `backend-${index}`,
      title: variant.role,
      text: extractSummaryText(variant.summary),
    }));
  }, [summaryVariants]);

  /* ---------- FILTER ---------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return backendExamples;
    return backendExamples.filter(
      (e: ExampleItem) =>
        e.title.toLowerCase().includes(term) ||
        e.text.toLowerCase().includes(term)
    );
  }, [search, backendExamples]);

  /* ---------- INSERT EXAMPLE ---------- */
  const insertExample = (item: ExampleItem) => {
    if (addedIds.has(item.id)) return; // already added → do nothing

    // Replace the entire summary with the selected suggestion
    setFormData({ ...formData, summary: item.text });

    // mark as added → causes re-render and PLUS → TICK
    setAddedIds((prev) => new Set([...Array.from(prev), item.id]));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* LEFT: editor */}
      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold mb-3 text-gray-900">
          How can you describe yourself?
        </h3>

        <div className="border border-gray-300 rounded-xl bg-white overflow-hidden">
          {/* toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 text-sm text-gray-600">
            <button className="font-bold hover:text-gray-900">B</button>
            <button className="italic hover:text-gray-900">I</button>
            <button className="hover:text-gray-900">1.</button>
            <button className="hover:text-gray-900">↺</button>
            <button className="hover:text-gray-900">↻</button>
            <button className="hover:text-gray-900">🔗</button>
            <button className="ml-auto border border-gray-300 px-2.5 py-1 rounded text-blue-600 hover:bg-blue-50">
              A
            </button>
          </div>

          <textarea
            rows={16}
            value={summaryValue}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            onFocus={() => setActiveTab("examples")}
            placeholder="Write a short professional summary..."
            className="w-full px-4 pt-3 pb-4 text-sm leading-6 resize-none outline-none min-h-[320px] text-gray-900"
          />
        </div>
      </div>

      {/* RIGHT: tips / examples */}
      <div className="pl-6 border-l border-gray-200">
        {/* tabs */}
        <div className="flex gap-6 text-sm font-semibold border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("tips")}
            className={`pb-2.5 transition-colors ${
              activeTab === "tips"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tips
          </button>
          <button
            onClick={() => setActiveTab("examples")}
            className={`pb-2.5 transition-colors ${
              activeTab === "examples"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Examples
          </button>
        </div>

        {/* TIPS */}
        {activeTab === "tips" && (
          <div className="text-sm text-gray-700 space-y-4">
            <p>
              A summation of relevant professional abilities, accomplishments, and personal qualities that make you a strong candidate.
            </p>
            <p>
              Tailor it to the job you&apos;re applying for and focus on your most relevant qualifications.
            </p>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Tips</p>
              <ul className="list-disc ml-5 space-y-2">
                <li>The summary should appear at the beginning of your resume.</li>
                <li>Keep it concise: 3–5 bullet points or 2–4 sentences.</li>
                <li>Use job description keywords where appropriate.</li>
                <li>Highlight impact using metrics, results, or outcomes.</li>
              </ul>
            </div>
          </div>
        )}

        {/* EXAMPLES */}
        {activeTab === "examples" && (
          <>
            {/* search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job titles (e.g. Python Developer)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* cards */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((item) => {
                const isAdded = addedIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertExample(item)}
                    className={`w-full text-left flex gap-3 items-start px-3 py-3 rounded-lg border transition-colors ${
                      isAdded
                        ? "bg-blue-50 border-blue-600 text-blue-700 cursor-default"
                        : "bg-white border-gray-300 cursor-pointer hover:bg-blue-50 hover:border-blue-600"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    )}

                    <div className="text-sm leading-5">
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p>{item.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SummaryEditor;
