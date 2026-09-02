import { Projects } from "@/api/userApi";
import ProjectsCard from "./ProjectsCard";
import { Plus } from "lucide-react";

interface Props {
    projectsList: Partial<Projects>[];
    onEdit: (edu: Partial<Projects>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
    onAdd: () => void;
}

export default function ProjectsList({ projectsList, onEdit, onDelete, onAdd }: Props) {
    return (
        <div className="flex flex-col gap-3">
            {projectsList.map((pro, index) => (
                <ProjectsCard key={pro.id || index} pro={pro} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}

            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={onAdd}
                    data-testid="add-project-btn"
                    className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Project
                </button>
            </div>
        </div>
    );
}
