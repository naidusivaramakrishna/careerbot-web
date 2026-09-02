import { Certification } from "@/api/userApi";
import CertificationCard from "./CertificationCard";
import { Plus } from "lucide-react";

interface Props {
    certificationList: Partial<Certification>[];
    onEdit: (cert: Partial<Certification>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
    onAdd: () => void;
}

export default function CertificationList({ certificationList, onEdit, onDelete, onAdd }: Props) {
    return (
        <div className="flex flex-col gap-3">
            {certificationList.map((cert, index) => (
                <CertificationCard key={cert.id || index} cert={cert} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}

            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={onAdd}
                    data-testid="add-certification-btn"
                    className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Certification
                </button>
            </div>
        </div>
    );
}
