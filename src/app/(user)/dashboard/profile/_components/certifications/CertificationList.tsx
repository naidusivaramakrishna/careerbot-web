import { Award } from "lucide-react";
import { Certification } from "@/api/userApi";
import CertificationCard from "./CertificationCard";

interface Props {
    certificationList: Partial<Certification>[];
    onEdit: (cert: Partial<Certification>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
    onAdd: () => void;
}

export default function CertificationList({ certificationList, onEdit, onDelete, onAdd }: Props) {
    return (
        <>
            {certificationList.map((cert, index) => (
                <CertificationCard key={cert.id || index} cert={cert} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}
            <div className="flex justify-self-end">
                <button
                    type="button"
                    onClick={onAdd}
                    className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg"
                >
                    <Award className="w-4 h-4" />
                    <span>Add Certification</span>
                </button>
            </div>
        </>
    );
}
