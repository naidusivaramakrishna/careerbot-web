import { Projects } from "@/api/userApi";
import { ValidationError } from "../../_types/education-types";
import { useAISuggestions } from "@/app/(resume)/builder/creation/_hooks/useAISuggestions";
import { Sparkles } from "lucide-react";
import RichTextEditor from "@/components/common/Richtexteditor";
import { toast } from "sonner";
import { useEffect } from "react";

interface Props {
    projectsForm: Partial<Projects>;
    setProjectsForm: React.Dispatch<React.SetStateAction<Partial<Projects>>>;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
    validationErrors: ValidationError[];
}

export default function ProjectsForm({
    projectsForm,
    setProjectsForm,
    onSave,
    onCancel,
    loading,
    validationErrors,
}: Props) {
    const {
        loadingIndex,
        suggestions,
        generateSuggestions,
    } = useAISuggestions();

    useEffect(() => {
        if (suggestions[0] && suggestions[0].length > 0) {
            const htmlContent = `<ul>${suggestions[0].map((suggestion: string) => `<li>${suggestion}</li>`).join('')}</ul>`;
            setProjectsForm((prev) => ({ ...prev, description: htmlContent }));
        }
    }, [suggestions, setProjectsForm]);

    const getFieldError = (field: string) => {
        const error = validationErrors.find(
            (err) => err.field === `body.${field}` || err.field === field
        );
        return error?.message;
    };

    const toISODate = (value: string): string => {
        const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = value.match(ddmmyyyy);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        return value;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isDateField = name === 'start_date' || name === 'end_date';
        setProjectsForm((prev) => ({ ...prev, [name]: isDateField ? toISODate(value) : value }));
    };

    const handleDescriptionChange = (content: string) => {
        setProjectsForm((prev) => ({ ...prev, description: content }));
    };

    const handleGenerateDescription = () => {
        if (!projectsForm.project_name?.trim()) {
            toast.error("Please enter a project name first to generate a description.");
            return;
        }

        const prompt = `Generate a concise and professional project description based on the following project details:
Project Name: ${projectsForm.project_name}
Role: ${projectsForm.role || ""}
Technologies: ${projectsForm.technologies || ""}

Requirements:
- Generate 5-7 bullet points (one per line)
- Start each point with an action verb
- Highlight key features, achievements, and contributions
- Include technical impact and results
- Focus on your specific role and responsibilities
- Keep each point concise (1-2 lines max)

Return ONLY the bullet points, one per line, without numbering or dashes.`;

        generateSuggestions(0, prompt, "project");
    };

    const inputClass = (field: string) =>
        `w-full border text-sm rounded-lg px-3 py-2.5 bg-gray-50 outline-none transition
         focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white
         ${getFieldError(field)
            ? "border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400"
            : "border-gray-200 hover:border-gray-300"
        }`;

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Project Name</label>
                    <input type="text" name="project_name" id="proj-name" data-testid="proj-name-input"
                        value={projectsForm.project_name || ""} onChange={handleChange} className={inputClass("project_name")} />
                    {getFieldError("project_name") && <p role="alert" className="text-red-500 text-xs">{getFieldError("project_name")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Role</label>
                    <input type="text" name="role" id="proj-role" data-testid="proj-role-input"
                        value={projectsForm.role || ""} onChange={handleChange} className={inputClass("role")} />
                    {getFieldError("role") && <p role="alert" className="text-red-500 text-xs">{getFieldError("role")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Technologies</label>
                    <input type="text" name="technologies" id="proj-technologies" data-testid="proj-technologies-input"
                        value={projectsForm.technologies || ""} onChange={handleChange}
                        placeholder="e.g. React, Node.js, MongoDB" className={inputClass("technologies")} />
                    {getFieldError("technologies") && <p role="alert" className="text-red-500 text-xs">{getFieldError("technologies")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Project Link</label>
                    <input type="text" name="project_link" id="proj-link" data-testid="proj-link-input"
                        value={projectsForm.project_link || ""} onChange={handleChange} className={inputClass("project_link")} />
                    {getFieldError("project_link") && <p role="alert" className="text-red-500 text-xs">{getFieldError("project_link")}</p>}
                </div>
                {["start_date", "end_date"].map((field) => (
                    <div key={field} className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">
                            {field === "start_date" ? "Start Date" : "End Date"}
                        </label>
                        <input type="date" name={field} id={`proj-${field}`} data-testid={`proj-${field}-input`}
                            value={String((projectsForm as Record<string, unknown>)[field] || "")}
                            onChange={handleChange} className={inputClass(field)} />
                        {getFieldError(field) && <p role="alert" className="text-red-500 text-xs">{getFieldError(field)}</p>}
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Description</label>
                    <button
                        type="button"
                        disabled={loadingIndex === 0}
                        onClick={handleGenerateDescription}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-white cursor-pointer bg-linear-to-br from-[#194386] to-[#3b6ecb] hover:bg-blue-700 rounded-full disabled:bg-gray-400 transition"
                    >
                        <Sparkles className={`w-4 h-4 ${loadingIndex === 0 ? 'animate-pulse' : ''}`} />
                        {loadingIndex === 0 ? "Generating..." : "AI Writer"}
                    </button>
                </div>
                <RichTextEditor
                    value={projectsForm.description || ""}
                    onChange={handleDescriptionChange}
                    placeholder="Describe your project and contributions..."
                    minHeight="150px"
                    disabled={false}
                />
                {getFieldError("description") && <p role="alert" className="text-red-500 text-xs">{getFieldError("description")}</p>}
            </div>

            <div className="flex gap-2 justify-end pt-1 border-t border-gray-100">
                <button type="button" onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button type="button" data-testid="proj-save-btn" onClick={onSave} disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
