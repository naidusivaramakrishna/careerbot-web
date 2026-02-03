import { useState } from "react";

interface Hobby {
  name: string;
  description: string;
  proficiencyLevel?: string;
  achievement?: string;
}

interface Props {
  onSave: (data: Hobby[]) => void;
}

export default function HobbiesForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Hobby[]>([
    {
      name: "",
      description: "",
      proficiencyLevel: "",
      achievement: "",
    },
  ]);

  const handleChange = (
    i: number,
    field: keyof Hobby,
    value: string
  ) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        name: "",
        description: "",
        proficiencyLevel: "",
        achievement: "",
      },
    ]);
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
          e.proficiencyLevel ||
          e.achievement
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
          {/* Hobby Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hobby Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Photography, Chess"
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
            placeholder="Brief description of your hobby"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.description}
            onChange={(e) =>
              handleChange(i, "description", e.target.value)
            }
          />

          {/* Proficiency Level */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proficiency Level
          </label>
          <input
            type="text"
            placeholder="Beginner / Intermediate / Advanced"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.proficiencyLevel}
            onChange={(e) =>
              handleChange(i, "proficiencyLevel", e.target.value)
            }
          />

          {/* Achievement */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Achievement
          </label>
          <input
            type="text"
            placeholder="Awards, competitions, milestones"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.achievement}
            onChange={(e) =>
              handleChange(i, "achievement", e.target.value)
            }
          />

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 bg-[#2557a7] text-white rounded-lg"
            >
              Save
            </button>

            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(i)}
                className="px-4 text-red-500 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add More */}
      <button
        type="button"
        onClick={addEntry}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg"
      >
        + Add More
      </button>
    </div>
  );
}
