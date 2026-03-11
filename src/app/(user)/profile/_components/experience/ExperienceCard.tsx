import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Experience } from "@/api/userApi";
import DOMPurify from 'dompurify';

interface Props {
    exp: Partial<Experience>;
    index: number;
    onEdit: (exp: Partial<Experience>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

export default function ExperienceCard({ exp, index, onEdit, onDelete }: Props) {
    const sanitizedDescription = exp.description
        ? DOMPurify.sanitize(exp.description)
        : '';
    return (
        <div
            key={exp.id || index}
            className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
        >
            <div>
                <h3 className="font-semibold text-lg">{exp.job_title}</h3>
                {exp.company && (
                    <p className="text-base text-[#2200FF]  font-semibold">
                        {exp.company}
                    </p>
                )}
                <div className="flex gap-4 items-center text-neutral-500 my-4">
                    {exp.location && (
                        <div className="flex gap-1 items-center">
                            <MapPin className="w-5 h-5" />
                            <span className="text-sm">{exp.location}</span>
                        </div>
                    )}
                    {formatDateRange(exp.start_date, exp.end_date) && (
                        <div className="flex gap-1 items-center text-neutral-500">
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm">{formatDateRange(exp.start_date, exp.end_date)}</span>
                        </div>
                    )}
                    {exp.job_type && (
                        <span className="rounded-full px-3 py-1 bg-[#f2f4f5] text-sm font-semibold text-black/70">{exp.job_type}</span>
                    )}
                </div>
                {sanitizedDescription && (
                    <>
                        <p className="text-black text-base font-semibold">Responsibilities: </p>
                        <div
                            className="text-sm text-gray-800 space-y-2 resume-description"
                            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                        />
                    </>
                )}
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => onEdit(exp, index)}
                    className="text-sm cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(exp.id, index)}
                    className="border border-red-300 text-sm  cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Delete
                </button>
            </div>
        </div>
    );
}
