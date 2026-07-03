import { Experience } from "@/api/userApi";
import ExperienceCard from "./ExperienceCard";
import { Plus } from "lucide-react";

interface Props {
  experienceList: Partial<Experience>[];
  onEdit: (edu: Partial<Experience>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
  onAdd: () => void;
}

export default function ExperienceList({ experienceList, onEdit, onDelete, onAdd }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {experienceList.map((exp, index) => (
        <ExperienceCard key={exp.id || index} exp={exp} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onAdd}
          data-testid="add-experience-btn"
          className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>
    </div>
  );
}
