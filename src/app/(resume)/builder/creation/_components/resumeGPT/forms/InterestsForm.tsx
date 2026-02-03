import { useState } from "react";

interface Interest {
  name: string;
  description: string;
  category?: string;
}

interface Props {
  onSave: (data: Interest[]) => void;
}

export default function InterestsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Interest[]>([
    { name: "", description: "", category: "" },
  ]);

  const handleChange = (
    i: number,
    field: keyof Interest,
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
        (e) =>
          e.name ||
          e.description ||
          e.category
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
          {/* Interest Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interest <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Traveling, Open Source"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.name}
            onChange={(e) =>
              handleChange(i, "name", e.target.value)
            }
          />

          {/* Description */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Brief description of your interest"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.description}
            onChange={(e) =>
              handleChange(i, "description", e.target.value)
            }
          />

          {/* Category */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            placeholder="Sports, Arts, Technology, etc."
            className="w-full p-1 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.category}
            onChange={(e) =>
              handleChange(i, "category", e.target.value)
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
