import { Projects } from "@/api/userApi";
import ProjectsCard from "./ProjectsCard";
import { FaFolderOpen } from "react-icons/fa";

interface Props {
    projectsList: Partial<Projects>[];
    onEdit: (edu: Partial<Projects>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
    onAdd: () => void;
}

export default function ProjectsList({ projectsList, onEdit, onDelete, onAdd }: Props) {
    return (
        <>
            {projectsList.map((pro, index) => (
                <ProjectsCard key={pro.id || index} pro={pro} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}

            <div className="flex justify-self-end">
                <button
                    type="button"
                    onClick={onAdd}
                    className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg"
                >
                    <FaFolderOpen className="w-4 h-4" />
                    <span>Add Projects</span>
                </button>
            </div>
        </>
    );
}
