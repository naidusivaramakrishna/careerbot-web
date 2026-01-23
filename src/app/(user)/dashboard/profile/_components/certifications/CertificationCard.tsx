import { Calendar, Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Certification } from "@/api/userApi";

interface Props {
    cert: Partial<Certification>;
    index: number;
    onEdit: (exp: Partial<Certification>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

export default function CertificationCard({ cert, index, onEdit, onDelete }: Props) {
    return (
        <div
            key={cert.id || index}
            className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
        >
            <div>
                <h3 className="font-semibold text-black/80 text-lg">
                    Certification: <span className="text-black">{cert.certification_name}</span>
                </h3>
                <p className="text-base font-semibold text-black/80">
                    Issuer: <span className="text-[#2200FF]">{cert.issuer}</span>
                </p>
                <div className="flex gap-1 items-center text-neutral-500 my-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm ">{formatDateRange(cert.start_date, cert.end_date)} </span>
                </div>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => onEdit(cert, index)}
                    className="text-sm cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(cert.id, index)}
                    className="border border-red-300 text-sm  cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Delete
                </button>
            </div>
        </div>
    );
}
