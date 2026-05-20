import { Experience } from "@/api/userApi";
import ExperienceCard from "./ExperienceCard";
import { FaBriefcase } from "react-icons/fa";

interface Props {
  experienceList: Partial<Experience>[];
  onEdit: (edu: Partial<Experience>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
  onAdd: () => void;
}

export default function ExperienceList({ experienceList, onEdit, onDelete, onAdd }: Props) {
  return (
    <>
      {experienceList.map((exp, index) => (
        <ExperienceCard key={exp.id || index} exp={exp} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}

      <div className="flex justify-self-end">
        <button
          type="button"
          onClick={onAdd}
          className="bg-[#2257a7] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg"
        >
          <FaBriefcase className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>
    </>
  );
}
