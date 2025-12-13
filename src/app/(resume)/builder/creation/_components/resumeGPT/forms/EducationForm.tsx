import { useState } from "react";

interface Education {
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface Props {
  onSave: (data: Education[]) => void;
}

export default function EducationForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Education[]>([
    { school: "", degree: "", startDate: "", endDate: "" },
  ]);

  const handleChange = (i: number, field: keyof Education, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  // const addEntry = () =>
  //   setEntries([
  //     ...entries,
  //     { school: "", degree: "", startDate: "", endDate: "" },
  //   ]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.school ||
          e.degree ||
          e.startDate ||
          e.endDate
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
            Degree <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Degree"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.degree}
            onChange={(e) => handleChange(i, "degree", e.target.value)}
          />

          {/* School / University */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School / University <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter School / University"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.school}
            onChange={(e) => handleChange(i, "school", e.target.value)}
          />

          {/* Year */}
          {/* <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="text"
            placeholder="Enter Year"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.year}
            onChange={(e) => handleChange(i, "year", e.target.value)}
          /> */}

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
            className="w-full p-1 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.endDate}
            onChange={(e) => handleChange(i, "endDate", e.target.value)}
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


