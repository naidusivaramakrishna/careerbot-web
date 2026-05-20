import { Education } from "@/api/userApi";
import EducationCard from "./EducationCard";
import { FaUserGraduate } from "react-icons/fa";

interface Props {
  educationList: Partial<Education>[];
  onEdit: (edu: Partial<Education>, index: number) => void;
  onDelete: (id?: string, index?: number) => void;
  onAdd: () => void;
}

export default function EducationList({ educationList, onEdit, onDelete, onAdd }: Props) {
  return (
    <>
      {educationList.map((edu, index) => (
        <EducationCard key={edu.id || index} edu={edu} index={index} onEdit={onEdit} onDelete={onDelete} />
      ))}

      <div className="flex justify-self-end">
        <button
          type="button"
          onClick={onAdd}
          className="bg-[#2257a7] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg"
        >
          <FaUserGraduate className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>
    </>
  );
}
