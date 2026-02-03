import { useState } from "react";

interface Publication {
  title: string;
  authors: string;
  publicationName: string;
  date: string;
  url: string;
}

interface Props {
  onSave: (data: Publication[]) => void;
}

export default function PublicationsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Publication[]>([
    {
      title: "",
      authors: "",
      publicationName: "",
      date: "",
      url: "",
    },
  ]);

  const handleChange = (
    i: number,
    field: keyof Publication,
    value: string
  ) => {
    const updated = [...entries];
    updated[i] = { ...updated[i], [field]: value };
    setEntries(updated);
  };

  const removeEntry = (i: number) =>
    setEntries(entries.filter((_, idx) => idx !== i));

  const handleSave = () =>
    onSave(
      entries.filter(
        (e) =>
          e.title ||
          e.authors ||
          e.publicationName ||
          e.date ||
          e.url
      )
    );

  return (
    <div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="mb-3 border p-3 rounded-xl bg-white border-gray-300"
        >
          {/* Publication Title */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Publication Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter publication title"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.title}
            onChange={(e) =>
              handleChange(i, "title", e.target.value)
            }
          />

          {/* Authors */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Authors
          </label>
          <input
            type="text"
            placeholder="Author names"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.authors}
            onChange={(e) =>
              handleChange(i, "authors", e.target.value)
            }
          />

          {/* Publication Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Publication Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Journal / Magazine / Website"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.publicationName}
            onChange={(e) =>
              handleChange(i, "publicationName", e.target.value)
            }
          />

          {/* Date */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Publication Date
          </label>
          <input
            type="month"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.date}
            onChange={(e) =>
              handleChange(i, "date", e.target.value)
            }
          />

          {/* URL */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full p-1 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.url}
            onChange={(e) =>
              handleChange(i, "url", e.target.value)
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
