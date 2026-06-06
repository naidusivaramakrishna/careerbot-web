import { Calendar, Pencil, Trash2 } from "lucide-react";
import { Education } from "@/api/userApi";
import { format } from "date-fns";

interface Props {
  edu: Partial<Education>;
  index: number;
  onEdit: (edu: Partial<Education>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
}

function formatDateRange(start?: string | Date, end?: string | Date): string {
  if (!start && !end) return "";

  const parseDate = (value?: string | Date) => {
    if (!value) return null;

    if (typeof value === "string") {
      const trimmed = value.trim();

      // Explicit present check
      if (trimmed.toLowerCase() === "present") return "Present";

      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return value;
  };

  const parsedStart = parseDate(start);
  const parsedEnd = parseDate(end);

  // Only end date (e.g. passed_out year from resume parser)
  if (!start && end) {
    if (parsedEnd instanceof Date) return format(parsedEnd, "yyyy");
    return String(end);
  }

  const formattedStart =
    parsedStart instanceof Date ? format(parsedStart, "MMM yyyy") : String(start);

  let formattedEnd;
  if (!end) {
    formattedEnd = "";
  } else if (parsedEnd === "Present") {
    formattedEnd = "Present";
  } else if (parsedEnd instanceof Date) {
    formattedEnd = format(parsedEnd, "MMM yyyy");
  } else {
    formattedEnd = String(end);
  }

  return formattedEnd ? `${formattedStart} – ${formattedEnd}` : formattedStart;
}


export default function EducationCard({ edu, index, onEdit, onDelete }: Props) {
  return (
    <div
      key={edu.id || index}
      className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
    >
      <div>
        <h3 className="font-semibold text-lg">{edu.institution}</h3>
        {edu.degree && edu.degree !== "Other" && (
          <p className="text-base font-semibold text-neutral-700">
            <span className="text-[#2200FF]">{edu.degree}</span>
            {edu.stream && edu.stream !== "Other" && <span> in {edu.stream}</span>}
          </p>
        )}
        <div className="flex gap-4 items-center text-neutral-500 my-4">
          {!edu.start_date && edu.end_date ? (
            <div className="flex gap-1 items-center text-neutral-500">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Passed out: {formatDateRange(edu.start_date, edu.end_date)}</span>
            </div>
          ) : formatDateRange(edu.start_date, edu.end_date) ? (
            <div className="flex gap-1 items-center text-neutral-500">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">{formatDateRange(edu.start_date, edu.end_date)}</span>
            </div>
          ) : null}
          {edu.cgpa && (
            <span className="rounded-full px-3 py-1 bg-[#f2f4f5] text-sm font-semibold text-black/70">
              GPA: {edu.cgpa}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onEdit(edu, index)}
          className="text-sm cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(edu.id, index)}
          className="border border-red-300 text-sm  cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          Delete
        </button>
      </div>
    </div>
  );
}
