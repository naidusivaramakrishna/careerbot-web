import { useState } from "react";

interface Achievements {
  title: string;
  date: string;
  description: string;
}

interface Props {
  onSave: (data: Achievements[]) => void;
}

export default function EducationForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Achievements[]>([
    { title: "", date: "", description: "" },
  ]);

  const handleChange = (i: number, field: keyof Achievements, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  const addEntry = () =>
    setEntries([
      ...entries,
      { title: "", date: "", description: "" },
    ]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.title ||
          e.date ||
          e.description
      )
    );

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Degree */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Degree"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.title}
            onChange={(e) => handleChange(i, "title", e.target.value)}
          />

          {/* Date */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="month"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.date}
            onChange={(e) => handleChange(i, "date", e.target.value)}
          />

          {/* Description */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Describe your achievements"
            className="w-full p-1 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.description}
            onChange={(e) => handleChange(i, "description", e.target.value)}
          />

          {/* Remove button BELOW input fields */}
          {entries.length > 1 && (
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="mt-2 text-red-500 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Add More and Save buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addEntry}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg"
        >
          + Add More
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1 bg-orange-500 text-white rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  );
}


