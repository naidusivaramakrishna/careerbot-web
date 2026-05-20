import { EmploymentInfo } from "@/api/userApi";
import { ValidationError } from "../../_types/experience-types";
import MultiSelectAutocomplete from "@/components/common/MultiSelectAutocomplete";
import { industries, roles, locations, jobTypes, noticePeriod } from "../../_utils/employmentData";

interface Props {
    employmentInfoForm: Partial<EmploymentInfo>;
    setEmploymentInfoForm: React.Dispatch<
        React.SetStateAction<Partial<EmploymentInfo>>
    >;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
    validationErrors: ValidationError[];
}


export default function EmploymentInfoForm({
    employmentInfoForm,
    setEmploymentInfoForm,
    onSave,
    onCancel,
    loading,
}: Props) {
    const updateForm = (data: Partial<EmploymentInfo>) => {
        setEmploymentInfoForm((prev) => ({ ...prev, ...data }));
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Authorized to Work?</label>
                    <select
                        value={
                            employmentInfoForm.authorized_to_work === true
                                ? "true"
                                : employmentInfoForm.authorized_to_work === false
                                    ? "false"
                                    : ""
                        }
                        onChange={(e) =>
                            updateForm({ authorized_to_work: e.target.value === "true" })
                        }
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-gray-100"
                    >
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>

                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Disability</label>
                    <select
                        value={employmentInfoForm.disability_status ?? ""}
                        onChange={(e) =>
                            updateForm({ disability_status: e.target.value })
                        }
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-gray-100"
                    >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Willing to Relocate?</label>
                    <select
                        value={
                            employmentInfoForm.willing_to_relocate === true
                                ? "true"
                                : employmentInfoForm.willing_to_relocate === false
                                    ? "false"
                                    : ""
                        }
                        onChange={(e) =>
                            updateForm({ willing_to_relocate: e.target.value === "true" })
                        }
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-gray-100"
                    >
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Work Mode</label>
                    <select
                        name="work_mode"
                        value={employmentInfoForm.work_mode || ""}
                        onChange={(e) => updateForm({ work_mode: e.target.value as typeof employmentInfoForm["work_mode"] })}
                        className="border border-neutral-200  p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500"
                    >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Gender</label>
                    <select
                        value={employmentInfoForm.gender ?? "male"}
                        onChange={(e) => updateForm({ gender: e.target.value as typeof employmentInfoForm["gender"] })}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500"
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Job-type</label>
                    <select
                        name="job_type"
                        value={employmentInfoForm.preferred_job_type || ""}
                        onChange={(e) => updateForm({ preferred_job_type: e.target.value as typeof employmentInfoForm["preferred_job_type"] })}
                        className="border border-neutral-200  p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500"
                    >
                        <option value="">Select Job Type</option>
                        {jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Employment Status</label>
                    <select
                        value={employmentInfoForm.employment_status ?? "student"}
                        onChange={(e) =>
                            updateForm({ employment_status: e.target.value as typeof employmentInfoForm["employment_status"] })
                        }
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500"
                    >
                        <option value="student">Student</option>
                        <option value="employed">Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="freelancer">Freelancer</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Notice Period</label>
                    <select
                        value={employmentInfoForm.notice_period_days ?? "Immediate"}
                        onChange={(e) =>
                            updateForm({ notice_period_days: e.target.value as typeof employmentInfoForm["notice_period_days"] })
                        }
                        className="border border-neutral-200  p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500"
                    >
                        <option value="">Select Notice Period</option>
                        {noticePeriod.map((days) => (
                            <option key={days.value} value={days.value}>
                                {days.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1  gap-4">
                <MultiSelectAutocomplete
                    label="Preferred Industries"
                    options={industries}
                    values={employmentInfoForm.preferred_industries || []}
                    onChange={(vals) =>
                        updateForm({ preferred_industries: vals })
                    }
                />

                <MultiSelectAutocomplete
                    label="Preferred Roles"
                    options={roles}
                    values={employmentInfoForm.preferred_roles || []}
                    onChange={(vals) =>
                        updateForm({ preferred_roles: vals })
                    }
                />

                <MultiSelectAutocomplete
                    label="Preferred Locations"
                    options={locations}
                    values={employmentInfoForm.preferred_locations || []}
                    onChange={(vals) =>
                        updateForm({ preferred_locations: vals })
                    }
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={onSave}
                    disabled={loading}
                    className="bg-[#2257a7] text-white px-4 py-1.5 cursor-pointer rounded"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
