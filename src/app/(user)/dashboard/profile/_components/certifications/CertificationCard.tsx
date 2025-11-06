import { Pencil, Trash2 } from "lucide-react";
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
                <h3 className="font-semibold">{cert.certification_name}</h3>
                <p className="text-sm">{cert.issuer}</p>
                <p className="text-sm text-gray-600">
                    {formatDateRange(cert.start_date, cert.end_date)}
                </p>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => onEdit(cert, index)}
                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                    <Pencil className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(cert.id, index)}
                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
