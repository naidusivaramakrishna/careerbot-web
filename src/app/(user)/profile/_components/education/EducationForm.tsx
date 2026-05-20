import { degrees, streams } from "@/utils/education-data";
import { Education } from "@/api/userApi";
import { ValidationError } from "../../_types/education-types";
import { SearchableCombobox } from "@/components/SearchableCombobox";

interface Props {
  educationForm: Partial<Education>;
  setEducationForm: React.Dispatch<React.SetStateAction<Partial<Education>>>;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  validationErrors: ValidationError[];
}

export default function EducationForm({
  educationForm,
  setEducationForm,
  onSave,
  onCancel,
  loading,
  validationErrors,
}: Props) {
  const getFieldError = (field: string) => {
    const error = validationErrors.find(
      (err) => err.field === `body.${field}` || err.field === field
    );
    return error?.message;
  };


  const toISODate = (value: string): string => {
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = value.match(ddmmyyyy);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return value;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const isDateField = name === "start_date" || name === "end_date";

    setEducationForm((prev) => ({
      ...prev,
      [name]: isDateField
        ? toISODate(value)
        : name === "cgpa"
          ? value === "" ? undefined : parseFloat(value)
          : value,
    }));
  };


  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Institution */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold">School/College</label>
          <input
            type="text"
            name="institution"
            value={educationForm.institution || ""}
            onChange={handleChange}
            className={`border p-2.5 text-sm rounded-lg bg-gray-100 transition-colors ${getFieldError("institution")
                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                : "border-neutral-200"
              }`}
          />
          {getFieldError("institution") && (
            <p className="text-red-600 text-xs mt-1">{getFieldError("institution")}</p>
          )}
        </div>

        {/* Degree */}
        <SearchableCombobox
          label="Degree"
          options={degrees}
          value={educationForm.degree || ""}
          onChange={(value) =>
            setEducationForm((prev) => ({ ...prev, degree: value }))
          }
          placeholder="Search or type degree..."
          error={getFieldError("degree")}
        />

        {/* Stream */}
        <SearchableCombobox
          label="Stream"
          options={streams}
          value={educationForm.stream || ""}
          onChange={(value) =>
            setEducationForm((prev) => ({ ...prev, stream: value }))
          }
          placeholder="Search or type stream..."
          error={getFieldError("stream")}
        />

        {/* GPA */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold">GPA</label>
          <input
            type="number"
            name="cgpa"
            step="0.1"
            min="0"
            max="10"
            value={educationForm.cgpa || ""}
            onChange={handleChange}
            placeholder="e.g., 7.5"
            className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("cgpa")
                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                : "border-neutral-200"
              }`}
          />
          {getFieldError("cgpa") && (
            <p className="text-red-600 text-xs mt-1">{getFieldError("cgpa")}</p>
          )}
        </div>

        {/* Dates */}
        {["start_date", "end_date"].map((field) => (
          <div key={field} className="flex flex-col gap-3">
            <label className="text-sm font-semibold">
              {field === "start_date" ? "Start Date" : "End Date"}
            </label>
            <input
              type="date"
              name={field}
              value={String((educationForm as Record<string, unknown>)[field] || "")}
              onChange={handleChange}
              className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError(field)
                  ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-200"
                }`}
            />
            {getFieldError(field) && (
              <p className="text-red-600 text-xs mt-1">{getFieldError(field)}</p>
            )}
          </div>
        ))}

        {/* Buttons */}
        <div className="col-span-2 flex gap-2 justify-self-end mt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="bg-[#2257a7] text-white px-4 py-1.5 cursor-pointer rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
