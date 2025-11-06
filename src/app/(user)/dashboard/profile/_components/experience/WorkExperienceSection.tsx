"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getExperience, addExperience, updateExperience, deleteExperience, Experience } from "@/api/userApi";
import ExperienceForm from "./ExperienceForm";
import ExperienceList from "./ExperienceList";
import { ExperienceSectionProps, ValidationError } from "../../_types/experience-types";
import { useProfileContext } from "../../context/ProfileContext";

export default function WorkExperienceSection({
    tempProfile,
    setTempProfile,
}: ExperienceSectionProps) {
    const { setProfileData } = useProfileContext();
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [experienceForm, setExperienceForm] = useState<Partial<Experience>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        const fetchExperience = async () => {
            //  Only fetch if experience data doesn't exist yet
            if (tempProfile.workExperience && tempProfile.workExperience.length > 0) {
                if (tempProfile.workExperience.length > 0) setEditingIndex(null);
                return;
            }
            try {
                setLoading(true);
                const data = await getExperience();
                const updatedProfile = { ...tempProfile, workExperience: data }
                setTempProfile(updatedProfile);
                setProfileData(updatedProfile) //  Update context too
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load experience details.");
            } finally {
                setLoading(false);
            }
        };
        fetchExperience();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            let updatedExperienceList;
            if (editingIndex !== null) {
                const existing = tempProfile.workExperience?.[editingIndex];
                if (existing?.id) {
                    const updated = await updateExperience(existing.id, experienceForm);
                    const updatedList = [...(tempProfile.workExperience || [])];
                    updatedList[editingIndex] = updated;
                    updatedExperienceList = updatedList
                    toast.success("Experience updated successfully");
                } else {
                    const newExp = await addExperience(experienceForm as Omit<Experience, "id">);
                    updatedExperienceList = [...(tempProfile.workExperience || []), newExp]
                    toast.success("Experience added successfully");
                }
            }

            //  Update both local and context state - merge with existing profile data
            if (updatedExperienceList) {
                setTempProfile((prev) => ({ ...prev, workExperience: updatedExperienceList }));
                setProfileData((prev) => {
                    const newProfile = { ...prev, workExperience: updatedExperienceList };
                    console.log('✅ Updated profile data after save:', newProfile);
                    return newProfile;
                });
            }
            setEditingIndex(null);
            setExperienceForm({});
        } catch (err: any) {
            if (err?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(err.response.data.error.details.validation_errors);
            } else toast.error("Error saving experience");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id?: string, index?: number) => {
        try {
            setLoading(true);
            if (id) await deleteExperience(id);
            const updated = [...(tempProfile.workExperience || [])];
            updated.splice(index!, 1);

            //  Update both local and context state using functional updates
            setTempProfile((prev) => ({ ...prev, workExperience: updated }));
            setProfileData((prev) => {
                const newProfile = { ...prev, workExperience: updated };
                console.log('✅ Updated profile data after delete:', newProfile);
                return newProfile;
            });
            toast.success("Experience deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete experience");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {editingIndex !== null ? (
                <ExperienceForm
                    experienceForm={experienceForm}
                    setExperienceForm={setExperienceForm}
                    onSave={handleSave}
                    onCancel={() => {
                        setEditingIndex(null);
                        setExperienceForm({});
                        setValidationErrors([]);
                    }}
                    loading={loading}
                    validationErrors={validationErrors}
                />
            ) : (
                <ExperienceList
                    experienceList={tempProfile.workExperience || []}
                    onEdit={(exp, i) => {
                        setExperienceForm(exp);
                        setEditingIndex(i);
                    }}
                    onDelete={handleDelete}
                    onAdd={() => {
                        setExperienceForm({});
                        setEditingIndex((tempProfile.workExperience?.length || 0) + 1);
                    }}
                />
            )}
        </div>
    );
}



