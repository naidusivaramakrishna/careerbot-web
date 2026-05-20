import { Experience } from "@/api/userApi";
import { ValidationError } from "../../_types/experience-types";
import { useAIGeneration } from "@/hooks/useAIDescriptionGenerator";
import RichTextEditor from "@/components/common/Richtexteditor";
import Image from "next/image";
import { toast } from "sonner";

interface Props {
    experienceForm: Partial<Experience>;
    setExperienceForm: React.Dispatch<React.SetStateAction<Partial<Experience>>>;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
    validationErrors: ValidationError[];
}

const jobTypes = [
    { label: "Full-time", value: "full_time" },
    { label: "Part-time", value: "part_time" },
    { label: "Contract", value: "contract" },
    { label: "Internship", value: "internship" },
    { label: "Freelance", value: "freelance" },
];

export default function ExperienceForm({
    experienceForm,
    setExperienceForm,
    onSave,
    onCancel,
    loading,
    validationErrors,
}: Props) {
    const { generateDescription, isGenerating } = useAIGeneration();

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
        setExperienceForm((prev) => ({ ...prev, [name]: isDateField ? toISODate(value) : value }));
    };

    const handleDescriptionChange = (content: string) => {
        setExperienceForm((prev) => ({ ...prev, description: content }));
    };

    const handleGenerateDescription = async () => {
        if (!experienceForm.job_title?.trim()) {
            toast.error("Please enter a position/job title first to generate a description.");
            return;
        }

        const description = await generateDescription({
            job_title: experienceForm.job_title,
            company: experienceForm.company,
            job_type: experienceForm.job_type,
            location: experienceForm.location
        });

        if (description) {
            // Convert plain text to HTML with bullet points
            const lines = description.split('\n').filter(line => line.trim());
            const htmlContent = `<ul>${lines.map(line => `<li>${line.trim()}</li>`).join('')}</ul>`;

            setExperienceForm((prev) => ({
                ...prev,
                description: htmlContent,
            }));
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Position</label>
                    <input
                        type="text"
                        name="job_title"
                        value={experienceForm.job_title || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("job_title")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("job_title") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("job_title")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Company</label>
                    <input
                        type="text"
                        name="company"
                        value={experienceForm.company || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg  bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("company")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("company") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("company")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Job Type</label>
                    <select
                        name="job_type"
                        value={experienceForm.job_type || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg  bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("job_type")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    >
                        <option value="">Select Job Type</option>
                        {jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {getFieldError("job_type") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("job_type")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={experienceForm.location || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg  bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("location")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("location") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("location")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Start Date</label>
                    <input
                        type="date"
                        name="start_date"
                        value={experienceForm.start_date || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg  bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("start_date")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("start_date") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("start_date")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">End Date</label>
                    <input
                        type="date"
                        name="end_date"
                        value={experienceForm.end_date || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg  bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("end_date")
                                ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                                : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("end_date") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("end_date")}</p>
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
                {/* Rich Text Editor with Built-in AI Button */}
                <RichTextEditor
                    value={experienceForm.description || ""}
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
                        className="bg-[#2257a7] text-white px-4 py-1.5 cursor-pointer rounded hover:bg-[#0d4acc] disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}