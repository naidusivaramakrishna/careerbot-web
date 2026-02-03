"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getEducation, addEducation, updateEducation, deleteEducation, Education } from "@/api/userApi";
import EducationList from "./EducationList";
import EducationForm from "./EducationForm";
import { EducationSectionProps, ValidationError } from "../../_types/education-types";
import { useProfileContext } from "../../context/ProfileContext";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import Modal from "@/components/common/Modal";
import EducationEmptyState from "./EducationEmptyState";
import {logger} from "@/lib/logger"
export default function EducationSection({
    tempProfile,
    setTempProfile,
}: EducationSectionProps) {
    const { setProfileData } = useProfileContext(); //  Get setProfileData from context
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [educationForm, setEducationForm] = useState<Partial<Education>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id?: string;
        index?: number;
    } | null>(null);

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

            let updatedList = [...(tempProfile.education || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateEducation(existing.id, educationForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Education updated");
                }
            } else {
                const newEdu = await addEducation(educationForm as Omit<Education, "id">);
                updatedList.push(newEdu);
                toast.success("Education added");
            }

            setTempProfile((prev) => ({ ...prev, education: updatedList }));
            setProfileData((prev) => ({ ...prev, education: updatedList }));

            setIsModalOpen(false);
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
                logger.info('✅ Updated profile data after delete:', newProfile);
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

    const openAddModal = () => {
        setEducationForm({});
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: Partial<Education>, index: number) => {
        setEducationForm(exp);
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const modalTitle =
        editingIndex === null ? "Add Education" : "Edit Education";
    return (
        <div>
            {/* EMPTY STATE */}
            {!tempProfile.education?.length ? (
                <EducationEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    <EducationList
                        educationList={tempProfile.education}
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
                    <EducationForm
                        educationForm={educationForm}
                        setEducationForm={setEducationForm}
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
                title="Delete Education"
                description="Are you sure you want to delete this education? This action cannot be undone."
            />
        </div>
    );
}
