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
            location: experienceForm.location,
        });
        if (description) {
            const lines = description.split('\n').filter(line => line.trim());
            const htmlContent = `<ul>${lines.map(line => `<li>${line.trim()}</li>`).join('')}</ul>`;
            setExperienceForm((prev) => ({ ...prev, description: htmlContent }));
        }
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
                    <label className="text-xs font-medium text-gray-600">Position</label>
                    <input type="text" name="job_title" id="exp-job-title" data-testid="exp-job-title-input"
                        value={experienceForm.job_title || ""} onChange={handleChange} className={inputClass("job_title")} />
                    {getFieldError("job_title") && <p role="alert" className="text-red-500 text-xs">{getFieldError("job_title")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Company</label>
                    <input type="text" name="company" id="exp-company" data-testid="exp-company-input"
                        value={experienceForm.company || ""} onChange={handleChange} className={inputClass("company")} />
                    {getFieldError("company") && <p role="alert" className="text-red-500 text-xs">{getFieldError("company")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Job Type</label>
                    <select name="job_type" id="exp-job-type" data-testid="exp-job-type-select"
                        value={experienceForm.job_type || ""} onChange={handleChange} className={inputClass("job_type")}>
                        <option value="">Select Job Type</option>
                        {jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    {getFieldError("job_type") && <p role="alert" className="text-red-500 text-xs">{getFieldError("job_type")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Location</label>
                    <input type="text" name="location" id="exp-location" data-testid="exp-location-input"
                        value={experienceForm.location || ""} onChange={handleChange} className={inputClass("location")} />
                    {getFieldError("location") && <p role="alert" className="text-red-500 text-xs">{getFieldError("location")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                    <input type="date" name="start_date" id="exp-start-date" data-testid="exp-start-date-input"
                        value={experienceForm.start_date || ""} onChange={handleChange} className={inputClass("start_date")} />
                    {getFieldError("start_date") && <p role="alert" className="text-red-500 text-xs">{getFieldError("start_date")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">End Date</label>
                    <input type="date" name="end_date" id="exp-end-date" data-testid="exp-end-date-input"
                        value={experienceForm.end_date || ""} onChange={handleChange} className={inputClass("end_date")} />
                    {getFieldError("end_date") && <p role="alert" className="text-red-500 text-xs">{getFieldError("end_date")}</p>}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Description</label>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Image src="/assets/icons/magic-pencil.svg" className="w-3.5 h-3.5" width={12} height={12} alt="magic-pencil" />
                        Let AI help you write the description...
                    </div>
                </div>
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
                {isGenerating && <p className="text-xs text-[#2257a7]">Generating description...</p>}
                {getFieldError("description") && <p role="alert" className="text-red-500 text-xs">{getFieldError("description")}</p>}
            </div>

            <div className="flex gap-2 justify-end pt-1 border-t border-gray-100">
                <button type="button" onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button type="button" data-testid="exp-save-btn" onClick={onSave} disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
