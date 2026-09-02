"use client";
import React, { useEffect } from "react";
import { useResume } from "../../../_context/ResumeContext";

export const DEFAULT_DECLARATION =
  "I hereby declare that all the information stated above is true and correct to the best of my knowledge and belief.";

const Declaration: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const text = resumeData.declaration || "";
  const date = resumeData.declarationDate ?? "";
  const place = resumeData.declarationPlace ?? "";

  // Seed the default text into context on first mount so editor, context,
  // and templates share one source of truth. Do NOT auto-fill the date —
  // only write it when the user explicitly changes it.
  useEffect(() => {
    if (!resumeData.declaration) {
      setResumeData((prev) => ({ ...prev, declaration: DEFAULT_DECLARATION }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeData((prev) => ({ ...prev, declaration: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeData((prev) => ({ ...prev, declarationDate: e.target.value }));
  };

  const handlePlaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeData((prev) => ({ ...prev, declarationPlace: e.target.value }));
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        The declaration appears at the end of your resume. Edit the text below if needed.
      </p>

      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
        rows={4}
        value={text}
        onChange={handleTextChange}
        placeholder={DEFAULT_DECLARATION}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="text"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            value={date}
            onChange={handleDateChange}
            placeholder="e.g. 04-08-2026"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Place</label>
          <input
            type="text"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            value={place}
            onChange={handlePlaceChange}
            placeholder="e.g. New Delhi"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Signature line is added automatically on the resume for physical signing.
      </p>
    </div>
  );
};

export default Declaration;
