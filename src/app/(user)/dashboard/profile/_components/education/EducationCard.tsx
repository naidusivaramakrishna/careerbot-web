import { Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Education } from "@/api/userApi";

interface Props {
  edu: Partial<Education>;
  index: number;
  onEdit: (edu: Partial<Education>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
}

export default function EducationCard({ edu, index, onEdit, onDelete }: Props) {
  return (
    <div
      key={edu.id || index}
      className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
    >
      <div>
        <h3 className="font-semibold">{edu.institution}</h3>
        <p className="text-sm">
          {edu.degree} in {edu.stream}
        </p>
        <p className="text-xs text-neutral-500">
          {formatDateRange(edu.start_date, edu.end_date)} • GPA {edu.cgpa}
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onEdit(edu, index)}
          className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(edu.id, index)}
          className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
