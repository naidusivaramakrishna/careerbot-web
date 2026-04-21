import { Projects } from "@/api/userApi";
import { ValidationError } from "../../_types/education-types";
import Image from "next/image";
import { useAIGeneration } from "@/hooks/useAIDescriptionGenerator";
import RichTextEditor from "@/components/common/Richtexteditor";
import { toast } from "sonner";

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
    const { generateProjectDescription, isGenerating } = useAIGeneration();

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

    const handleGenerateDescription = async () => {
        // Check if at least job title is provided
        if (!projectsForm.project_name?.trim()) {
            toast.error("Please enter a project name first to generate a description.");
            return;
        }

        const description = await generateProjectDescription({
            project_name: projectsForm.project_name,
            role: projectsForm.role,
            technologies: projectsForm.technologies
        });

        if (description) {
            // Convert plain text to HTML with bullet points
            const lines = description.split('\n').filter(line => line.trim());
            const htmlContent = `<ul>${lines.map(line => `<li>${line.trim()}</li>`).join('')}</ul>`;
            setProjectsForm((prev) => ({
                ...prev,
                description: htmlContent,
            }));
        }
    };
    return (
        <div className="flex flex-col gap-2 mb-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Project Name */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Project Name</label>
                    <input
                        type="text"
                        name="project_name"
                        value={projectsForm.project_name || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("project_name")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("project_name") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("project_name")}</p>
                    )}
                </div>

                {/* Role */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Role</label>
                    <input
                        type="text"
                        name="role"
                        value={projectsForm.role || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("role")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("role") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("role")}</p>
                    )}
                </div>

                {/* Technologies */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Technologies</label>
                    <input
                        type="text"
                        name="technologies"
                        value={projectsForm.technologies || ""}
                        onChange={handleChange}
                        placeholder="e.g. React, Node.js, MongoDB"
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("technologies")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("technologies") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("technologies")}</p>
                    )}
                </div>

                {/* Dates */}
                {["start_date", "end_date"].map((field) => (
                    <div key={field} className="flex flex-col gap-3">
                        <label className="text-sm font-semibold">
                            {field === "start_date" ? "Start Date" : "End Date"}
                        </label>
                        <input
                            type="date"
                            name={field}
                            value={String((projectsForm as Record<string, unknown>)[field] || "")}
                            onChange={handleChange}
                            className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError(field)
                                    ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                    : "border-neutral-200"
                                }`}
                        />
                        {getFieldError(field) && (
                            <p className="text-red-600 text-xs mt-1">{getFieldError(field)}</p>
                        )}
                    </div>
                ))}

                {/* Project Link */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Project Link</label>
                    <input
                        type="text"
                        name="project_link"
                        value={projectsForm.project_link || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("project_link")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("project_link") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("project_link")}</p>
                    )}
                </div>
            </div>
            <div className="w-full my-2">
                <div className="flex justify-between py-2">
                    <label className="text-sm font-semibold">Description</label>
                    <div className="flex items-center gap-2">
                        <Image
                            src="/assets/icons/magic-pencil.svg"
                            className="w-4 h-4"
                            width={12}
                            height={12}
                            alt="magic-pencil"
                        />
                        <div className="text-sm">Let AI help you write the description...</div>
                    </div>
                </div>
                {/* Reusable Rich Text Editor */}
                <RichTextEditor
                    value={projectsForm.description || ""}
                    onChange={handleDescriptionChange}
                    placeholder="Describe your role and responsibilities..."
                    minHeight="150px"
                    disabled={isGenerating}
                    onAIGenerate={handleGenerateDescription}
                    isGenerating={isGenerating}
                    showAIButton={true}
                />

                {isGenerating && (
                    <p className="text-sm text-[#1F00EC] mt-1">Generating description...</p>
                )}
                {getFieldError("description") && (
                    <p className="text-red-600 text-xs mt-1">{getFieldError("description")}</p>
                )}
                {/* Buttons */}
                <div className="col-span-2 flex gap-2 justify-self-end mt-2">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={loading}
                        className="bg-[#155DFC] text-white px-4 py-1.5 cursor-pointer rounded"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
