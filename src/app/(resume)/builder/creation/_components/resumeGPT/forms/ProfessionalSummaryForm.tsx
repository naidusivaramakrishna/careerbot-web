import { useState } from "react";

interface Props {
  onSave: (data: string) => void;
}

export default function SummaryForm({ onSave }: Props) {
  const [summary, setSummary] = useState("");

  const handleSave = () => {
    if (summary.trim()) onSave(summary.trim());
  };

  return (
    <div className="border p-3 rounded-xl bg-white">
      <textarea
        placeholder="Write a short professional summary..."
        className="w-full p-2 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <button type="button" onClick={handleSave} className="px-4 py-1 bg-[#2557a7] text-white rounded-lg">
        Save
      </button>
    </div>
  );
}
