import { useState } from "react";

interface Language {
  language: string;
  proficiency: string;
}

interface Props {
  onSave: (data: Language[]) => void;
}

export default function LanguagesForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Language[]>([
    { language: "", proficiency: "" },
  ]);

  const handleChange = (
    i: number,
    field: keyof Language,
    value: string
  ) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  const removeEntry = (i: number) => {
    setEntries(entries.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    onSave(
      entries.filter(
        (e) => e.language || e.proficiency
      )
    );
  };

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Language */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. English, Hindi"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.language}
            onChange={(e) =>
              handleChange(i, "language", e.target.value)
            }
          />

          {/* Proficiency */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proficiency <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Beginner / Intermediate / Fluent"
            className="w-full p-1 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.proficiency}
            onChange={(e) =>
              handleChange(i, "proficiency", e.target.value)
            }
          />

          {/* Actions */}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1 bg-[#2557a7] text-white rounded-lg"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => removeEntry(i)}
            className="mt-2 px-4 text-red-500 text-sm"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
