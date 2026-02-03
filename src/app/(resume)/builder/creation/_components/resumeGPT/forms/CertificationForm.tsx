import { useState } from "react";

interface Certification {
  name: string;
  issuedBy: string;
  year: string;
  expiryDate?: string;
  credentialId?: string;
}

interface Props {
  onSave: (data: Certification[]) => void;
}

export default function CertificationsForm({ onSave }: Props) {
  const [entries, setEntries] = useState<Certification[]>([
    {
      name: "",
      issuedBy: "",
      year: "",
      expiryDate: "",
      credentialId: "",
    },
  ]);

  const handleChange = (
    i: number,
    field: keyof Certification,
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
          e.name ||
          e.issuedBy ||
          e.year ||
          e.expiryDate ||
          e.credentialId
      )
    );

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
            placeholder="Enter certification name"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.name}
            onChange={(e) =>
              handleChange(i, "name", e.target.value)
            }
          />

          {/* Issued By */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issued By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Issuing organization"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.issuedBy}
            onChange={(e) =>
              handleChange(i, "issuedBy", e.target.value)
            }
          />

          {/* Year */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="text"
            placeholder="e.g. 2023"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.year}
            onChange={(e) =>
              handleChange(i, "year", e.target.value)
            }
          />

          {/* Expiry Date */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="month"
            className="w-full p-1 mb-3 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.expiryDate}
            onChange={(e) =>
              handleChange(i, "expiryDate", e.target.value)
            }
          />

          {/* Credential ID */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credential ID
          </label>
          <input
            type="text"
            placeholder="Optional credential ID"
            className="w-full p-1 mb-2 text-[15px] border border-gray-300 text-gray-700 rounded"
            value={entry.credentialId}
            onChange={(e) =>
              handleChange(i, "credentialId", e.target.value)
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
