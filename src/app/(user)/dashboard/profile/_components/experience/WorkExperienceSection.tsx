"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getExperience, addExperience, updateExperience, deleteExperience, Experience } from "@/api/userApi";
import ExperienceForm from "./ExperienceForm";
import ExperienceList from "./ExperienceList";
import { ExperienceSectionProps, ValidationError } from "../../_types/experience-types";
import { useProfileContext } from "../../context/ProfileContext";
import ExperienceEmptyState from "./ExperienceEmptyState";
import Modal from "@/components/common/Modal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

export default function WorkExperienceSection({
    tempProfile,
    setTempProfile,
}: ExperienceSectionProps) {
    const { setProfileData } = useProfileContext();
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [experienceForm, setExperienceForm] = useState<Partial<Experience>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id?: string;
        index?: number;
    } | null>(null);

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

            let updatedList = [...(tempProfile.workExperience || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateExperience(existing.id, experienceForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Experience updated");
                }
            } else {
                const newExp = await addExperience(experienceForm as Omit<Experience, "id">);
                updatedList.push(newExp);
                toast.success("Experience added");
            }

            setTempProfile((prev) => ({ ...prev, workExperience: updatedList }));
            setProfileData((prev) => ({ ...prev, workExperience: updatedList }));

            setIsModalOpen(false);
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

    const openAddModal = () => {
        setExperienceForm({});
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: Partial<Experience>, index: number) => {
        setExperienceForm(exp);
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const modalTitle =
        editingIndex === null ? "Add Work Experience" : "Edit Work Experience";

    return (
        <div>
            {/* EMPTY STATE */}
            {!tempProfile.workExperience?.length ? (
                <ExperienceEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    <ExperienceList
                        experienceList={tempProfile.workExperience}
                        onEdit={openEditModal}
                        onDelete={(id, index) => setDeleteTarget({ id, index })}
                        onAdd={openAddModal}
                    />
                </>
            )}

            {/* MODAL */}
            <div className="">
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalTitle}
                >
                    <ExperienceForm
                        experienceForm={experienceForm}
                        setExperienceForm={setExperienceForm}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        loading={loading}
                        validationErrors={validationErrors}
                    />
                </Modal>
            </div>
            <ConfirmDeleteModal
                open={!!deleteTarget}
                loading={loading}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await handleDelete(deleteTarget.id, deleteTarget.index);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
}



