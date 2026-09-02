import { memo, useMemo } from "react";
import { Award, Calendar, Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Certification } from "@/api/userApi";

interface Props {
    cert: Partial<Certification>;
    index: number;
    onEdit: (exp: Partial<Certification>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

const CertificationCard = memo(function CertificationCard({ cert, index, onEdit, onDelete }: Props) {
    const dateRange = useMemo(
        () => formatDateRange(cert.start_date, cert.end_date),
        [cert.start_date, cert.end_date]
    );

    return (
        <div
            data-testid={`certification-card-${index}`}
            className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-start justify-between gap-3"
        >
            <div className="flex gap-3 min-w-0">
                <div className="w-9 h-9 bg-[#EEF3FB] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-5 h-5 text-[#2257a7]" />
                </div>
                <div className="min-w-0">
                    {cert.certification_name && (
                        <h3 className="font-semibold text-sm text-gray-900 leading-snug">
                            {cert.certification_name}
                        </h3>
                    )}
                    {cert.issuer && (
                        <p className="text-sm text-[#2257a7] font-medium mt-0.5">{cert.issuer}</p>
                    )}
                    {dateRange && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {dateRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-1.5 shrink-0 mt-0.5">
                <button
                    type="button"
                    data-testid={`certification-edit-btn-${index}`}
                    onClick={() => onEdit(cert, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
                <button
                    type="button"
                    data-testid={`certification-delete-btn-${index}`}
                    onClick={() => onDelete(cert.id, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    );
});

export default CertificationCard;
