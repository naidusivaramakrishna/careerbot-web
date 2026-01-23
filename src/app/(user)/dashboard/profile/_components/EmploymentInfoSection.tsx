"use client";
import { useEffect, useState } from "react";
import InfoToggleGroup from "@/components/common/InfoToggleGroup";
import React from "react";
import { getEmploymentInfo, updateEmploymentInfo } from "@/api/userApi";
import { toast } from "sonner";
import MultiSelectAutocomplete from "@/components/common/MultiSelectAutocomplete";
import { useProfileContext } from "../context/ProfileContext";
import { ProfileData } from "../_types/ProfileData";

const industries = ["IT", "Finance", "Healthcare", "Education", "E-commerce"];
const roles = [
    "Frontend Developer",
    "React Developer",
    "NextJs Developer",
    "Angular Developer",
    "Backend Developer",
    "Java Developer",
    "Python Developer",
    "Fullstack Developer",
    "UI/UX Designer",
];
const locations = ["Hyderabad", "Bangalore", "Chennai", "Pune", "Delhi", "Mumbai", "Gurugram", "Gurgaon"];
const jobTypes = [
    { label: "Full-time", value: "full_time" },
    { label: "Part-time", value: "part_time" },
    { label: "Contract", value: "contract" },
    { label: "Internship", value: "internship" },
    { label: "Freelance", value: "freelance" },
];
const notice_period = [
    { label: "0", value: "0" },
    { label: "7", value: "7" },
    { label: "15", value: "15" },
    { label: "30", value: "30" },
    { label: "45", value: "45" },
    { label: "60", value: "60" },
];
interface EmploymentInfoSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

export default function EmploymentInfoSection({
    tempProfile,
    setTempProfile,
}: EmploymentInfoSectionProps) {
    const { setProfileData } = useProfileContext(); // ✅ Get context setter
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const form = tempProfile.employmentInfo || {};

    // Fetch employment info
    useEffect(() => {
        const fetchEmploymentInfo = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("access_token");
                if (!token) {
                    toast.error("Please log in to view employment information");
                    setLoading(false);
                    return;
                }

                const data = await getEmploymentInfo();

                // ✅ Update both tempProfile and global context
                setTempProfile((prev) => ({ ...prev, employmentInfo: data }));
                setProfileData((prev) => {
                    const newProfile = { ...prev, employmentInfo: data };
                    console.log('✅ Updated profile data with employment info:', newProfile);
                    return newProfile;
                });
            } catch (error) {
                console.error("Error fetching employment info:", error);
                toast.error("Failed to load employment information.");
            } finally {
                setLoading(false);
            }
        };
        fetchEmploymentInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Run only once on mount

    const updateForm = (updatedField: Partial<NonNullable<ProfileData["employmentInfo"]>>) => {
        setTempProfile({
            ...tempProfile,
            employmentInfo: { ...form, ...updatedField },
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateEmploymentInfo(form);

            // ✅ Update global context after successful save
            setProfileData((prev) => {
                const newProfile = { ...prev, employmentInfo: form };
                console.log('✅ Updated profile data after saving employment info:', newProfile);
                return newProfile;
            });

            toast.success("Employment information updated successfully");
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            toast.error("Error updating employment information");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <InfoToggleGroup
                    label="Authorized to Work?"
                    name="authorized_to_work"
                    options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                    ]}
                    value={form.authorized_to_work ?? false}
                    onChange={(val) => updateForm({ authorized_to_work: val as boolean })}
                />
                <InfoToggleGroup
                    label="Disability"
                    name="disability_status"
                    options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                        { label: "Prefer not to say", value: "prefer_not_to_say" },
                    ]}
                    value={form.disability_status ?? "No"}
                    onChange={(val) =>
                        updateForm({ disability_status: val as typeof form["disability_status"] })
                    }
                />
                <InfoToggleGroup
                    label="Willing to Relocate?"
                    name="willing_to_relocate"
                    options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                    ]}
                    value={form.willing_to_relocate ?? false}
                    onChange={(val) => updateForm({ willing_to_relocate: val as boolean })}
                />
                <InfoToggleGroup
                    label="Work Mode"
                    name="work_mode"
                    options={[
                        { label: "On-site", value: "onsite" },
                        { label: "Remote", value: "remote" },
                        { label: "Hybrid", value: "hybrid" },
                    ]}
                    value={form.work_mode ?? "On-site"}
                    onChange={(val) => updateForm({ work_mode: val as typeof form["work_mode"] })}
                />
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Gender</label>
                    <select
                        value={form.gender ?? "male"}
                        onChange={(e) => updateForm({ gender: e.target.value as typeof form["gender"] })}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Job-type</label>
                    <select
                        name="job_type"
                        value={form.preferred_job_type || ""}
                        onChange={(e) => updateForm({ preferred_job_type: e.target.value as typeof form["preferred_job_type"] })}
                        className="border border-neutral-200  p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
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
                    <label className="text-sm font-medium">Employment Status</label>
                    <select
                        value={form.employment_status ?? "student"}
                        onChange={(e) =>
                            updateForm({ employment_status: e.target.value as typeof form["employment_status"] })
                        }
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    >
                        <option value="student">Student</option>
                        <option value="employed">Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="freelancer">Freelancer</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Notice Period</label>
                    <select
                        value={form.notice_period_days ?? "Immediate"}
                        onChange={(e) =>
                            updateForm({ notice_period_days: e.target.value as typeof form["notice_period_days"] })
                        }
                        className="border border-neutral-200  p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    >
                        <option value="">Select Notice Period</option>
                        {notice_period.map((days) => (
                            <option key={days.value} value={days.value}>
                                {days.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
                <MultiSelectAutocomplete
                    label="Preferred Industries"
                    options={industries}
                    values={form.preferred_industries ?? []}
                    onChange={(vals) => updateForm({ preferred_industries: vals })}
                />

                <MultiSelectAutocomplete
                    label="Preferred Roles"
                    options={roles}
                    values={form.preferred_roles ?? []}
                    onChange={(vals) => updateForm({ preferred_roles: vals })}
                />

                <MultiSelectAutocomplete
                    label="Preferred Locations"
                    options={locations}
                    values={form.preferred_locations ?? []}
                    onChange={(vals) => updateForm({ preferred_locations: vals })}
                />
            </div>
            {hasChanges && (
                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#155DFC] text-white px-6 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            )}
        </div>
    );
}