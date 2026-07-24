import { memo, useMemo } from "react";
import { Calendar, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Education } from "@/api/userApi";
import { format } from "date-fns";

interface Props {
  edu: Partial<Education>;
  index: number;
  onEdit: (edu: Partial<Education>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
}

function formatEduDateRange(start?: string | Date, end?: string | Date): string {
  if (!start && !end) return "";

  const parseDate = (value?: string | Date) => {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.toLowerCase() === "present") return "Present";
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return value;
  };

  const parsedStart = parseDate(start);
  const parsedEnd = parseDate(end);

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

const EducationCard = memo(function EducationCard({ edu, index, onEdit, onDelete }: Props) {
  const dateLabel = useMemo(() => {
    const range = formatEduDateRange(edu.start_date, edu.end_date);
    return !edu.start_date && edu.end_date ? `Passed out: ${range}` : range;
  }, [edu.start_date, edu.end_date]);

  return (
    <div
      data-testid={`education-card-${index}`}
      className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-start justify-between gap-3"
    >
      <div className="flex gap-3 min-w-0">
        <div className="w-9 h-9 bg-[#EEF3FB] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap className="w-5 h-5 text-[#2257a7]" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug">{edu.institution}</h3>
          {edu.degree && edu.degree !== "Other" && (
            <p className="text-sm text-[#2257a7] font-medium mt-0.5">
              {edu.degree}
              {edu.stream && edu.stream !== "Other" && (
                <span className="text-gray-500 font-normal"> · {edu.stream}</span>
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-center mt-2">
            {dateLabel && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {dateLabel}
              </span>
            )}
            {edu.cgpa && (
              <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5">
                GPA: {edu.cgpa}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onEdit(edu, index)}
          data-testid={`education-edit-btn-${index}`}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(edu.id, index)}
          data-testid={`education-delete-btn-${index}`}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-md px-2.5 py-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
});

export default EducationCard;
