import { degrees, streams } from "@/utils/education-data";
import { Education } from "@/api/userApi";
import { ValidationError } from "../../_types/education-types";

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


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setEducationForm((prev) => ({
      ...prev,
      [name]:
        name === "cgpa"
          ? value === "" ? undefined : parseFloat(value)
          : value,
    }));
  };


  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Institution */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold">School/College</label>
          <input
            type="text"
            name="institution"
            value={educationForm.institution || ""}
            onChange={handleChange}
            className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
          />
          {getFieldError("institution") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("institution")}</p>
          )}
        </div>

        {/* Degree */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Degree</label>
          <select
            name="degree"
            value={educationForm.degree || ""}
            onChange={handleChange}
            className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
          >
            <option value="">Select Degree</option>
            {degrees.map((deg) => (
              <option key={deg} value={deg}>
                {deg}
              </option>
            ))}
          </select>
          {getFieldError("degree") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("degree")}</p>
          )}
        </div>

        {/* Stream */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Stream</label>
          <select
            name="stream"
            value={educationForm.stream || ""}
            onChange={handleChange}
            className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
          >
            <option value="">Select Stream</option>
            {streams.map((stream) => (
              <option key={stream} value={stream}>
                {stream}
              </option>
            ))}
          </select>
          {getFieldError("stream") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("stream")}</p>
          )}
        </div>

        {/* GPA */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold">GPA/Percentage</label>
          <input
            type="number"
            name="cgpa"
            step="0.1"
            min="0"
            max="10"
            value={educationForm.cgpa || ""}
            onChange={handleChange}
            placeholder="e.g., 7.5"
            className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
          />
          {getFieldError("cgpa") && (
            <p className="text-red-500 text-sm mt-1">{getFieldError("cgpa")}</p>
          )}
        </div>

        {/* Dates */}
        {["start_date", "end_date"].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-sm font-semibold">
              {field === "start_date" ? "Start Date" : "End Date"}
            </label>
            <input
              type="date"
              name={field}
              value={(educationForm as any)[field] || ""}
              onChange={handleChange}
              className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
            />
            {getFieldError(field) && (
              <p className="text-red-500 text-sm mt-1">{getFieldError(field)}</p>
            )}
          </div>
        ))}

        {/* Buttons */}
        <div className="col-span-2 flex gap-2 justify-self-end mt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="bg-[#155DFC] text-white px-4 py-1.5 cursor-pointer rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
