import { useState } from "react";

interface Project {
  title: string;
  description: string;
  technologies: string;
  startDate: string;
  endDate: string;
  link: string;
}

interface Props {
  onSave: (data: Project[]) => void;
}

export default function ProjectsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Project[]>([
    {
      title: "",
      description: "",
      technologies: "",
      startDate: "",
      endDate: "",
      link: "",
    },
  ]);

  const handleChange = (i: number, field: keyof Project, value: string) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  // const addEntry = () =>
  //   setEntries([
  //     ...entries,
  //     {
  //       title: "",
  //       description: "",
  //       technologies: "",
  //       startDate: "",
  //       endDate: "",
  //       link: "",
  //     },
  //   ]);

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.title ||
          e.description ||
          e.technologies ||
          e.startDate ||
          e.endDate ||
          e.link
      )
    );

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Project Title */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Project Title"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.title}
            onChange={(e) => handleChange(i, "title", e.target.value)}
          />

          {/* Description */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Enter project description"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.description}
            onChange={(e) => handleChange(i, "description", e.target.value)}
          />

          {/* Technologies */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Technologies Used
          </label>
          <input
            type="text"
            placeholder="e.g. React, Node.js, TailwindCSS"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.technologies}
            onChange={(e) => handleChange(i, "technologies", e.target.value)}
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

          {/* Project Link */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Link
          </label>
          <input
            type="text"
            placeholder="Enter project link (optional)"
            className="w-full p-1 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.link}
            onChange={(e) => handleChange(i, "link", e.target.value)}
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
