import { Pencil, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { Experience } from "@/api/userApi";

interface Props {
    exp: Partial<Experience>;
    index: number;
    onEdit: (exp: Partial<Experience>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

export default function ExperienceCard({ exp, index, onEdit, onDelete }: Props) {
    return (
        <div
            key={exp.id || index}
            className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
        >
            <div>
                <h3 className="font-semibold">{exp.job_title}</h3>
                <p className="text-sm">
                    {exp.company} • {exp.job_type}
                </p>
                <p className="text-xs text-neutral-500">
                    {formatDateRange(exp.start_date, exp.end_date)}
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 my-2">
                    {exp.description?.split("\n").map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => onEdit(exp, index)}
                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                    <Pencil className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(exp.id, index)}
                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
