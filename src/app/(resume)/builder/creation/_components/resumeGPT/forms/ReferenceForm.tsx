import { useState } from "react";

interface Reference {
  name: string;
  contact: string;
  relation: string;
}

interface Props {
  onSave: (data: Reference[]) => void;
}

export default function ReferencesForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Reference[]>([
    { name: "", contact: "", relation: "" },
  ]);

  const handleChange = (i: number, field: keyof Reference, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  // const addEntry = () =>
  //   setEntries([...entries, { name: "", contact: "", relation: "" }]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(entries.filter((e) => e.name || e.contact || e.relation));

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Name"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.name}
            onChange={(e) => handleChange(i, "name", e.target.value)}
          />

          {/* Contact Info */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Info
          </label>
          <input
            type="text"
            placeholder="Enter Contact Information"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.contact}
            onChange={(e) => handleChange(i, "contact", e.target.value)}
          />

          {/* Relation */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relation
          </label>
          <input
            type="text"
            placeholder="Enter Relation"
            className="w-full p-1 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.relation}
            onChange={(e) => handleChange(i, "relation", e.target.value)}
          />

          {/* Remove Button */}
          {/* {entries.length > 1 && (
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="mt-2 text-red-500 text-sm"
            >
              Remove
            </button>
          )} */}
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

      {/* Add More & Save Buttons */}
      {/* <div className="flex gap-2">
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
      </div> */}
    </div>
  );
}
