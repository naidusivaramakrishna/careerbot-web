"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getEducation, addEducation, updateEducation, deleteEducation, Education } from "@/api/userApi";
import EducationList from "./EducationList";
import EducationForm from "./EducationForm";
import { EducationSectionProps, ValidationError } from "../../_types/education-types";
import { useProfileContext } from "../../context/ProfileContext"; 

export default function EducationSection({
    tempProfile,
    setTempProfile,
}: EducationSectionProps) {
    const { setProfileData } = useProfileContext(); //  Get setProfileData from context
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [educationForm, setEducationForm] = useState<Partial<Education>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEducation = async () => {
            //  Only fetch if education data doesn't exist yet
            if (tempProfile.education && tempProfile.education.length > 0) {
                if (tempProfile.education.length > 0) setEditingIndex(null);
                return;
            }

            try {
                setLoading(true);
                const data = await getEducation();
                const updatedProfile = { ...tempProfile, education: data };
                setTempProfile(updatedProfile);
                setProfileData(updatedProfile); // ✅ Update context too
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load education details.");
            } finally {
                setLoading(false);
            }
        };
        fetchEducation();
    }, []); //  Run only once on mount

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            let updatedEducationList;

            if (editingIndex !== null) {
                const existing = tempProfile.education?.[editingIndex];
                if (existing?.id) {
                    const updated = await updateEducation(existing.id, educationForm);
                    const updatedList = [...(tempProfile.education || [])];
                    updatedList[editingIndex] = updated;
                    updatedEducationList = updatedList;
                    toast.success("Education updated successfully");
                } else {
                    const newEdu = await addEducation(educationForm as Omit<Education, "id">);
                    updatedEducationList = [...(tempProfile.education || []), newEdu];
                    toast.success("Education added successfully");
                }
            }

            // ✅ Update both local and context state - merge with existing profile data
            if (updatedEducationList) {
                setTempProfile((prev) => ({ ...prev, education: updatedEducationList }));
                setProfileData((prev) => {
                    const newProfile = { ...prev, education: updatedEducationList };
                    console.log('✅ Updated profile data after save:', newProfile);
                    return newProfile;
                });
            }

            setEditingIndex(null);
            setEducationForm({});
        } catch (err: any) {
            if (err?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(err.response.data.error.details.validation_errors);
            } else toast.error("Error saving education");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id?: string, index?: number) => {
        try {
            setLoading(true);
            if (id) await deleteEducation(id);
            const updated = [...(tempProfile.education || [])];
            updated.splice(index!, 1);

            // ✅ Update both local and context state using functional updates
            setTempProfile((prev) => ({ ...prev, education: updated }));
            setProfileData((prev) => {
                const newProfile = { ...prev, education: updated };
                console.log('✅ Updated profile data after delete:', newProfile);
                return newProfile;
            });

            toast.success("Education deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete education");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {editingIndex !== null ? (
                <EducationForm
                    educationForm={educationForm}
                    setEducationForm={setEducationForm}
                    onSave={handleSave}
                    onCancel={() => {
                        setEditingIndex(null);
                        setEducationForm({});
                        setValidationErrors([]);
                    }}
                    loading={loading}
                    validationErrors={validationErrors}
                />
            ) : (
                <EducationList
                    educationList={tempProfile.education || []}
                    onEdit={(edu, i) => {
                        setEducationForm(edu);
                        setEditingIndex(i);
                    }}
                    onDelete={handleDelete}
                    onAdd={() => {
                        setEducationForm({});
                        setEditingIndex((tempProfile.education?.length || 0) + 1);
                    }}
                />
            )}
        </div>
    );
}