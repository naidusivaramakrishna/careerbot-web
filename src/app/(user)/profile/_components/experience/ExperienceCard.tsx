import { memo, useMemo } from "react";
import { Briefcase, Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Experience } from "@/api/userApi";
import DOMPurify from 'dompurify';

interface Props {
    exp: Partial<Experience>;
    index: number;
    onEdit: (exp: Partial<Experience>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

const jobTypeLabel: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
};

const ExperienceCard = memo(function ExperienceCard({ exp, index, onEdit, onDelete }: Props) {
    const sanitizedDescription = useMemo(() => {
        if (!exp.description) return '';
        try {
            return DOMPurify.sanitize(exp.description.replace(/\n/g, '<br />'));
        } catch {
            return '';
        }
    }, [exp.description]);

    const dateRange = useMemo(
        () => formatDateRange(exp.start_date, exp.end_date),
        [exp.start_date, exp.end_date]
    );

    return (
        <div
            data-testid={`experience-card-${index}`}
            className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-start justify-between gap-3"
        >
            <div className="flex gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 bg-[#EEF3FB] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="w-5 h-5 text-[#2257a7]" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 leading-snug">{exp.job_title}</h3>
                    {exp.company && (
                        <p className="text-sm text-[#2257a7] font-medium mt-0.5">{exp.company}</p>
                    )}
                    <div className="flex flex-wrap gap-3 items-center mt-2">
                        {exp.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {exp.location}
                            </span>
                        )}
                        {dateRange && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {dateRange}
                            </span>
                        )}
                        {exp.job_type && (
                            <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5">
                                {jobTypeLabel[exp.job_type] || exp.job_type}
                            </span>
                        )}
                    </div>
                    {sanitizedDescription && (
                        <div
                            className="text-xs text-gray-600 mt-3 space-y-1 resume-description leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                        />
                    )}
                </div>
            </div>

            <div className="flex gap-1.5 shrink-0 mt-0.5">
                <button
                    type="button"
                    data-testid={`experience-edit-btn-${index}`}
                    onClick={() => onEdit(exp, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
                <button
                    type="button"
                    data-testid={`experience-delete-btn-${index}`}
                    onClick={() => onDelete(exp.id, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    );
});

export default ExperienceCard;
