import { memo, useMemo } from "react";
import { Calendar, FolderKanban, Link, Pencil, Trash2 } from "lucide-react";
import { Projects } from "@/api/userApi";
import { formatDateRange } from "@/utils/formatDate";
import DOMPurify from 'dompurify';

interface Props {
    pro: Partial<Projects>;
    index: number;
    onEdit: (edu: Partial<Projects>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

const ProjectsCard = memo(function ProjectsCard({ pro, index, onEdit, onDelete }: Props) {
    const sanitizedDescription = useMemo(() => {
        if (!pro.description) return '';
        try {
            return DOMPurify.sanitize(pro.description.replace(/\n/g, '<br />'));
        } catch {
            return '';
        }
    }, [pro.description]);

    const technologies = useMemo(
        () => pro.technologies?.trim() ? pro.technologies.split(",").map((t) => t.trim()) : [],
        [pro.technologies]
    );

    const dateRange = useMemo(
        () => formatDateRange(pro.start_date, pro.end_date),
        [pro.start_date, pro.end_date]
    );

    return (
        <div
            data-testid={`project-card-${index}`}
            className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4 flex items-start justify-between gap-3"
        >
            <div className="flex gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 bg-[#EEF3FB] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <FolderKanban className="w-5 h-5 text-[#2257a7]" />
                </div>
                <div className="min-w-0 flex-1">
                    {pro.project_name && (
                        <h3 className="font-semibold text-sm text-gray-900 leading-snug">{pro.project_name}</h3>
                    )}
                    {pro.role && pro.role.trim() !== '' && (
                        <p className="text-sm text-[#2257a7] font-medium mt-0.5">{pro.role}</p>
                    )}
                    <div className="flex flex-wrap gap-3 items-center mt-2">
                        {pro.start_date && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {dateRange}
                            </span>
                        )}
                        {pro.project_link && pro.project_link.trim() !== '' && (
                            <a
                                href={pro.project_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#2257a7] hover:underline"
                            >
                                <Link className="w-3.5 h-3.5" />
                                Project Link
                            </a>
                        )}
                    </div>
                    {technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {technologies.map((tech, i) => (
                                <span key={tech || i} className="text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
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
                    data-testid={`project-edit-btn-${index}`}
                    onClick={() => onEdit(pro, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
                <button
                    type="button"
                    data-testid={`project-delete-btn-${index}`}
                    onClick={() => onDelete(pro.id, index)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    );
});

export default ProjectsCard;
