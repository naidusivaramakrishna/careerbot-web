import { useState } from "react";

interface Certification {
  name: string;
  issuedBy: string;
  year: string;
}

interface Props {
  onSave: (data: Certification[]) => void;
}

export default function CertificationsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Certification[]>([
    { name: "", issuedBy: "", year: "" },
  ]);

  const handleChange = (i: number, field: keyof Certification, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  const addEntry = () =>
    setEntries([...entries, { name: "", issuedBy: "", year: "" }]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(entries.filter((e) => e.name || e.issuedBy || e.year));

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Certification Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certification Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Certification Name"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.name}
            onChange={(e) => handleChange(i, "name", e.target.value)}
          />

          {/* Issued By */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issued By
          </label>
          <input
            type="text"
            placeholder="Enter Issuing Organization"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.issuedBy}
            onChange={(e) => handleChange(i, "issuedBy", e.target.value)}
          />

          {/* Year */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="text"
            placeholder="e.g. 2024"
            className="w-full p-1 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.year}
            onChange={(e) => handleChange(i, "year", e.target.value)}
          />

          {/* Remove button */}
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

      {/* Add More & Save buttons */}
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
