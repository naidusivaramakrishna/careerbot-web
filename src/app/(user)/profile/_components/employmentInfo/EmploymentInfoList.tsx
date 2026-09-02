import { Plus } from "lucide-react";
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
            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={onAdd}
                    data-testid="add-employment-info-btn"
                    className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Employment Info
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
