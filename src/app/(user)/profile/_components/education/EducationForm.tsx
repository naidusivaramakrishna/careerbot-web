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

  const inputClass = (field: string) =>
    `w-full border text-sm rounded-lg px-3 py-2.5 bg-gray-50 outline-none transition
     focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white
     ${getFieldError(field)
       ? "border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400"
       : "border-gray-200 hover:border-gray-300"
     }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">

        {/* Institution */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">School / College</label>
          <input
            type="text"
            name="institution"
            id="edu-institution"
            data-testid="edu-institution-input"
            value={educationForm.institution || ""}
            onChange={handleChange}
            placeholder="e.g. MIT, Stanford University"
            className={inputClass("institution")}
          />
          {getFieldError("institution") && (
            <p className="text-red-500 text-xs" role="alert">{getFieldError("institution")}</p>
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
          labelClassName="text-xs font-medium text-gray-600"
          containerClassName="flex flex-col gap-1.5 w-full min-w-0"
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
          labelClassName="text-xs font-medium text-gray-600"
          containerClassName="flex flex-col gap-1.5 w-full min-w-0"
        />

        {/* GPA */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">GPA</label>
          <input
            type="number"
            name="cgpa"
            id="edu-cgpa"
            data-testid="edu-cgpa-input"
            step="0.1"
            min="0"
            max="10"
            value={educationForm.cgpa || ""}
            onChange={handleChange}
            placeholder="e.g. 7.5"
            className={inputClass("cgpa")}
          />
          {getFieldError("cgpa") && (
            <p className="text-red-500 text-xs" role="alert">{getFieldError("cgpa")}</p>
          )}
        </div>

        {/* Dates */}
        {["start_date", "end_date"].map((field) => (
          <div key={field} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              {field === "start_date" ? "Start Date" : "End Date"}
            </label>
            <input
              type="date"
              name={field}
              id={`edu-${field}`}
              data-testid={`edu-${field}-input`}
              value={String((educationForm as Record<string, unknown>)[field] || "")}
              onChange={handleChange}
              className={inputClass(field)}
            />
            {getFieldError(field) && (
              <p className="text-red-500 text-xs" role="alert">{getFieldError(field)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          data-testid="edu-save-btn"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
