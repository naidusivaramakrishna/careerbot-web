import { useCallback } from "react";
import { EmploymentInfo } from "@/api/userApi";
import MultiSelectAutocomplete from "@/components/common/MultiSelectAutocomplete";
import {
    industries, roles, locations, jobTypes, noticePeriod,
    ynOptions, disabilityOptions, workModeOptions, genderOptions, employmentStatusOptions,
} from "../../_utils/employmentData";

interface Props {
    employmentInfoForm: Partial<EmploymentInfo>;
    setEmploymentInfoForm: React.Dispatch<React.SetStateAction<Partial<EmploymentInfo>>>;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
}

const selectClass = "w-full border border-gray-200 text-sm rounded-lg px-3 py-2.5 bg-gray-50 outline-none transition hover:border-gray-300 focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white";

export default function EmploymentInfoForm({
    employmentInfoForm,
    setEmploymentInfoForm,
    onSave,
    onCancel,
    loading,
}: Props) {
    const updateForm = useCallback((data: Partial<EmploymentInfo>) => {
        setEmploymentInfoForm((prev) => ({ ...prev, ...data }));
    }, [setEmploymentInfoForm]);

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Authorized to Work?</label>
                    <select name="authorized_to_work" id="authorized-to-work" data-testid="employment-authorized-select"
                        value={employmentInfoForm.authorized_to_work === true ? "true" : employmentInfoForm.authorized_to_work === false ? "false" : ""}
                        onChange={(e) => updateForm({ authorized_to_work: e.target.value === "true" })}
                        className={selectClass}>
                        <option value="">Select</option>
                        {ynOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Disability</label>
                    <select name="disability_status" id="disability-status" data-testid="employment-disability-select"
                        value={employmentInfoForm.disability_status ?? ""}
                        onChange={(e) => updateForm({ disability_status: e.target.value as typeof employmentInfoForm["disability_status"] })}
                        className={selectClass}>
                        <option value="">Select</option>
                        {disabilityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Willing to Relocate?</label>
                    <select name="willing_to_relocate" id="willing-to-relocate" data-testid="employment-relocate-select"
                        value={employmentInfoForm.willing_to_relocate === true ? "true" : employmentInfoForm.willing_to_relocate === false ? "false" : ""}
                        onChange={(e) => updateForm({ willing_to_relocate: e.target.value === "true" })}
                        className={selectClass}>
                        <option value="">Select</option>
                        {ynOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Work Mode</label>
                    <select name="work_mode" id="work-mode" data-testid="employment-work-mode-select"
                        value={employmentInfoForm.work_mode || ""}
                        onChange={(e) => updateForm({ work_mode: e.target.value as typeof employmentInfoForm["work_mode"] })}
                        className={selectClass}>
                        {workModeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Gender</label>
                    <select name="gender" id="gender" data-testid="employment-gender-select"
                        value={employmentInfoForm.gender ?? "male"}
                        onChange={(e) => updateForm({ gender: e.target.value as typeof employmentInfoForm["gender"] })}
                        className={selectClass}>
                        {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Job Type</label>
                    <select name="job_type" id="job-type" data-testid="employment-job-type-select"
                        value={employmentInfoForm.preferred_job_type || ""}
                        onChange={(e) => updateForm({ preferred_job_type: e.target.value as typeof employmentInfoForm["preferred_job_type"] })}
                        className={selectClass}>
                        <option value="">Select Job Type</option>
                        {jobTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Employment Status</label>
                    <select name="employment_status" id="employment-status" data-testid="employment-status-select"
                        value={employmentInfoForm.employment_status ?? "student"}
                        onChange={(e) => updateForm({ employment_status: e.target.value as typeof employmentInfoForm["employment_status"] })}
                        className={selectClass}>
                        {employmentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Notice Period</label>
                    <select name="notice_period_days" id="notice-period" data-testid="employment-notice-period-select"
                        value={employmentInfoForm.notice_period_days ?? "Immediate"}
                        onChange={(e) => updateForm({ notice_period_days: e.target.value as typeof employmentInfoForm["notice_period_days"] })}
                        className={selectClass}>
                        <option value="">Select Notice Period</option>
                        {noticePeriod.map(days => <option key={days.value} value={days.value}>{days.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <MultiSelectAutocomplete
                    label="Preferred Industries"
                    options={industries}
                    values={employmentInfoForm.preferred_industries || []}
                    onChange={(vals) => updateForm({ preferred_industries: vals })}
                />
                <MultiSelectAutocomplete
                    label="Preferred Roles"
                    options={roles}
                    values={employmentInfoForm.preferred_roles || []}
                    onChange={(vals) => updateForm({ preferred_roles: vals })}
                />
                <MultiSelectAutocomplete
                    label="Preferred Locations"
                    options={locations}
                    values={employmentInfoForm.preferred_locations || []}
                    onChange={(vals) => updateForm({ preferred_locations: vals })}
                />
            </div>

            <div className="flex gap-2 justify-end pt-1 border-t border-gray-100">
                <button type="button" onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button type="button" data-testid="employment-info-save-btn" onClick={onSave} disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
