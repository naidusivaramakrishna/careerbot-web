import { Experience } from "@/api/userApi";
import { ValidationError } from "../../_types/experience-types";
import Image from "next/image";
import { Sparkles } from "lucide-react";

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
    const getFieldError = (field: string) => {
        const error = validationErrors.find(
            (err) => err.field === `body.${field}` || err.field === field
        );
        return error?.message;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setExperienceForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Position</label>
                    <input
                        type="text"
                        name="job_title"
                        value={experienceForm.job_title || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("job_title") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("job_title")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Company</label>
                    <input
                        type="text"
                        name="company"
                        value={experienceForm.company || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("company") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("company")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Job Type</label>
                    <select
                        name="job_type"
                        value={experienceForm.job_type || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    >
                        <option value="">Select Job Type</option>
                        {jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {getFieldError("job_type") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("job_type")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={experienceForm.location || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("location") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("location")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                        type="date"
                        name="start_date"
                        value={experienceForm.start_date || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("start_date") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("start_date")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium">End Date</label>
                    <input
                        type="date"
                        name="end_date"
                        value={experienceForm.end_date || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("end_date") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("end_date")}</p>
                    )}
                </div>
            </div>

            <div className="w-full my-2">
                <div className="flex justify-between py-2">
                    <label className="text-sm font-medium">Description</label>
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
                <div className="relative w-full">
                    <textarea
                        rows={4}
                        name="description"
                        placeholder="Description"
                        value={experienceForm.description || ""}
                        onChange={handleChange}
                        className="w-full text-sm border border-neutral-200 p-2.5 rounded-lg bg-white outline-neutral-500"
                    />
                    <Sparkles className="absolute right-4 top-4 text-[#1F00EC] w-4 h-4 cursor-pointer" />
                </div>
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
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-400 text-white px-3 py-1 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
