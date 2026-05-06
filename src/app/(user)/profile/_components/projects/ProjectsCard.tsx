import { Calendar, Pencil, Trash2 } from "lucide-react";
import { Projects } from "@/api/userApi";
import { format } from "date-fns";
import DOMPurify from 'dompurify';
interface Props {
    pro: Partial<Projects>;
    index: number;
    onEdit: (edu: Partial<Projects>, index: number) => void;
    onDelete: (id?: string, index?: number) => void;
}

function formatDateRange(start?: string | Date, end?: string | Date): string {
    if (!start) return "";

    const parseDate = (value?: string | Date) => {
        if (!value) return null;

        if (typeof value === "string") {
            const trimmed = value.trim();

            // Explicit present check
            if (trimmed.toLowerCase() === "present") return "Present";

            const parsed = new Date(trimmed);
            return isNaN(parsed.getTime()) ? null : parsed;
        }

        return value;
    };

    const parsedStart = parseDate(start);
    const parsedEnd = parseDate(end);

    const formattedStart =
        parsedStart instanceof Date ? format(parsedStart, "MMM yyyy") : start;

    // FIXED LOGIC
    let formattedEnd;
    if (!end) {
        formattedEnd = "Present"; // no end date means currently ongoing
    } else if (parsedEnd === "Present") {
        formattedEnd = "Present";
    } else if (parsedEnd instanceof Date) {
        formattedEnd = format(parsedEnd, "MMM yyyy");
    } else {
        // If parse fails, fallback to original text — NOT Present
        formattedEnd = String(end);
    }

    return `${formattedStart} – ${formattedEnd}`;
}


export default function ProjectsCard({ pro, index, onEdit, onDelete }: Props) {
    const sanitizedDescription = pro.description
        ? DOMPurify.sanitize(pro.description.replace(/\n/g, '<br />'))
        : '';
    return (
        <div
            key={pro.id || index}
            className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2"
        >
            <div>
                {pro.project_name && (
                    <h3 className="font-semibold text-lg">{pro.project_name}</h3>
                )}
                {pro.role && pro.role.trim() !== '' && (
                    <p className="text-base font-semibold text-neutral-700">
                        <span className="text-[#2200FF]">{pro.role}</span>
                    </p>
                )}
                <div className="flex gap-4 items-center text-neutral-500 my-4">
                    {pro.start_date && (
                        <div className="flex gap-1 items-center text-neutral-500">
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm">{formatDateRange(pro.start_date, pro.end_date)}</span>
                        </div>
                    )}
                    {pro.project_link && pro.project_link.trim() !== '' && (
                        <div>
                            <a href={pro.project_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                GitHub
                            </a>
                        </div>
                    )}
                </div>
                {pro.technologies && pro.technologies.trim() !== '' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-base font-semibold">
                            Technologies:
                        </span>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {pro.technologies
                                ?.split(",")
                                .map((technology: string, index: number) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer"
                                    >
                                        {technology.trim()}
                                    </span>
                                ))}
                        </div>
                    </div>
                )}
                {sanitizedDescription && (
                    <>
                        <p className="text-black text-base font-semibold">Description: </p>
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
                    onClick={() => onEdit(pro, index)}
                    className="text-sm cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(pro.id, index)}
                    className="border border-red-300 text-sm  cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Delete
                </button>
            </div>
        </div>
    );
}
