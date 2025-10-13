import { useState } from "react";

interface Volunteering {
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Props {
  onSave: (data: Volunteering[]) => void;
}

export default function VolunteeringForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Volunteering[]>([
    { role: "", organization: "", startDate: "", endDate: "", isCurrent: false },
  ]);

  const handleChange = (i: number, field: keyof Volunteering, value: string | boolean) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value } as Volunteering;
    setEntries(updated);
  };

  const addEntry = () =>
    setEntries([
      ...entries,
      { role: "", organization: "", startDate: "", endDate: "", isCurrent: false },
    ]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.role ||
          e.organization ||
          e.startDate ||
          e.endDate ||
          e.isCurrent
      )
    );

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl relative bg-white"
        >
          <input
            type="text"
            placeholder="Role"
            className="w-full p-2 mb-2 border rounded"
            value={entry.role}
            onChange={(e) => handleChange(i, "role", e.target.value)}
          />

          <input
            type="text"
            placeholder="Organization"
            className="w-full p-2 mb-2 border rounded"
            value={entry.organization}
            onChange={(e) => handleChange(i, "organization", e.target.value)}
          />

          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="month"
                className="w-full p-2 border rounded"
                value={entry.startDate}
                onChange={(e) => handleChange(i, "startDate", e.target.value)}
              />
            </div>

            {!entry.isCurrent && (
              <div className="flex-1">
                <label className="block text-sm mb-1">End Date</label>
                <input
                  type="month"
                  className="w-full p-2 border rounded"
                  value={entry.endDate}
                  onChange={(e) => handleChange(i, "endDate", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="mb-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={entry.isCurrent}
                onChange={(e) =>
                  handleChange(i, "isCurrent", e.target.checked)
                }
              />
              <span>Currently Volunteering</span>
            </label>
          </div>

          {entries.length > 1 && (
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="absolute top-2 right-2 text-red-500"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addEntry}
          className="px-3 py-1 bg-gray-200 rounded-lg"
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
