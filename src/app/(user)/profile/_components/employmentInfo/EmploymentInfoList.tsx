import { FileText } from "lucide-react";
import { EmploymentInfo } from "@/api/userApi";
import EmploymentInfoCard from "./EmploymentInfoCard";

interface Props {
    employmentInfo?: Partial<EmploymentInfo>;
    onEdit: (edu: Partial<EmploymentInfo>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
    onAdd: () => void;
}

export default function EmploymentInfoList({
    employmentInfo,
    onEdit,
    onDelete,
    onAdd,
}: Props) {
    if (!employmentInfo) {
        return (
            <div className="flex justify-self-end">
                <button
                    type="button"
                    onClick={onAdd}
                    className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg"
                >
                    <FileText className="w-4 h-4" />
                    <span>Add Employment Info</span>
                </button>
            </div>
        );
    }

    return (
        <EmploymentInfoCard
            emp={employmentInfo}
            onEdit={() => onEdit(employmentInfo, 0)}
            onDelete={() => onDelete(employmentInfo.id, 0)}
        />
    );
}
