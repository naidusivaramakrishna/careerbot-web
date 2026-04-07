"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

const EXAMPLES = ["English", "Chinese", "Spanish", "Hindi", "French"];

interface LanguageItem {
  language: string;
  proficiency?: string;
}

interface Props {
  formData: {
    languages?: LanguageItem[] | string[];
    categorizedSkills?: Record<string, string>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const LanguagesEditor: React.FC<Props> = ({ formData, setFormData }) => {
  const [input, setInput] = useState("");

  // Get languages from formData.languages (spoken languages array)
  // Fallback to old format if needed
  let languagesList: LanguageItem[] = [];

  if (Array.isArray(formData.languages) && formData.languages.length > 0) {
    const firstItem = formData.languages[0];
    // Check if it's an array of objects or strings
    if (typeof firstItem === 'object' && firstItem !== null && 'language' in firstItem) {
      // Already in correct format
      languagesList = formData.languages as LanguageItem[];
    } else if (typeof firstItem === 'string') {
      // Convert string array to object array
      languagesList = (formData.languages as string[]).map(lang => ({
        language: lang,
        proficiency: ""
      }));
    }
  }

  const addLanguage = (langName: string) => {
    if (!langName.trim()) return;

    // Parse "Language - Proficiency" format
    const parts = langName.split(/\s*[-–—]\s*/); // Support different dash types
    const language = parts[0].trim();
    const proficiency = parts.length > 1 ? parts[1].trim() : "";

    // Check if already exists
    if (languagesList.some(item => item.language === language)) return;

    const updatedList = [...languagesList, { language, proficiency }];

    setFormData({
      ...formData,
      languages: updatedList,
    });
    setInput("");
  };

  const removeLanguage = (langName: string) => {
    const updatedList = languagesList.filter(item => item.language !== langName);

    setFormData({
      ...formData,
      languages: updatedList,
    });
  };

  const updateProficiency = (langName: string, proficiency: string) => {
    const updatedList = languagesList.map(item =>
      item.language === langName ? { ...item, proficiency } : item
    );

    setFormData({
      ...formData,
      languages: updatedList,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* LEFT */}
      <div>
        <label className="block text-sm font-medium mb-2">
          What languages do you speak?
        </label>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLanguage(input);
            }
          }}
          placeholder="Type and click enter to add a new one"
          className="w-full border-b-2 border-blue-600 focus:outline-none py-2 text-sm"
        />

        {/* ADDED LANGUAGES */}
        <div className="mt-6 space-y-3">
          {languagesList.map((item: LanguageItem) => (
            <div
              key={item.language}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{item.language}</p>
                <select
                  value={item.proficiency || ""}
                  onChange={(e) => updateProficiency(item.language, e.target.value)}
                  className="mt-1 text-xs border rounded px-2 py-1 w-full bg-white"
                >
                  <option value="">Select proficiency</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                </select>
              </div>
              <button
                onClick={() => removeLanguage(item.language)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div>
        <p className="text-sm font-medium mb-3">Examples</p>

        <div className="space-y-3">
          {EXAMPLES.map((lang) => (
            <button
              key={lang}
              onClick={() => addLanguage(lang)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm"
            >
              <Plus className="w-4 h-4" />
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguagesEditor;
