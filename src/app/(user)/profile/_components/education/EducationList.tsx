import { Education } from "@/api/userApi";
import EducationCard from "./EducationCard";
import { Plus } from "lucide-react";

interface Props {
  educationList: Partial<Education>[];
  onEdit: (edu: Partial<Education>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
  onAdd: () => void;
}

export default function EducationList({ educationList, onEdit, onDelete, onAdd }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {educationList.map((edu, index) => (
        <EducationCard key={edu.id || index} edu={edu} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onAdd}
          data-testid="add-education-btn"
          className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </button>
      </div>
    </div>
  );
}
