import { useState } from "react";

interface Internship {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
}

interface Props {
  onSave: (data: Internship[]) => void;
}

export default function InternshipsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Internship[]>([
    { role: "", company: "", startDate: "", endDate: "", currentlyWorking: false, description: "" },
  ]);
  const handleChange = (i: number, field: keyof Internship, value: string | boolean) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };
  // const addEntry = () =>
  //   setEntries([
  //     ...entries,
  //     { role: "", company: "", startDate: "", endDate: "", currentlyWorking: false, description: "" },
  //   ]);
  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));
  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.role ||
          e.company ||
          e.startDate ||
          e.endDate ||
          e.currentlyWorking ||
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
          {/* Role */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Role"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.role}
            onChange={(e) => handleChange(i, "role", e.target.value)}
          />
          {/* Company */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Company"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.company}
            onChange={(e) => handleChange(i, "company", e.target.value)}
          />
          {/* Start Date */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="month"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.startDate}
            onChange={(e) => handleChange(i, "startDate", e.target.value)}
          />
          {/* End Date */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="month"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.endDate}
            onChange={(e) => handleChange(i, "endDate", e.target.value)}
          />
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id={`currently-working-${i}`}
              checked={entry.currentlyWorking}
              onChange={(e) =>
                handleChange(i, "currentlyWorking", e.target.checked)
              }
              className="h-4 w-4 accent-[#2557a7]"
            />
            <label
              htmlFor={`currently-working-${i}`}
              className="text-sm text-gray-700"
            >
              I am currently working here
            </label>
          </div>
          {/* Description */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Describe your work or achievements during internship"
            className="w-full p-1 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.description}
            onChange={(e) => handleChange(i, "description", e.target.value)}
          />
          {/* Remove button BELOW input fields */}
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
      {/* Add More and Save buttons */}
      {/* <div className="flex gap-2">
        <button
          type="button"
          onClick={addEntry}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg"
        >
          + Add More
        </button>
        <button type="button" onClick={handleSave}
          className="px-4 py-1 bg-orange-500 text-white rounded-lg"
        >
          Save
        </button>
      </div> */}
    </div>
  );
}
